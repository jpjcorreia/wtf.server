var http = require('http')
  , WtfUsers = require("./WtfModelUsers.js")
  , WtfAuthorizationKeys = require("./WtfModelAuthorizationKey.js")
  , WtfModelSessions = require("./WtfModelSessions.js")
  , socketio = require('socket.io')
  , port = 8000;
;
  
// Create the https server
var hs = null;


exports.getHS = function() {
    return hs;
};

exports.setHS = function(h) {
    hs = h;
}

/**
 * Return the HTTP server 
 */
exports.getServer = function(app) {
    hs = http.createServer(
        app
    );
    return hs;
};

/**
 * Listen for connections
 */
exports.listen = function() {
    console.log("@httpServer");
    // Bind the application
    if(hs!==null){
        hs.listen(
            process.env.PORT || port /* || 443*/, 
            process.env.IP || "192.168.1.69"
        );
    }
};

/**
 * Listen for socket connections
 */
exports.listenSocket = function(flags) {
    // Bind the application
    if(hs!==null){
        console.log('Socket created');
        var authSockets ={};
        /*console.log("[1]existent sockets: "+authSockets);
        if(authSockets.indexOf('KjYIG3donYodniqRmiHS') > 0){
            console.log("OKKKKKK");
        }else{
            console.log(authSockets[2].toString());
            console.log("MMMMMMMMOOOOOOOOOOOO");
        }*/
        //@TODO to session
        //http://www.danielbaulig.de/socket-ioexpress/
        //https://gist.github.com/2946792
        var io = socketio.listen(hs, flags).on('connection', function (socket) {
            
            console.log("Client "+socket.id+ " connected");
            //console.log("socket id: "+socket.id);
           // console.log("-----------: "+typeof client);
            //console.log("-----------: "+ JSON.stringify(client));
            //client.room = 'guess';
            //client.join('guess');
            
            socket.on('handshake', function (authData) {
                console.log("Trying handshake for "+authData.username);
                WtfAuthorizationKeys.validateAuthorizationKeyByUsername(authData.username, authData.hashKey, function(result){
                    console.log("Authorization key validated for username "+authData.username);
                    //fn(true);
                    authSockets[socket.id]=authData.username;
                    WtfUsers.getUserByUsername(authData.username, function(user){
                        for(key in authSockets){
                        	if(authSockets[key].userName==authData.username && result.application !=="webClient"){
                        		doDisconnect(authSockets[key].socket);
                        	}
                        }
                        
                        authSockets[socket.id]={userID:user.ID,userName:authData.username,application:result.application, "socket":socket};
                        //console.log(authSockets);
                        //console.log(authSockets[socket.id]);
                        //console.log(authSockets[socket.id].userID);
                        //console.log(authSockets[socket.id].userName);
                        WtfModelSessions.insertSession(result.application, user.ID, function(){
                            //Testing
                            console.log("Session inserted on the database");
                        });
                        
                        WtfModelSessions.insertEvent('login', user.ID, authData.hashKey+" "+socket.id, undefined,undefined, function(){
                            // Testing
                            console.log("Event inserted on the database");
                            WtfModelSessions.getLastEventFromUserOfType(user.ID, 'login', function(event){
                                console.log("Last login event from userid "+user.ID+"@"+event.date);
                            });
                        }, function(err){
                            // Testing
                            console.log(err);
                        });
                        
                    
                        socket.room = 'auths';
                        socket.join('auths');
                        console.log(authData.username+" join auths >"+Object.keys(io.sockets.clients("auths")).length);
                        
                        socket.emit('handshakeCompleted', true);
                        socket.broadcast.to('auths').emit('message',authData.username+': i am online');
                        socket.broadcast.to('auths').emit('notifyForUpdate', true);
                        
                        //socket.broadcast.to('auths').emit('message', "New client arrived");
                        //console.log("[2]existent sockets: "+authSockets);
                        //console.log("[3]the client socket: "+socket.id);
                    });
                    
                }, function(e){
                    console.log(e);
                    console.log("go off");
                    //fn(false);
                    doDisconnect(socket);
                });
            });
            socket.on('message', function (msg) {
                if(authSockets[socket.id] !== undefined){
                    // Testing
                    console.log('Message Received: ', JSON.stringify(msg));
                    socket.broadcast.to('auths').emit('message', msg);
                }else{
                    doDisconnect(socket);
                }
            });
            socket.on('geoLocation', function (msg) {
                //console.log('geoLocation:'+msg);
                if(authSockets[socket.id] !== undefined){
                    if(authSockets[socket.id].application!=="webClient"){
                        // Testing
                        //console.log('geoLocation: ', msg);
                        //console.log('identify user: ', authSockets[socket.id].userID);
                        
                        WtfModelSessions.insertEvent('geoLocation', authSockets[socket.id].userID, msg.latitude+","+msg.longitude, undefined, undefined, function(eventId){
	                        //console.log('geoLocation: ', msg);
	                        WtfModelSessions.getEventById(eventId, function(eventRow){
	                        	//console.log("event row:" +eventRow)
	                        	msg.date = eventRow.date;
		                        //console.log(msg);
		                        socket.broadcast.to('auths').emit('geoLocation', msg);
	                        });
                        });
                        
                        //socket.broadcast.to('auths').emit('message', msg.username+": "+msg.message);
                        //socket.broadcast.emit('message', msg);
                        //socket.broadcast.to('auths').emit('notifyForUpdate', true);
                    }
                }else{
                    doDisconnect(socket);
                }
            });
            
            socket.on('whoIsOn', function(fn) {
                if(authSockets[socket.id] !== undefined){
                    // Testing
                    console.log('whoIsOn requested by '+authSockets[socket.id].userID+" @"+socket.id);
                    
                    WtfModelSessions.getLastEventsFromConnectedUsersOfType('geoLocation', function(results){
                        var users = [];
                        for (var key in results) {
                            var userInfo = {};
                            if(results[key]['username'])
                                userInfo.username = results[key]['username'];
                            
                            if(results[key]['type'])
                                userInfo.type = results[key]['type'];
                                
                            if(results[key]['date'])
                                userInfo.date = results[key]['date'];
                                
                            if(results[key]['data']){
                                var latLong = results[key]['data'].split(",");
                                userInfo.latitude = latLong[0];
                                userInfo.longitude = latLong[1];
                            }
                            users.push(userInfo);
                        }
                        fn({users: users});
                    });
                }else{
                    doDisconnect(socket);
                }
            });
            socket.on('getRoomUsers', function(fn){
                if(authSockets[socket.id] !== undefined){
                    console.log("return users in room");
                    var users = howManyUsersOnline("auths");
                    fn(users);
                    //fn(howManyUsersOnline("auths"));
                }else{
                    doDisconnect(socket);
                }
            });
            socket.on('disconnect',function(){
                if(authSockets[socket.id] !== undefined){
                    WtfModelSessions.deleteSession(socket.id, authSockets[socket.id].userID, function(){
                        // Testing
                        console.log("Session deleted from database");
                    
                        WtfModelSessions.insertEvent('disconnect', authSockets[socket.id].userID, socket.id);
                    
                        console.log("remove Marker");
                        socket.broadcast.to('auths').emit('removeFromMap', authSockets[socket.id].userName);
                        socket.broadcast.to('auths').emit('message', authSockets[socket.id].userName+": disconneted");
                        delete authSockets[socket.id];
                        socket.leave(socket.room);
                        socket.broadcast.to('auths').emit('notifyForUpdate');
                    });
                }
                // Testing
                console.log("Client "+socket.id+ " disconnected");
            });
            
        });
        var doDisconnect = function (socket){
            if(authSockets[socket.id] !== undefined){
                delete authSockets[socket.id];
                socket.leave(socket.room);
            }
            socket.broadcast.to('auths').emit('notifyForUpdate', true);
            socket.disconnect(authSockets);
        };
        
        var howManyUsersOnline = function (room){
            var clients = io.sockets.clients(room);
            var users = [];
            for(var i = 0; i< Object.keys(clients).length; i++){
                users.push({username:authSockets[clients[i].id].userName,application:authSockets[clients[i].id].application});
                //console.log(authSockets[clients[i].id].userName);
            }
            //return Object.keys(clients).length;
            return users;
            //return 1;
        };
        /*io.configure(function() {
          function auth(data, fn) {
            // see below for data object
            // https://github.com/LearnBoost/Socket.IO-node/wiki/Configuring-Socket.IO
            
            var authorized = false;
            var handshakeErrorMessage = "Handshake error.";
            var authResult = false;
        
            // Do something to define authResult, e.g., ip blacklist
            // You can use data object for this purpose.
           // For example, use data.request.headers.cookie
            //console.log(data);
            var cookie = data.headers.cookie;
                console.log(cookie);
            //Isn't the best way... but is a way send the auth key here
            //if(data.query.teste)
            if (1==1) {
              authResult = true;
            }
        
            if (authResult) {
              authorized = true;
              handshakeErrorMessage = null;
            }
            
                console.log(authResult);
                console.log(data.query.teste);
            fn(handshakeErrorMessage, authResult);
          };
          
          //io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'json-polling']);
          io.set('authorization', auth);
        });*/
    }
    
};

/**
 * Everyone for nowjs
 */
/*exports.everyone = function(){
    if(hs!==null){
        nowjs.initialize(hs,{socketio: {transports: ['xhr-polling', 'jsonp-polling']}});
    }
}*/
/**
 * Nowjs on
 */
/*exports.nowjsOn = function(){
    if(socketio!==null){
        nowjs.on('connect', function (socket) {
    	    console.log("nowjs on");
        });
    }
}*/
