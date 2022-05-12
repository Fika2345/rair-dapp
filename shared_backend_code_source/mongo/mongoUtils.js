const { appSecretManager } = require('../vault/appSecretManager');
const mongoConfig = require('../config/mongoConfig');

const getMongoConnectionStringURI = () => {
  // Check if we're using new Mongo URI system
  if(mongoConfig.GENERATE_MONGO_URI_WITH_VAULT_CREDENTIAL_UTIL !== 'true') {
    // If we're running locally, use the original url pattern
    console.log('Mongo URI: generated using legacy logic path');
    return mongoConfig.PRODUCTION === 'true' ? mongoConfig.MONGO_URI : mongoConfig.MONGO_URI_LOCAL
  }

  console.log('Mongo URI: generated using new vault based logic path');

  const passwordSecrets = appSecretManager.getSecretFromMemory(mongoConfig.VAULT_MONGO_USER_PASS_SECRET_KEY);
  
  // Verify that we have pulled secrets correctly
  if (
    !passwordSecrets || 
    !passwordSecrets['data'] ||
    !passwordSecrets['data']['username'] || 
    !passwordSecrets['data']['password']
  ) {
    throw new Error('Could find vault secrets during Mongo connection string generation process')
  }

  const username = passwordSecrets['data']['username'];
  const password = passwordSecrets['data']['password'];

  // Double check that we have appropriate mongo values coming in from ENV variables
  if(
    !mongoConfig.MONGO_DB_HOSTNAME ||
    !mongoConfig.MONGO_DB_NAME
  ) {
    throw new Error('Could not find mongo env variables during Mongo connection string generation process')
  }

  const databaseName = mongoConfig.MONGO_DB_NAME
  const hostname = mongoConfig.MONGO_DB_HOSTNAME;

  const mongoUri = `mongodb+srv://${username}:${password}@${hostname}/${databaseName}`
  return mongoUri;
}

module.exports = {
  getMongoConnectionStringURI
}