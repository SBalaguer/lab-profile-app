'use strict';

require('dotenv').config();

const debug = require('debug')('lab-profile-app:server');
const app = require('./app');
const mongoose = require('mongoose');

const PORT = parseInt(process.env.PORT, 10);
const URI = process.env.MONGODB_URI;

const terminate = () => {
  debug('Terminating node app.');
  mongoose.disconnect()
    .then(() => {
      debug('Disconnect from database');
      process.exit(0);
    });
};

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
process.on('uncaughtException', error => {
  debug('There was an uncaught exception.');
  debug(error);
  terminate();
});

const onError = error => {
  const { syscall, port, code } = error;
  if (syscall === 'listen' && code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
    process.exit(1);
  } else {
    console.error('There was an unknown error.');
    debug(error);
    throw error;
  }
};

const onListening = server => {
  const { port } = server.address();
  debug(`Node server listening on ${ port }`);
};

const initiate = () => {
  app.set('port', PORT);

  const server = app.listen(PORT);
  server.on('error', error => onError(error));
  server.on('listening', () => onListening(server));
};

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then(() => {
    debug(`Database connected to URI "${ URI }"`);
    initiate();
  })
  .catch(error => {
    console.error(`There was an error connecting the database to URI "${ URI }"`);
    debug(error);
    process.exit(1);
  });
