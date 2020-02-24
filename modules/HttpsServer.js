var fs = require("fs")
  , http = require("./HttpServer.js")
  , https = require('https');
  
  
// Create the https server
var hs = null;

/**
 * Return the HTTPS server 
 */
http.getServer = function(app) {
    console.log("@httpsServer");
    http.setHS(https.createServer(
        {
            key:fs.readFileSync('cert/cert.key').toString(), 
            cert:fs.readFileSync('cert/cert.pem').toString()
        },
        app
    ));
    return http.getHS();
};

/**
 * Listen for connections
 *//*
http.listen = function() {
    // Bind the application
    if(hs!==null){
        hs.listen(
            process.env.PORT || 443, 
            process.env.IP || "0.0.0.0"
        );
    }
};
*/

module.exports = http;
