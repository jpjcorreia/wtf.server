var express = require('express')
  , i18n = require("i18n")
  , server = require("./modules/HttpsServer.js")
  //, server = require("./modules/HttpServer.js")
  , WtfAuthorizationKeys = require("./modules/WtfModelAuthorizationKey.js")
  , WtfUsers = require("./modules/WtfModelUsers.js")
  //, urlForKey = "wtf2.codedmind.c9.io"
  , urlForKey = "cariano.no-ip.info:8000"
  , port = process.env.PORT || 8000;
  //, socketio = require('socket.io')
  ;
i18n.configure({
    // setup some locales - other locales default to en silently
    locales:['en', 'pt', 'pt_PT']
    // disable locale file updates in production mode
    //, updateFiles: false
});

// Load the express framework
var app = express();


// Configure the application
app.configure(function(){
    // Create the server
    app.set('server', server.getServer(app));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    
    // using 'accept-language' header to guess language settings
    app.use(i18n.init);
    
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname, 'public'));
    app.use(express.favicon());
    
    /*
    
    
  /*app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.favicon());
  app.use(express.logger('dev'));*/
});


/* Authentication */
var auth = express.basicAuth(function(user, pass, fn){
    WtfUsers.validateUserByPassword(user, pass, fn);
},"Where's The Fire?..");

var map = function(req, res, next){
    res.render( 'map', {
        title : i18n.__('Map view'),
        welcome : i18n.__("Hello, "),
        username: req.user.username,
        logout : i18n.__("Logout?"),
        h3title : i18n.__("New user "),
        usernameLabel: i18n.__("Username: "),
        passwordLabel: i18n.__("Password: "),
        emailLabel: i18n.__("Email: "),
        createUserLabel: i18n.__("Create user")
    });
};


app.get('/', auth, map);
app.get('/map', auth, map);
app.get('/movingClient', auth, function(req, res, next){
    res.render( 'movingClient', {
        title : i18n.__('Moving Client')
    });
});


app.get('/new-user', auth, function(req, res, next){
    res.render( 'new-user', {
	title : i18n.__('New user'),
	message : i18n.__("New user: "),
	usernameLabel: i18n.__("Username: "),
	passwordLabel: i18n.__("Password: "),
	emailLabel: i18n.__("Email: "),
	createUserLabel: i18n.__("Create user")
    });
});

app.post('/new-user', auth, function(req, res){
    if(req.body.user!==undefined && req.body.user.name!==undefined && req.body.user.name!=="" && req.body.user.pass!==undefined && req.body.user.pass!=="" ){
        WtfUsers.insertUser({
            username : req.body.user.name,
            password : req.body.user.pass,
            enabled : '1',
            confirmed : '1',
            email : req.body.user.email
        }, function(userId){
            res.format({
                text: function(){
                    res.end(i18n.__('User %s added', req.body.user.name));
                },
                html: function(){
                    res.end(i18n.__('User <strong>%s</strong> added', req.body.user.name));
                },
                json: function(){
                    res.end({ result: true });
                },
                default: function(){
                    res.end('');
                }
            });
        });
    }else
        res.end('');
});

app.get('/new-authorization-key', auth, function(req, res, next){
    var e = function(e){
        res.format({
            text: function(){
                res.end(i18n.__('Error: %s', e));
            },
            html: function(){
                res.end(i18n.__('<strong>Error:</strong> %s', e));
            },
            json: function(){
                res.end({ error: e });
            },
            default: function(){
                res.end('');
            }
        });
    };
    WtfUsers.getUserByUsername(req.user.username, function(user){
        WtfAuthorizationKeys.insertNewUserAuthorizationKeyForApplication(user.ID, "browser", function(key){
            WtfAuthorizationKeys.validateAuthorizationKey(key.user_id, key.key, function(){
                res.render( 'new-authorization-key', {
                    title : i18n.__('New authorization key'),
                    message : i18n.__("New authentication key generated: "),
                    usernameLabel: i18n.__("Username: "),
                    passwordLabel: i18n.__("Password: "),
                    username: req.user.username,
                    password: key.key,
                    url : "wtf://wtf.estg.ipleiria.pt/"+req.protocol + "/"+urlForKey+"/"+req.user.username+"/"+key.key+"/"
                    //url : "wtf://wtf.estg.ipleiria.pt/"+req.protocol + "/" + req.host+""+ ( port == 80 || port == 443 ? '' : ':'+port )+"/"+req.user.username+"/"+key.key+"/"
                });
            }, e);
        }, e);
    }, e);
});









app.get('/logout', function(req, res, next){
    res.statusCode = 401;
    res.setHeader('Location', '/');
    res.format({
        text: function(){
            res.end(i18n.__('Session terminated!'));
        },
        html: function(){
            res.end(i18n.__('<strong>Session terminated!</strong> <a href="/">Go back</a>'));
        },
        json: function(){
            res.end({ message: true });
        },
        default: function(){
            res.end('');
        }
    });
});


server.listen();
    console.log('Server '+(process.env.IP || "0.0.0.0")+"@"+(port));
    
server.listenSocket({ log: false }); 




/*
@TOOD
//http://www.arsnova.cc/web-development-articles/2012-04-13/clustering-grouping-markers-google-maps
//http://www.birdtheme.org/useful/v3tool.html
*/
