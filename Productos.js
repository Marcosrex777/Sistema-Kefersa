const express = require('express');
const cors = require('cors');
const db = require("./db");

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
};

const app = express();
const PORT = 3000;

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
  const query = 'SELECT * FROM productos';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({ message: 'Error al obtener productos' });
    }
    res.status(200).json(results.rows);
  });
});

// Crear un nuevo producto
app.post('/api/productos', (req, res) => {
  const {
    nombre_producto,
    descripcion,
    precio_unitario,
    stock,
    id_proveedor,
    fecha,
    unidad
  } = req.body;

  if (!nombre_producto || isNaN(precio_unitario)) {
    return res.status(400).json({ message: 'Faltan datos obligatorios o hay errores en los datos' });
  }

  const query = `
    INSERT INTO productos (
      nombre_producto, descripcion, precio_unitario, stock, id_proveedor, fecha, unidad
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id_producto
  `;

  db.query(query, [
    nombre_producto,
    descripcion || null,
    parseFloat(precio_unitario),
    stock ? parseInt(stock) : null,
    id_proveedor ? parseInt(id_proveedor) : null,
    fecha || null,
    unidad || null
  ], (err, result) => {
    if (err) {
      console.error('Error al insertar producto:', err);
      return res.status(500).json({ message: 'Error interno al guardar el producto' });
    }

    res.status(201).json({
      message: 'Producto guardado exitosamente',
      id: result.rows[0].id_producto
    });
  });
});

// Actualizar un producto
app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre_producto, descripcion, precio_unitario, stock, id_proveedor, fecha, unidad } = req.body;

  if (!nombre_producto || isNaN(precio_unitario)) {
    return res.status(400).json({ message: 'Faltan datos obligatorios o hay errores en los datos' });
  }

  const query = `
    UPDATE productos 
    SET nombre_producto = $1, descripcion = $2, precio_unitario = $3, stock = $4, id_proveedor = $5, fecha = $6, unidad = $7
    WHERE id_producto = $8
  `;

  db.query(query, [
    nombre_producto,
    descripcion || null,
    parseFloat(precio_unitario),
    stock ? parseInt(stock) : null,
    id_proveedor ? parseInt(id_proveedor) : null,
    fecha || null,
    unidad || null,
    parseInt(id)
  ], (err, result) => {
    if (err) {
      console.error('Error al actualizar producto:', err);
      return res.status(500).json({ message: 'Error interno al actualizar el producto' });
    }
    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  });
});

// Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM productos WHERE id_producto = $1';

  db.query(query, [parseInt(id)], (err, result) => {
    if (err) {
      console.error('Error al eliminar producto:', err);
      return res.status(500).json({ message: 'Error interno al eliminar el producto' });
    }
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


/*------------------------------BUSQUEDA-------------------------------*/



app.get('/api/productos/buscar', async (req, res) => {
  try {
    const { nombre, query, codigo } = req.query;

    if (!nombre && !query && !codigo) {
      return res.status(400).json({ error: 'Falta parámetro de búsqueda' });
    }

    let searchQuery;
    let params;

    if (nombre || query) {
      searchQuery = 'SELECT * FROM productos WHERE nombre_producto ILIKE $1';
      params = [`%${nombre || query}%`];
    } else if (codigo) {
      searchQuery = 'SELECT * FROM productos WHERE codigo = $1';
      params = [codigo];
    }

    const resultado = await db.query(searchQuery, params);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron productos' });
    }

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al buscar el producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//---------------------------------retiro
app.post('/api/productos/retirar', async (req, res) => {
  const { id_producto, cantidad } = req.body;

  if (!id_producto || !cantidad || isNaN(cantidad) || cantidad <= 0) {
    return res.status(400).json({ message: 'Datos de retiro no válidos' });
  }

  try {
    // Verificar stock
    const producto = await db.query(
      'SELECT stock FROM productos WHERE id_producto = $1', 
      [parseInt(id_producto)]
    );

    if (producto.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const stockActual = producto.rows[0].stock;
    
    if (stockActual < cantidad) {
      return res.status(400).json({ message: 'Stock insuficiente para retiro' });
    }

    // Actualizar stock
    await db.query(
      'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
      [parseInt(cantidad), parseInt(id_producto)]
    );

    res.status(200).json({ 
      message: 'Retiro realizado exitosamente',
      nuevo_stock: stockActual - cantidad
    });
  } catch (error) {
    console.error('Error al retirar producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});
