// import the interface (required) and any other needed scripts
     importScripts('/public/javascript/runnable.min.js', "/socket.io/socket.io.js");


// declare the run method, and implement the main logic
onmessage = function(e) {
        var action = e.data;
        
        var iosocket = io.connect();
    
        iosocket.on('handshakeCompleted', function() {
            //console.log("handshake completed");
            //send(e.data.userData.username+": handshake completed");
            //xpto();
            //$('#handS').html("handshake completed");
            startMoving(iosocket, e.data);
        });
        iosocket.on('connect', function () {
            iosocket.emit('handshake',{'username':e.data.userData.username,'hashKey':e.data.userData.hashKey});
            //iosocket.send("buuuu");
            //$('#incomingSocket').append($('<li>Connected</li>'));
        });
        
        //alert(action)
        /*
        var html = ['<table>'];
        for (var i = 0; i < len; ++i) {
                html.push('<tr><td>Row #</td><td>');
                html.push(i);
                html.push('</td></tr>');
        }
        html.push('</table>');
        var table = html.join('');
        */

        /*var res;
        ajax('get', '../includes/api.php', {action:action}, function(data) {
                res = data;
        });*/
        
        // send the response back to the caller
        //send(e.data.userData.username);
};
function startMoving(iosocket, data){
    var lat = data.lat;
    var lon = data.lon;
    var loop =0;
    var increment = 0.00025;
    setInterval(function() {
        var nLat = lat+(loop*increment);
        var nLon = (lon+(loop*increment));
         var newMsg = {
                username:data.userData.username,
                message:'Go to '+nLat+" | "+nLon,
                latitude:nLat,
                longitude:nLon
            };
        iosocket.emit('geoLocation', newMsg);
        send({userPosition:data.userPosition, message:data.userData.username+": "+newMsg.message});
        loop++;
        //$('#incomingChatMessages').append($('<li></li>').text(newMsg.message));
        
    }, 10000);
}