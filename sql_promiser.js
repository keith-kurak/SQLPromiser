
function SqlOperation(sql, params) {
	this.sql = sql;
	this.params = params;
}

//generates promises to run WebSQLTransactions
function SqlPromiser(db){
	// Pending migrations to run
	this.sqlStatements = [];

	this.database = db; 

	//if true, will log errors that occur during individual statements
	this.logStatementErrors = false;

	//if true, will log errors that occur during each SQL transaction
	this.logTransactionErrors = false;

	//if true, will log the result of each SQL transaction
	this.logTransactionExecution = false;

	//sets sqlStatements to the operations in the queue
	//each operation contains: sql, params, logInfo
	/*this.setOperations = function(operations){
		sqlStatements = operations;
	};*/
}

//returns a promise to execute the transaction, including all of the passed sql statements
//If Promise is rejected, error will be passed as the variable for the promise
//If the Promise is resolved, the transaction result of the last statement will be passed as the variable for the promise.
//This includes query results.
//logId is optional. If logging is enabled, the transacdtion logs will include the id. 
SqlPromiser.prototype.executeTransactionAsync = function(sqlStatements, logId) {
	var that = this;
	var currentStatement;
	var promise = new Promise(function(resolve, reject) {
		that.db.transaction(
			function(tx) {
				for(var i=0; i< sqlStatements.length; i++)
				{
					currentStatement = sqlStatements[i];
					tx.executeSql(currentStatement.sql,
									currentStatement.params,
									function(tx, result) {
										sqlTransactionResult = result;
									},
									function(tx, err) {
										if(that.logStatementErrors) {
											that.log('query failed', err);
										}
									});
				}
			},
			function(error) {
				if(that.logTransactionErrors || that.logTransactionExecution) {
					that.log('transaction failed', error, logId);
				}
				reject(error);
			},
			function() {
				if(that.logTransactionExecution) {
					that.log('transaction successful', error, logId);
				}
				resolve(sqlTransactionResult); 
			}
		);
	});
	return promise;
}

SqlPromiser.prototype.executePushedStatementsAsync = function(logId) {
	return this.executeTransactionAsync(this.sqlStatements, logId).then(function(result) {
		this.clearQueuedSqlStatements();
		return new Promise.resolve(result);
	},
	function(error) {
		return Promise.reject(error);
	});
}

SqlPromiser.prototype.executeStatementAsync = function(sql, params, logId) {
	return this.executeTransactionAsync([{sql: sql, params: params}], logId);
}

SqlPromiser.prototype.clearQueuedSqlStatements = function() {
	sqlStatements = [];
}

//adds a sql statement to the queue- will be executed in order they are added
SqlPromiser.prototype.pushSqlStatement = function(sql, params){
	sqlStatements[sqlStatements.length] = {sql: sql, params: params};
};

SqlPromiser.prototype.log = function(preamble, error, logId) {
	if(logId) {
		console.log(preamble + ' (' + logId + '): ' + error;
	} else {
		console.log(preamble + ': ' + error;
	}
}