const sql = require('mssql');
const config = require('./dbconfig');

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to MSSQL');
        return pool;
    })
    .catch(err => console.log('❌ DB Connection Failed:', err));

module.exports = {
    sql, poolPromise
};
