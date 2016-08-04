var Socket = module.exports = {};
var io = require('socket.io');
var Auth = require('../lib/Auth');
var users = {};

Socket.listen = function (server, callback) {
    Socket.io = io.listen(server);
    Socket.io.on('connection', Socket.connections)

    if (typeof callback == 'function') {
        return callback();
    }
}

Socket.connections = function (socket) {
    socket.on('token',function(token){
        Auth.jwtDecode(token,function(decoded){
            if(decoded.data){
                socket.join(decoded.data._id);
                decoded.data.socketid = socket.id;
                users[decoded.data._id] = decoded.data;
                Socket.io.sockets.emit('UsersOnline',users);
            }
        });
    });


    socket.on('message', function (data) {
        var message = {};
        message.sender = users[data._id].email;
        message.msg = data.message
        socket.to(data._id).emit('chat', message);
    });

    socket.on( 'logout', function() {
        console.log('disconnect: ' + socket.id);
        for(att in users){
            if(users[att].socketid == socket.id){
                delete users[att];
                Socket.io.sockets.emit('UsersOnline',users);
            }
        }

    });


    socket.on( 'disconnect', function() {
        console.log('disconnect: ' + socket.id);
        for(att in users){
            console.log(att)
            if(users[att].socketid == socket.id){
                delete users[att];
                Socket.io.sockets.emit('UsersOnline',users);
            }
        }

    });

    socket.on( 'connect_failed', function() {
        console.log('connect_failed');
    });

    socket.on( 'error', function() {
        console.log('error');
    });
}