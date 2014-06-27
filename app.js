
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var _ = require('underscore');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
  res.render('index', { title: 'Express' });
});

app.get('/phone', function(req, res){
  res.render('phone', { title: 'Express' });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var tokens = {};
var connections = [];
var clients = {};

io.on('connection', function(socket){
  console.log('a user connected');

  clients[socket.id] = socket;

  socket.token = Math.floor(Math.random()*500);

  tokens[socket.id] = socket.token;

  socket.emit('token', {
    token: socket.token
  });

  socket.on('sync', function(data) {

    var servers = _.map(tokens, function(server, key) {
        if (server == data.token) {
          return key;
        }
        return;
      }),
      success = false;

    servers = _.filter(servers, function(server) {
      return server !== undefined;
    });

    if (data.token && servers.length) {
      connections.push({
        client: socket.id,
        server: servers[0]
      });

      console.log('server', servers);
      delete tokens[servers[0]];
      delete tokens[socket.id];

      success = true;

      console.log('server found', servers[0]);
      clients[servers[0]].emit('synced-server');
    }

    socket.emit('synced', {
      success: success,
    });
  });

  socket.on('touch', function(data) {
    var servers = _.filter(connections, function(connection) {
        return connection.client == socket.id;
      });

    if (servers.length && clients[servers[0].server]) {
      clients[servers[0].server].emit('touched', data);
    }
  })

  socket.on('click', function(data) {
    var servers = _.filter(connections, function(connection) {
        return connection.server == socket.id;
      });

    if (servers.length) {
      clients[servers[0].client].emit('clicked', data);
    }
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    var connection = _.filter(connections, function(connection) {
      return (connection.client == socket.id || connection.server == socket.id);
    });

    _.each(connection, function(id) {
      if (clients[id.server]) {
        clients[id.server].emit('logout');
      }

      if (clients[id.client]) {
        clients[id.client].emit('logout');
      }
      delete connections[id];
    });

    delete tokens[socket.id];
    delete clients[socket.id];
  });
});

