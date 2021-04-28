## Install all necessary packages
```shell
// Update your linux distro
apt update
apt upgrade

// Necessary to build modules
apt install build-essential
// Somewhat necessary for encryption
apt install python3.9
// Necessary for video conversion
apt install ffmpeg

// Install IPFS from go - https://docs.ipfs.io/install/command-line/#official-distributions
wget https://dist.ipfs.io/go-ipfs/v0.8.0/go-ipfs_v0.8.0_linux-amd64.tar.gz
tar -xvzf go-ipfs_v0.8.0_linux-amd64.tar.gz
cd go-ipfs
sudo bash install.sh

// Check that IPFS properly installed
ipfs --version


// Install node
// Check https://github.com/nvm-sh/nvm for the latest install method
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
// Requires reopening the terminal

nvm ls-remote
// Find latest stable node version
nvm install vX.XX.XX
nvm use vX.XX.XX

// PM2 keeps ipfs daemon and node running!
npm i -g pm2
// Set PM2 to launch at startup
pm2 startup
```

## Set up IPFS and add as startup task
```shell
ipfs init --profile server
pm2 start ipfs --name "ipfs" -- daemon
```

## Set up RAIR node as a service
```shell
sudo apt install git
git clone https://github.com/rairtech/weiyirait/backend326.git
cd backend326
git checkout
npm install

vim .env
// Add this to the .env file for current default configurations for the test server
JWT_SECRET=UGt70v4#mZ0J@vHFK%b
INFURA_PROJECT_ID=f8232f48540f48f0a7543643e57d6278
IPFS_GATEWAY=http://localhost:8080/ipfs
IPFS_API=http://localhost:5001
PORT=5000
PINATA_KEY=aaa581a498f99ed85279
PINATA_SECRET=92a0712843d62a70a2cad282bb7369b42be4ddd288543cc861a792d91d3c10a1

pm2 start npm --name "rair" -- start
```

## Useful PM2 commands 
```shell
// Stop a process (rair / ipfs)
pm2 stop <name>
// Start a process
pm2 start <name>
// Restart a process
pm2 restart <name>
// Show the last 15 lines of output
pm2 logs <name>
// Show the last N lines of output
pm2 logs <name> --lines=<N>
// Set PM2 to run at startup
pm2 startup
// Stop PM2 from running at startup
pm2 unstartup
```

## Set up the dashboard webpage (Current)
```shell
// Easier to build locally and upload the compiled frontend to the server

// in a local shell
git clone https://github.com/rairtech/weiyirait/rair-front-master.git
cd rair-front-master
npm install && npm run build
// move the build to your nginx webroot directory

sudo cp -r build/ /var/www
```

## Set up NGINX web server and Reverse Proxy
```shell
apt install -y nginx
sudo ufw allow 80
sudo systemctl enable nginx
systemctl start nginx

sudo nano /etc/nginx/conf.d/app.conf
// configure nginx to communicate with the backend node
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root /var/www;

  client_max_body_size 0;

  proxy_read_timeout 300;
  proxy_connect_timeout 300;
  proxy_send_timeout 300;

  location / {
    index index.html;
    try_files $uri $uri/ /index.html;
  }

  location /thumbnails/ {
    root /home/rair/demo-decrypt-node/bin/Videos/Thumbnails;
  }

  location ~ ^/(thumbnails|api|stream) {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}

// restart nginx with the new config

sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

# Updating server with code updates
Since there is no CI/CD set up this is a manual process.

## Update the rair-node
```shell
cd backend326
git pull
npm install
pm2 restart rair
```

## Update the UI
```shell
// locally 
cd rair-front
git pull
npm install && npm run build

// log back in to the server
sudo rm -rf /var/www
sudo cp -r build/ /var/www
```