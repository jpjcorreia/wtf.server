var WtfModel = require("./WtfModel.js")
  , crypto = require('crypto')
  , WtfUsers = require("./WtfModelUsers.js")
  , passwordSize=128
  , tableName = 'authorizations_tbl'
;
  
var createHash = function(key, password, hashAlgorithm){
    if(hashAlgorithm===undefined)
        hashAlgorithm = 'sha256';
    try {
        //var hash = crypto.createHmac(hashAlgorithm, key).update(password).digest('hex');
        var hash = crypto.createHash(hashAlgorithm).update(password).digest('hex');
        return hash;
    } catch (ex) {
        console.log(ex);
    }
    return "";
};

exports.generateAuthorizationKey = function(user, callback){
    var hash = createHash(user.password, crypto.randomBytes(passwordSize).toString('hex'));
    if(callback!==undefined)
        callback(hash);
        
    return hash;
};

exports.getAuthorizationKeyById = function(keyId, callback, callbackOnError) {
    WtfModel.select("select * from `"+tableName+"` WHERE ID = ?", [keyId], function(results) {
        if(callback!==undefined)
            callback(results[0]);
    }, callbackOnError);
};

exports.insertAuthorizationKey = function(key, user, callback, callbackOnError) {
    var insertKey = function(user){
        if(user!==undefined/* && user.password!==undefined*/){
            var hash;
            if(key.key===undefined || key.key===""){
                hash = createHash(undefined, crypto.randomBytes(passwordSize).toString('hex'), 'md5');
            }else{
                hash = key.key;
            }
            key.key = createHash(user.password, hash);
                
            if(key.user_id===undefined)
                key.user_id = user.ID
                
            if(key.creation_date===undefined)
                key.creation_date = "CURRENT_TIMESTAMP()"
                
            WtfModel.insert(tableName, key, function(keyID){
                if(callback!==undefined)
                    exports.getAuthorizationKeyById(keyID, function(key){
                        key.key = hash;
                        callback(key);
                    });
            }, callbackOnError);
        }
    };
    
    if(!isNaN(user)){
        user = WtfUsers.getUserById(user, insertKey);
    }else{
        insertKey(user);
    }
};

/*
WtfAuthorizationKeys.insertNewUserAuthorizationKeyForApplication(10, "teste", function(key){
    console.log("ID->"+key.ID); 
    console.log("user_id->"+key.user_id);
    console.log("key->"+key.key);
    console.log("lenght->"+key.key.length);
    console.log("application->"+key.application);
    
    WtfAuthorizationKeys.validateAuthorizationKey(key.user_id, key.key, function(){
        console.log("Authorization key validated");
    }, function(e){
        console.log(e);
    });
});
*/
exports.insertNewUserAuthorizationKeyForApplication = function(user, application, callback, callbackOnError) {
    var insertKey = function(user){
        if(user!==undefined && user.ID!==undefined){
            var key = {
                user_id: user.ID
            };
            
            if(application!==undefined)
                key.application = application;
                
            exports.insertAuthorizationKey(key, user, callback, callbackOnError);
        }
    };
    
    if(!isNaN(user)){
        user = WtfUsers.getUserById(user, insertKey);
    }else{
        insertKey(user);
    }
};


exports.validateAuthorizationKey = function(user, authorizationKey, callback, callbackOnError) {
    var q = function(user){
        WtfModel.select("SELECT `ID`, `application` FROM `"+tableName+"` WHERE `user_id` = ? AND `key` = ? AND `expired`<>1 AND (`expiration_date` > NOW() OR `expiration_date` IS NULL)", [user.ID, createHash(user.password, authorizationKey)], function(results) {
            if(results!==undefined && results.length>0){
                callback(results[0]);
                return true;
            }else if(callbackOnError){
                callbackOnError(new Error("Authorization key validation failed"));
            }
        }, callbackOnError);
    };
    
    if(!isNaN(user)){
        return WtfUsers.getUserById(user, q);
    }
    return q(user);
};


/*
// Should fail (invalidated by date)
WtfAuthorizationKeys.validateAuthorizationKeyByUsername("username1", "c6882a1a34b6fa4b762b2a6c2c91ae63", function(){
    console.log("Authorization key validated");
}, function(e){
    console.log(e);
});

// Should fail (invalidated by flag)
WtfAuthorizationKeys.validateAuthorizationKeyByUsername("username1", "904770ba0a85bc4ebcaf1b6ea0e57f99", function(){
    console.log("Authorization key validated");
}, function(e){
    console.log(e);
});

// Should validate
WtfAuthorizationKeys.validateAuthorizationKeyByUsername("username1", "eea8fe961a6e9a2e83d1c0062fcc840e", function(){
    console.log("Authorization key validated");
}, function(e){
    console.log(e);
});

res.render('index', {
    title: 'test client ',
    messages : "Hello, "+req.user.username+", from Cloud!"
});
*/
exports.validateAuthorizationKeyByUsername = function(username, authorizationKey, callback, callbackOnError) {
    return WtfUsers.getUserByUsername(username, function(user){
        return exports.validateAuthorizationKey(user, authorizationKey, callback, callbackOnError);
    });
};