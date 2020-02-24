var WtfModel = require("./WtfModel.js")
  , crypto = require('pwd')
  , tableName = 'users_tbl'
;


/*
WtfUsers.getAllUsers(function(results){
    var output = "<ul>";
    for (var i=0; i<results.length; i++){
        output+="<li><ul>";
        for (var result in results[i]){
            console.log(result+"-"+results[i][result]);
            output+="<li><strong>"+result+"</strong>: "+results[i][result]+"</li>";
        }
        output+="</ul></li>";
    }
    output+="</ul>";
    res.send(output+"<br/>");
});
*/
exports.getAllUsers = function(callback) {
    WtfModel.getConnection().query("select * from `"+tableName+"`", function(err, results, fields) {
        if (!WtfModel.errorLog(err)){
            // callback function returns employees array
            callback(WtfModel.getSimpleResults(results, fields));
        }
    });
};

/*
WtfUsers.insertUser({
    username : 'username1',
    password : 'password1',
    enabled : '1',
    confirmed : '1',
    email : 'email@null.pt'
}, function(userId){
    console.log("Utilizador "+userId+" inserido");
    WtfUsers.getUserById(userId, function(user){
       console.log("ID->"+user.ID); 
       console.log("email->"+user.email);
       console.log("username->"+user.username); 
       console.log("password->"+user.password); 
       console.log("salt->"+user.salt); 
       console.log("enabled->"+user.enabled); 
       console.log("confirmed->"+user.confirmed); 
    });
});
*/
exports.insertUser = function(user, callback, callbackOnError) {
    // hash the password and set the salt value
    var originalPassword = user.password;
    crypto.hash(user.password, function(err, salt, password){
        if(WtfModel.errorLog(err)){
            callbackOnError(err);
        }else{
            user.salt = salt;
            user.password = password;
            
            WtfModel.insert(tableName, user, callback, callbackOnError);
            user.originalPassword = originalPassword;
        }
    });
};

exports.getUserById = function(userId, callback, callbackOnError) {
    WtfModel.select("select * from `"+tableName+"` WHERE `ID` = ?", [userId], function(results) {
        callback(results[0]);
    }, callbackOnError);
};

exports.getUserByUsername = function(username, callback, callbackOnError) {
    WtfModel.select("select * from `"+tableName+"` WHERE `username` = ?", [username], function(results) {
        if(results!==undefined && results.length>0){
            callback(results[0]);
        }else if(callbackOnError){
            callbackOnError(new Error("No results"));
        }
    }, callbackOnError);
};

/*
WtfUsers.validateUserByPassword("username1", "password1", function(user){
    if(user){
        
        console.log("User authenticated");   
        console.log("ID->"+user.ID); 
        console.log("email->"+user.email);
        console.log("username->"+user.username); 
        console.log("password->"+user.password); 
        console.log("salt->"+user.salt); 
        console.log("enabled->"+user.enabled); 
        console.log("confirmed->"+user.confirmed); 
    }else{
        console.log("User not validated");   
    }
});
*/
exports.validateUserByPassword = function(username, password, callback, callbackOnError) {
    return exports.getUserByUsername(username, function(user){
        crypto.hash(password, user.salt, function(err, hash){
            if(WtfModel.errorLog(err)){
                callbackOnError(err);
                callback(err, undefined);
            }else{
                if (user.password == hash) {
                    callback(undefined, user);
                    return user;
                }
            }
            callback(new Error("Authentication error"), undefined);
            if(callbackOnError)
                callbackOnError(new Error("Authentication error"));
            return false;
        });
    }, function(){
        callback(new Error("Authentication error"), undefined);
        if(callbackOnError)
            callbackOnError(new Error("Authentication error"));
    });
};