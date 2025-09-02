const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect(error => {
  if (error) {
    console.error('--- DATABASE CONNECTION FAILED ---');
    console.error(`Error: ${error.message}`);
    console.error(`Error Code: ${error.code}`);
    console.error('Please ensure the database is running and credentials in .env are correct.');
    process.exit(1);
  }

  console.log("Successfully connected to the database.");
});

module.exports = connection;
