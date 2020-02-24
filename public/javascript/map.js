var markerCluster = null
  , username = null
  , map = null
  , markers = []
  , bound
  , infowindow
  , mobilepin
  , google=google
  , MarkerClusterer = MarkerClusterer
  , io
;

function initialize(){
    bound = new google.maps.LatLngBounds();
    
    infowindow = new google.maps.InfoWindow({
        content: ""
    });
    mobilepin = new google.maps.MarkerImage('/public/imgs/phones.png',
       new google.maps.Size(32, 37),
       new google.maps.Point(0,0),
       new google.maps.Point(0, 37));
       
    var center = new google.maps.LatLng(39.894566,-5.141602);
    var options = {
        'zoom': 6,
        'center': center,
        'mapTypeId':
            google.maps.MapTypeId.HYBRID,
            mapTypeControl: false,
            streetViewControl: false
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), options);
    
    //alert(data.photos[1]);
    /*for (var i = 0; i < 100; i++) {
      var latLng = new google.maps.LatLng(data.photos[i].latitude,
          data.photos[i].longitude);
      var marker = new google.maps.Marker({'position': latLng});
      markers.push(marker);
    }*/
    
    markerCluster = new MarkerClusterer(map, markers);
}
   
function addMarker(latitude,longitude, username, updateDate){
    console.log("->"+updateDate);
    var latLng = new google.maps.LatLng(latitude, longitude);
    var marker = new google.maps.Marker({'position': latLng,  'username':username});
    //console.log("Adding a new Marker:"+new Date(updateDate));
    var date = new Date(updateDate);
    date = date.getHours()+":"+date.getMinutes()+":"+date.getMinutes()+" - "+date.getDate() +"/"+date.getMonth()+"/"+date.getFullYear();
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(username+"<br>Lat.:"+latitude+" - Lon.:"+longitude+"<br>Last update:"+date);
        infowindow.open(map, this);
    });
    markers[username] = marker;
    markerCluster.addMarker(marker);
    return marker;
}
function updateMarker(latitude,longitude, username, updateDate){
    if(markers[username]!==undefined){
        markerCluster.removeMarker(markers[username]);
        delete markers[username];
    }
    addMarker(latitude,longitude, username, updateDate);
}
function deleteMarker(username){
    if(markers[username]!==undefined){
        markerCluster.removeMarker(markers[username]);
        delete markers[username];
    }
}


