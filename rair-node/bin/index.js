require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const morgan = require('morgan');
const session = require('express-session');
const RedisStorage = require('connect-redis')(session);
const seedDB = require('./seeds');
const log = require('./utils/logger')(module);
const StartHLS = require('./hls-starter');
const { redisPublisher, redisSubscriber, redisClient } = require('./services/redis');
const streamRoute = require('./routes/stream');
const apiV1Routes = require('./routes');
const mainErrorHandler = require('./utils/errors/mainErrorHandler');
const { textPurify } = require('./utils/helpers');

const { appSecretManager, vaultAppRoleTokenManager } = require('./vault');

const config = require('./config');

const { mongoConnectionManager } = require('./mongooseConnect');

const mongoConfig = require('./shared_backend_code_generated/config/mongoConfig');
const { emitEvent } = require('./integrations/socket.io');

async function main() {
  const mediaDirectories = ['./bin/banners'];

  mediaDirectories.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      log.info(folder, "doesn't exist, creating it now!");
      fs.mkdirSync(folder);
    }
  });

  await mongoConnectionManager.getMongooseConnection();

  const app = express();
  const httpServer = createServer(app);

  /* CORS */
  const origin = process.env.SERVICE_HOST;

  app.use(cors({ origin }));
  const socketIo = new Server(httpServer, {
    cors: {
      origin,
    },
  });

  const hls = await StartHLS();

  const context = {
    hls,
    config,
    textPurify,
    redis: {
      redisService: redisPublisher,
    },
  };

  const sessionMiddleware = session({
    store: new RedisStorage({
      client: redisClient,
      // config.session.ttl was removed from here and used
      //    for maxAge, because when maxAge used it will have no effect.
    }),
    secret: config.session.secret,
    saveUninitialized: true,
    resave: true,
    proxy: config.production,
    rolling: true,
    cookie: {
      sameSite: config.production ? 'none' : 'lax',
      httpOnly: config.production,
      secure: config.production,
      maxAge: (`${config.session.ttl}` * 60 * 60 * 1000), // TTL * hour
    },
  });

  await seedDB(context);

  app.use(morgan('dev'));
  app.use(bodyParser.raw());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.set('trust proxy', 1);

  app.use(sessionMiddleware);

  app.use('/stream', streamRoute(context));

  app.use('/api', apiV1Routes);
  app.use(mainErrorHandler);

  socketIo.on('connection', (socket) => {
    socket.on('disconnect', () => {
      log.info('User disconnected');
    });
    socket.on('login', (roomName) => {
      // console.info(`${roomName} connected`);
      socket.join(roomName);
    });
    socket.on('logout', (roomName) => {
      // console.info(`${roomName} disconnected`);
      socket.leave(roomName);
    });
  });
  redisSubscriber.subscribe('notifications', (notificationData) => {
    try {
      const { type, message, address, data = [] } = JSON.parse(notificationData);
      emitEvent(socketIo)(address, type, message, data);
    } catch (err) {
      log.error(err);
    }
  });
  app.set('socket', socketIo);

  httpServer.listen(config.port, () => {
    log.info(`Rairnode server listening at http://localhost:${config.port}`);
  });
}

(async () => {
  // Login with vault app role creds first
  await vaultAppRoleTokenManager.initialLogin();

  // Get app secrets from Vault
  await appSecretManager.getAppSecrets({
    vaultToken: vaultAppRoleTokenManager.getToken(),
    listOfSecretsToFetch: [
      mongoConfig.VAULT_MONGO_x509_SECRET_KEY,
    ],
  });

  // fire up the rest of the app
  await main();
})().catch((e) => {
  log.error(e);
  process.exit();
});
