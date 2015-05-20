
function SqlOperation(sql, params, logInfo) {
	this.sql = sql;
	this.params = params;
	this.logInfo = logInfo;
}

//generates promises to run WebSQLTransactions
function SqlPromiser(db){
	// Pending migrations to run
	var sqlStatements = [];

	var database = db; 

	var isStatementExecutionLoggingOn = true;

	var isTransactionExecutionLoggingOn = true;

	//keeps the result of the last statement so it can be returned
	var sqlTransactionResult;

	//sets sqlStatements to the operations in the queue
	//each operation contains: sql, params, logInfo
	this.setOperations = function(operations){
		sqlStatements = operations;
	};

	//adds a sql statement to the queue- will be executed in order they are added
	this.pushSqlStatement = function(sql, params, logInfo){
		sqlStatements[sqlStatements.length] = {sql: sql, params: params, logInfo: logInfo};
	};

	this.clearSqlStatements = function() {
		sqlStatements = [];
	}

	/*this.executeTransactionSerially = function(logId) {

	}*/

	//returns a promise to execute the transaction, including all of the pushed sql statements
	this.executeTransaction = function(logId) {
		var currentStatement;

		var promise = new Promise(function(resolve, reject) {
			db.transaction(
				function(tx) {

					for(var i=0; i< sqlStatements.length; i++)
					{
						currentStatement = sqlStatements[i];
						tx.executeSql(currentStatement.sql,
										currentStatement.params,
										function(tx, result) {
											sqlTransactionResult = result;
											if(isStatementExecutionLoggingOn) {
												console.log('query successful: ' + currentStatement.logId);
											}
										});/*,
										function(tx, err) {
											if(isStatementExecutionLoggingOn) {
												console.log('query failed: ' + currentStatement.logId);
												console.log(err);
											}
										});*/
					}
				},
				function(error) {
					if(isTransactionExecutionLoggingOn && logId) {
						console.log('transaction failed: ' + logId);
						console.log(error);
					}
					reject(error);
				},
				function() {
					if(isTransactionExecutionLoggingOn && logId) {
						console.log('transaction successful: ' + logId);
					}
					resolve(sqlTransactionResult);
				}
			);
		});
		return promise;
	}

	//if true, will log the result of each SQL statement if a logId is specified with the statement
	this.setStatementExecutionLogging = function(isLoggingOn) {
		isStatementExecutionLoggingOn = isLoggingOn;
	}

	//if true, will log the result of each SQL transaction if a logId is specified when the transaction is executed
	this.setTransactionExecutionLogging = function(isLoggingOn) {
		isTransactionExecutionLoggingOn = isLoggingOn;
	}

}