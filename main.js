const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

const camiones = require("./Camiones");
const clientes = require("./Clientes");
const compras = require("./Compras");
const productos = require("./Productos");
const proveedores = require("./Proveedores");
const ventas = require("./Ventas");
const index = require("./index");  // router usuarios

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Montar routers
app.use('/camiones', camiones);
app.use('/clientes', clientes);
app.use('/compras', compras);
app.use('/productos', productos);
app.use('/proveedores', proveedores);
app.use('/ventas', ventas);
app.use('/index', index);

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
