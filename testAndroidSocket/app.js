var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io');
 
var server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html'));
}).listen(process.env.PORT, function() {
    console.log('Listening at: '+process.env.IP+':'+process.env.PORT);
});
 
socketio.listen(server).on('connection', function (socket) {
    socket.on('message', function (msg) {
        console.log('Message Received: ', msg);
        socket.broadcast.emit('message', msg);
    });
}); 

//lib android https://github.com/Gottox/socket.io-java-client