const express = require('express');
const cors = require('cors');
const db = require("./db"); // Tu módulo para acceder a la base de datos

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GET /api/proveedores
app.get('/api/proveedores', async (req, res) => {
  try {
    const proveedores = await db.getProveedores(); // Debes implementar esta función en db.js
    res.json(proveedores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
});

// GET /api/productos
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await db.getProductos(); // Implementa esta función
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// POST /api/compras  -> registrar compra
app.post('/api/compras', async (req, res) => {
  try {
    const compraData = req.body;
    const resultado = await db.registrarCompra(compraData); // Implementa esta función
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar compra' });
  }
});

// GET /api/compras-con-detalles
app.get('/api/compras-con-detalles', async (req, res) => {
  try {
    const compras = await db.getComprasConDetalles(); // Implementa esta función
    res.json(compras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener compras' });
  }
});

// GET /api/productos/buscar?query=xxx
app.get('/api/productos/buscar', async (req, res) => {
  try {
    const query = req.query.query || '';
    const resultados = await db.buscarProductos(query); // Implementa esta función
    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar productos' });
  }
});

// POST /api/productos/retirar
app.post('/api/productos/retirar', async (req, res) => {
  try {
    const { id_producto, cantidad } = req.body;
    const nuevoStock = await db.retirarProducto(id_producto, cantidad); // Implementa esta función
    res.json({ nuevo_stock: nuevoStock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al retirar producto' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
