const express = require('express');
const app = express();
const pool = require('./db'); // conexión a PostgreSQL

// Importar módulos (asumiendo que exportan routers o funciones)
const camiones = require('./Camiones');
const clientes = require('./Clientes');
const compras = require('./Compras');
const productos = require('./Productos');
const proveedores = require('./Proveedores');
const ventas = require('./Ventas');
const index = require('./index');

// Middleware para parsear JSON
app.use(express.json());

// Definir rutas base para cada módulo
// Aquí asumimos que cada archivo exporta un router Express o funciones para manejar rutas

app.use('/camiones', camiones);
app.use('/clientes', clientes);
app.use('/compras', compras);
app.use('/productos', productos);
app.use('/proveedores', proveedores);
app.use('/ventas', ventas);
app.use('/index', index);

// Ruta de prueba para verificar conexión a BD
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Hora actual en BD: ${result.rows[0].now}`);
  } catch (error) {
    console.error('Error en consulta:', error);
    res.status(500).send('Error de base de datos');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
