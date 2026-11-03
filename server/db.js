const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

// Create a connection pool to handle multiple concurrent queries efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'demand_elasticity',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable SSL if running on cloud providers (e.g., Aiven, PlanetScale, AWS RDS)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Helper function to test database connectivity
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database: ${process.env.DB_NAME || 'demand_elasticity'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
