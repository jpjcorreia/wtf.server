var WtfModel = require("./WtfModel.js")
  , sessionsTableName = 'sessions_tbl'
  , eventsTableName = 'events_tbl'
  , usersTableName = 'users_tbl'
;

var virtualTableProcedure = exports.createVirtualTable  = function(){
  
    WtfModel.getConnection().query("CREATE TEMPORARY TABLE IF NOT EXISTS `"+sessionsTableName+"` ( `user_id` bigint(20) unsigned NOT NULL, `application` varchar(255) NOT NULL, UNIQUE KEY `session_id` (`user_id`,`application`)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Table to store the active sessions';", function(err) {
        WtfModel.errorLog(err);
        WtfModel.getConnection().query("TRUNCATE TABLE `"+sessionsTableName+"`;", function(err) {
            WtfModel.errorLog(err);
        });
    });
};

exports.insertSession = function(application, user, callback, callbackOnError) {
    if(!isNaN(user)){
        WtfModel.insert(sessionsTableName, {
            user_id: user,
            application: application
        }, function(keyID){
            if(callback!==undefined)
                callback(true);
        }, callbackOnError);
    }else if(callbackOnError!==undefined){
        callbackOnError("No user id provided");
    }
};

exports.deleteSession = function(application, userId, callback, callbackOnError) {
    if(!isNaN(userId)){
        WtfModel.getConnection().query("DELETE FROM `"+sessionsTableName+"` WHERE `user_id`= ? AND `application` = ?;", [userId, application], function(err) {
            if(!WtfModel.errorLog(err)){
                if(callback!==undefined)
                    callback(true);
            }else{
                if(callbackOnError!==undefined)
                    callbackOnError(err);
            }
        });
    }else if(callbackOnError!==undefined){
        callbackOnError("No user id provided");
    }
};

exports.insertEvent = function(type, userId, data, incidentId, deviceId, callback, callbackOnError) {
    if(!isNaN(userId) && type!==undefined && data!==undefined){
        var parameters = {
            type: type,
            user_id: userId,
            data: data
        };
        if(!isNaN(incidentId))
            parameters.incident_id = incidentId;
        
        if(!isNaN(deviceId))
            parameters.device_id = deviceId;
            
        WtfModel.insert(eventsTableName, parameters, function(keyID){
            if(callback!==undefined)
                callback(keyID);
        }, callbackOnError);
    }else if(callbackOnError!==undefined){
        callbackOnError("Invalid parameters. Check the type, user ID and data");
    }
};

exports.getLastEventFromUserOfType = function(userId, type, callback, callbackOnError) {
    if(!isNaN(userId) && type!==undefined){
        WtfModel.select("SELECT * FROM `"+eventsTableName+"` WHERE `user_id` = ? AND `type` = ? ORDER BY `date` DESC LIMIT 1;", [userId, type], function(results) {
            callback(results[0]);
        }, callbackOnError);
    }else if(callbackOnError!==undefined){
        callbackOnError("Invalid parameters. Check the type and user ID");
    }
};

exports.getLastEventsFromConnectedUsersOfType = function(type, callback, callbackOnError) {
    if(type!==undefined){
        WtfModel.select(    
            "select u.username as username, vtab.type, vtab.data, vtab.date from (select t2.* from `"+sessionsTableName+"` t1 inner join `"+eventsTableName+"` t2 on t1.user_id = t2.user_id"+
                " where t2.type= ? order by t2.date DESC) as vtab inner join `"+usersTableName+"` u on vtab.user_id = u.ID group by vtab.user_id",
            [type], 
            function(results) {
                callback(results);
        }, callbackOnError);
    }else if(callbackOnError!==undefined){
        callbackOnError("Invalid parameters. Check the type");
    }
};
exports.getEventById = function(eventId, callback, callbackOnError) {
    WtfModel.select("select * from `"+eventsTableName+"` WHERE `ID` = ?", [eventId], function(results) {
        callback(results[0]);
    }, callbackOnError);
};

virtualTableProcedure();