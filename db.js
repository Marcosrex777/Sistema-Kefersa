const { Pool } = require("pg");
const dotenv = require("dotenv").config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

// Verificación de variables de entorno
console.log("Variables de entorno:", {
  PGHOST: PGHOST,
  PGDATABASE: PGDATABASE,
  PGUSER: PGUSER,
  PGPASSWORD: PGPASSWORD ? "****" : "No definida"
});

const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

// Verificar conexión al iniciar
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err);
  } else {
    console.log('Conexión a PostgreSQL exitosa');
  }
});

module.exports = pool;
