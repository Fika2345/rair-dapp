const axios = require('axios');
const {
  getVaultNamespace,
  getVaultUrl,
  getAppRoleIDFromEnv,
  getAppRoleSecretIDFromEnv,
} = require('./vaultUtils');

class VaultAppRoleTokenManager {
  constructor() {
    // token that we pulled from Vault App role login
    this.token = null;
    this.authData = null;

    // setTimeout object reference
    this.tokenRenewalTimeout = null;

    // fire the initial call to get token
    // when class is fisrt instantiated
  }

  initialLogin() {
    return new Promise((resolve, reject) => {
      this.getTokenWithAppRoleCreds()
        .then(() => {
          console.log('Initial app role login suceeded');
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getAppRoleLoginURL() {
    return `${getVaultUrl()}/v1/auth/approle/login`;
  }

  getTokenRenewSelfUrl() {
    return `${getVaultUrl()}/v1/auth/token/renew-self`;
  }

  async getTokenWithAppRoleCreds() {
    try {
      // make login query to Vault
      const axiosParams = {
        method: 'POST',
        url: this.getAppRoleLoginURL(),
        headers: {
          'X-Vault-Request': true,
          'X-Vault-Namespace': getVaultNamespace(),
        },
        data: {
          role_id: getAppRoleIDFromEnv(),
          secret_id: getAppRoleSecretIDFromEnv(),
        },
      };
      const res = await axios(axiosParams);

      if (res.status !== 200) {
        throw new Error('Error getting token! Received non 200 code from App Role Login url');
      }

      // pull from API response
      const { auth } = res.data;

      // save token in this class
      this.saveAuthData(auth);

      // start timer to do it again
      this.startRenewalTimeout({
        leaseDurationSeconds: auth.lease_duration,
      });
    } catch (err) {
      throw err;
    }
  }

  startRenewalTimeout({ leaseDurationSeconds }) {
    // clear timeout reference if we have one
    if (this.tokenRenewalTimeout !== null) {
      clearTimeout(this.tokenRenewalTimeout);
    }

    const halfOfLeaseDuration = (leaseDurationSeconds / 2) * 1000;

    this.tokenRenewalTimeout = setTimeout(() => {
      this.renewToken();
    }, halfOfLeaseDuration);
  }

  saveAuthData(authData) {
    this.authData = authData;
  }

  getToken() {
    if (this.authData === null) {
      return null;
    }
    return this.authData.client_token;
  }

  async renewToken() {
    try {
      // make call to get new token using existing token
      if (this.token === null) throw new Error('Existing token is null!');

      const res = await axios({
        method: 'POST',
        url: this.getTokenRenewSelfUrl(),
        headers: {
          'X-Vault-Request': true,
          'X-Vault-Namespace': getVaultNamespace(),
          'X-Vault-Token': this.token,
        },
        data: {
          increment: 0,
        },
      });

      if (res.status !== 200) {
        throw new Error('Error renewing token, received non 200 code trying to renew self.');
      }

      const { auth } = res.data;
      this.saveAuthData(res.data.auth);

      this.startRenewalTimeout({
        leaseDurationSeconds: auth.lease_duration,
      });

    } catch(err) {
      throw new Error('Error renewing token in Vault App Role token manager')
    }
  }
}

// instantiate one class and export it
// we only want one instance of this in the app
const vaultAppRoleTokenManager = new VaultAppRoleTokenManager();

module.exports = {
  vaultAppRoleTokenManager,
};