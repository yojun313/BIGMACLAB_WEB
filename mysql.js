const mysql = require('mysql');

// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'bigmaclab2022!'
});

async function deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'bigmaclab2022!'
        });

        connection.connect((err) => {
            if (err) {
                return reject(err);
            }

            const query = `DROP DATABASE IF EXISTS \`${dbName}\``;
            connection.query(query, (err, results) => {
                connection.end();

                if (err) {
                    return reject(err);
                }

                resolve(`Database ${dbName} deleted successfully`);
            });
        });
    });
}

async function getAllDatabases() {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'bigmaclab2022!'
        });

        connection.connect((err) => {
            if (err) {
                return reject(err);
            }

            connection.query('SHOW DATABASES', (err, results) => {
                if (err) {
                    connection.end();
                    return reject(err);
                }

                const databases = results.map(row => row.Database);
                connection.end();
                resolve(databases);
            });
        });
    });
}



module.exports = {
    getAllDatabases,
    deleteDatabase
}