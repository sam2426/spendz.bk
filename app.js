const fs = require('fs');
const appConfig = require('./config/appConfig');
const express = require('express');
const app = express();
const http = require('http');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const routeLoggerMiddleware = require('./app/middlewares/routeLogger.js');
const logger = require('./app/libs/loggerLib');


const modelsPath = './app/models';
const routesPath = './app/routes';

app.use(bodyParser.json());
// app.use(bodyParser.json()) basically tells the system that you want json to be used.
app.use(bodyParser.urlencoded({ extended: false }));
// it basically tells the system whether you want to use a simple algorithm for shallow parsing (i.e. false) or complex algorithm for deep parsing that can deal with nested objects (i.e. true).
app.use(cookieParser());
// cookie-parser maybe omitted as it is part of express core now. https://stackoverflow.com/questions/27961320/when-should-i-use-cookie-parser-with-express-session
app.use(routeLoggerMiddleware.logIp);

//Bootstrap models
fs.readdirSync(modelsPath).forEach(function (file) {
  if (~file.indexOf('.js')) require(modelsPath + '/' + file)
});
// end Bootstrap models

// Bootstrap route
fs.readdirSync(routesPath).forEach(function (file) {
  if (~file.indexOf('.js')) {
    let route = require(routesPath + '/' + file);
    route.setRouter(app);
  }
});
// end bootstrap route

const server = http.createServer(app);
// start listening to http server
console.log(appConfig);
server.listen(appConfig.port);
server.on('error', onError);
server.on('listening', onListening);
// end server listening code

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    logger.error(error.code + ' not equal listen', 'serverOnErrorHandler', 10)
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(error.code + ':elavated privileges required', 'serverOnErrorHandler', 10);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(error.code + ':port is already in use.', 'serverOnErrorHandler', 10);
      process.exit(1);
      break;
    default:
      logger.error(error.code + ':some unknown error occured', 'serverOnErrorHandler', 10);
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {

  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  ('Listening on ' + bind);
  logger.info('server listening on port' + addr.port, 'serverOnListeningHandler', 10);
  console.log('running on port 3000');
  // let db = mongoose.connect(appConfig.db.uri, { useNewUrlParser: true });
  // ^ the above code works, but for more compatability,(remove some warnings) added options from mongoose docs.
  options = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
  };
  let db = mongoose.connect(appConfig.db.uri, options);
}


/**
 * database connection settings
 */
mongoose.connection.on('error', function (err) {
  console.log('database connection error');
  console.log(err);
  logger.error(err, 'mongoose connection on error handler', 10);
  process.exit(1)
}); // end mongoose connection error

mongoose.connection.on('open', function (err) {
  if (err) {
    console.log("database error");
    console.log(err);
    logger.error(err, 'mongoose connection open handler', 10)
    process.exit(1);
  } else {
    console.log("database connection open success");
    logger.info("database connection open", 'database connection open handler', 10)
  }
  
  /* Calling process.exit() will force the process to exit as quickly as possible even if there are still asynchronous operations pending that have not yet completed fully, including I/O operations to process.stdout and process.stderr. 
  * Node.js interprets non-zero codes as failure, and an exit code of 0 as success.  
  * https://nodejs.org/api/process.html#process_process_exit_code */
}); //end mongoose connection open handler

