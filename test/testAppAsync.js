var express = require('express');
var path = require('path');
var http = require('http');
var rr = require('ractive-render');

var socketHandler = require('./appSocketAsync');

var app = express();

var port = 3006;

app.set('port', port);

app.engine('html', rr.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);
rr.clearCache();

app.use(express.static(path.join(__dirname, 'js/')));
app.use(express.static(path.join(__dirname, 'css/')));

app.get('/', function (req, res) {
    res.render('test');
});


var server = http.createServer(app);
socketHandler(server, app);

/* Start the server */
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
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
  console.log('Listening on ' + bind);
}