$(function() {
    $( "#accordion" )
        .accordion({
            collapsible: true,
            header: "> div > h3",
            heightStyle:"content"
        })
        .sortable({
                axis: "y",
                handle: "h3",
                stop: function( event, ui ) {
                    // IE doesn't register the blur when sorting
                    // so trigger focusout handlers to remove .ui-state-focus
                    ui.item.children( "h3" ).triggerHandler( "focusout" );
                }
    });
    $("#rightContent").hide();
    
    var toggleSidebar = function(e){
    	e.stopPropagation();
    
        if($("div.dockheader").hasClass('expanded')){
            $("div.dockheader").removeClass("expanded");
            $("#rightContent").hide();
            $("#map_canvas").animate({
                width: "99%"
                }, 500
            );
            $("#rightSidebar").animate({
                width: "1%"
                }, 500, function() {
            });
            //x();
        }else{
            $("div.dockheader").addClass("expanded");
            $("#map_canvas").animate({
                width: "80%"
                }, 500
            );
            $("#rightSidebar").animate({
                width: "20%"
                }, 500, function() {
                    $("#rightContent").show();
            });
        }
    };
    
    /*$("#rightSidebar").click(function(){
        toggleSidebar();
    });*/
    $("div.dockheader").click(function(e){
        toggleSidebar(e);
    });
    
    /*var x = function(){
	    var handler = function(e){
	        toggleSidebar(e);
	        $("#rightSidebar").unbind('click', handler);
	    };
	    $("#rightSidebar").bind('click',handler);
    };
    x();*/
    var iosocket = io.connect();
    
    iosocket.on('handshakeCompleted', function() {
        // The server have notified this socket that the authentication is completed and the connection can be used
        iosocket.emit('whoIsOn', function(users){
            var bound = new google.maps.LatLngBounds();
            for(var i in users){
                console.log(users[i]);
                for(var j=0; j<users[i].length;j++){
                    //console.log(users[i][j]);
                    var marker = addMarker(users[i][j].latitude, users[i][j].longitude, users[i][j].username, users[i][j].date);
                    bound.extend(marker.getPosition());
                    //$('#onlineClients').append('<li>'+users[i][j].username+'</li>');
                }
                console.log("doing update: "+users[i].length);
            }
            //console.log(nUsers);
            if(users[i].length>0){
                map.fitBounds(bound);
            }
            updateClients();
        });
    });
    
    iosocket.on('message', function(message){
        $('#incomingSocket').append($('<li></li>').text(message));
    });
    
    iosocket.on('geoLocation', function(message) {
        //console.log(message);
        //console.log(message.latitude);
        $('#incomingSocket').append($('<li></li>').text(message.username+': update position'));
        updateMarker(message.latitude, message.longitude, message.username, message.date);
    });
    iosocket.on('removeFromMap', function(username) {
        console.log('removeFromMap:' +username);
        deleteMarker(username);
    });
    iosocket.on('notifyForUpdate', function(message){
        console.log("notified for update");
        updateClients();
    });
    iosocket.on('disconnect', function() {
        console.log('disconnet');
        deleteMarker('centralOperator');
        $('#incomingSocket').append('<li>I am disconnected by server</li>');
    });

    iosocket.on('connect', function () {
        iosocket.emit('handshake',{'username':'centralOperator','hashKey':'de4e98582f08e2dc4425f60d0d79d6b3'});
        $('#loading').hide();
        $('#outgoingChatMessage').show();
        $('#incomingSocket').append($('<li>I am connected</li>'));
    });
    var newMsg = {geolocation:false};
    $('#outgoingChatMessage').keypress(function(event) {
        if(event.which == 13) {
            event.preventDefault();
           // console.log($('#distritos').val());
            /*if($('#distritos').val()=="Auto"){
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(loc){
                        newMsg = {
                            username:$('#usernameHolder').html(),
                            message:$('#outgoingChatMessage').val(),
                            latitude:loc.coords.latitude,
                            longitude:loc.coords.longitude
                        };
                        emitData(newMsg);
                    });
                }
            }else{
                newMsg = {
                    username:$('#usernameHolder').html(),
                    message:$('#outgoingChatMessage').val(),
                    latitude:distritos[$('#distritos').val()].latitude,
                    longitude:distritos[$('#distritos').val()].longitude
                };
                emitData(newMsg);
            }*/
            iosocket.emit('message',$('#outgoingChatMessage').val());
        	$('#outgoingChatMessage').val('');
        }
    });
    $('#createNewUser').submit(function(event) {
        console.log(event);
        /* stop form from submitting normally */
        event.preventDefault(); 
        /* Send the data using post and put the results in a div */
        /*$.post( '/new-user', $("#createNewUser").serialize(),
            function( data ) {
                console.log(data);
            }
        );*/
        return false;
    });
    
    /*function emitData(data){
        //console.log("emit " +$('#outgoingChatMessage').val());
        iosocket.emit('geoLocation',data);
        $('#outgoingChatMessage').val('');
        //iosocket.send(data.message);
        $('#incomingSocket').append($('<li></li>').text(data.username+": "+data.message));
        console.log("Adding to map ");
        updateMarker(data.latitude,data.longitude,data.username, new Date());
    }*/
    function updateClients(){
        $('#onlineClients').html('');
        iosocket.emit('getRoomUsers', function(users){
            //console.log("---->"+users);
            //console.log("---->"+users);
            var online = 0;
            for(var i=0; i<users.length;i++){
                //console.log("---->"+users[i].application);
                if(users[i].application !=="webClient"){
                    $('#onlineClients').append('<li>'+users[i].username+'</li>');
                    online++;
                }
            }
            $('#counterHolder').html(online);
            //console.log("doing update: "+users.length);
            
            //console.log(nUsers);
        });
    }

});
//}