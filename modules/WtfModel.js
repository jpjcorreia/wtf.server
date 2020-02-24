var mysql = require('mysql');


var SqlKeywords = {
    "NOW()":"NOW()"
    ,"CURRENT_TIMESTAMP()":"current_timestamp()"
};


var WtfModel = function WtfModel() {
	//defining a var instead of this (works for variable & function) will create a private definition
	var connection = mysql.createConnection({
		host: 'localhost',
		port: 3306,
		user: 'wtf_user',
		password: 'Fx2ZPdDGbdzat2Cp',
		database: 'wtf_db'
	});
	
	try{
		var handleDisconnect = function() {
			connection.on('error', function(err) {
				if (!err.fatal) {
					return;
				}
		
				if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
					throw err;
				}
		
				console.log('Re-connecting lost connection: ' + err.stack);
		
				connection = mysql.createConnection(connection.config);
				handleDisconnect(connection);
				connection.connect(WtfModel.errorLog);
			});
			connection.connect(WtfModel.errorLog);
		};
		handleDisconnect();
	}catch(e){
		console.log("Problem with MySQL Server");
		process.exit(1);
	}

	var extractParameters = function(data) {
		var parameters = [];
		for (var key in data) {
			parameters.push(key);
		}
		return parameters;
	};

	var extractParametersValues = function(data) {
		var parameters = [];
		for (var key in data) {
			if(SqlKeywords[data[key]]!==undefined)
				parameters.push(SqlKeywords[data[key]]);
			else
				parameters.push("?");
		}
		return parameters;
	};

	var toArray = function(data) {
		var parameters = [];
		for (var key in data) {
			parameters.push(data[key]);
		}
		return parameters;
	};

	var errorLog = function(err) {
		if (err) {
			console.log(err);
			return true;
		}
		return false;
	};
	
	var getSimpleResults = function(results, fields) {
		var finalResults = [];
		for (var result in results) {
			var r = {};
			for (var field in fields) {
				r[fields[field].name] = results[result][fields[field].name];
			}
			finalResults.push(r);
		}
		return finalResults;
	};



	if (WtfModel.caller != WtfModel.getInstance) {
		throw new Error("This object cannot be instanciated");
	}

	this.errorLog = errorLog;

	this.getConnection = function() {
		return connection;
	};

	this.getSimpleResults = getSimpleResults;

	this.insert = function(table, data, callback, callbackOnError) {
		var query = "insert into `"+table+"` (`" + extractParameters(data).join('`,`') + "`) values (" + extractParametersValues(data).join(',') + ")";
		this.getConnection().query(query, toArray(data), function(err, info) {
			if (!errorLog(err)) {
				// callback function returns inserted id
				callback(info.insertId);
			}else if(callbackOnError){
				callbackOnError(err);
			}
		});
	};
	
	this.select = function(query, parameters, callback, callbackOnError) {
		this.getConnection().query(query, toArray(parameters), function(err, results, fields) {
			if (!errorLog(err)){
				// callback function returns results object
				callback(getSimpleResults(results, fields));
			}else if(callbackOnError){
				callbackOnError(err);
			}
		});
	};
};

WtfModel.instance = null;

/**
 * Singleton getInstance definition
 * @return WtfModel class
 */
WtfModel.getInstance = function() {
	if (this.instance === null) {
		this.instance = new WtfModel();
	}
	return this.instance;
};

module.exports = WtfModel.getInstance();
