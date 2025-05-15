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

// Obtener todos los proveedores
app.get('/api/proveedores', (req, res) => {
  const query = 'SELECT * FROM proveedores';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener proveedores:', err);
      return res.status(500).json({ message: 'Error al obtener proveedores' });
    }
    res.status(200).json(results.rows);
  });
});

// Crear un nuevo proveedor
app.post('/api/proveedores', (req, res) => {
  const {
    id_proveedor,
    nombre,
    contacto,
    direccion,
    telefono,
    correo
  } = req.body;

  if (!id_proveedor || !nombre) {  // Cambiado de nodeve a nombre
    return res.status(400).json({ message: 'Faltan datos obligatorios (ID y Nombre)' });
  }

  const query = `
    INSERT INTO proveedores (
      id_proveedor, nombre, contacto, direccion, telefono, correo
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id_proveedor
  `;

  db.query(query, [
    id_proveedor,
    nombre,
    contacto || null,
    direccion || null,
    telefono || null,
    correo || null
  ], (err, result) => {
    if (err) {
      console.error('Error al insertar proveedor:', err);
      return res.status(500).json({ message: 'Error interno al guardar el proveedor' });
    }

    res.status(201).json({
      message: 'Proveedor guardado exitosamente',
      id: result.rows[0].id_proveedor
    });
  });
});

// Actualizar un proveedor
app.put('/api/proveedores/:id_proveedor', (req, res) => {  // Cambiado a id_proveedor
  const { id_proveedor } = req.params;
  const { nombre, contacto, direccion, telefono, correo } = req.body;

  if (!nombre) {  // Cambiado de nodeve a nombre
    return res.status(400).json({ message: 'El nombre del proveedor es obligatorio' });
  }

  const query = `
    UPDATE proveedores 
    SET nombre = $1, contacto = $2, direccion = $3, telefono = $4, correo = $5
    WHERE id_proveedor = $6
  `;

  db.query(query, [
    nombre,
    contacto || null,
    direccion || null,
    telefono || null,
    correo || null,
    id_proveedor
  ], (err, result) => {
    if (err) {
      console.error('Error al actualizar proveedor:', err);
      return res.status(500).json({ message: 'Error interno al actualizar el proveedor' });
    }
    res.status(200).json({ message: 'Proveedor actualizado exitosamente' });
  });
});

// Eliminar un proveedor
app.delete('/api/proveedores/:id_proveedor', (req, res) => {  // Cambiado a id_proveedor
  const { id_proveedor } = req.params;

  const query = 'DELETE FROM proveedores WHERE id_proveedor = $1';  // Cambiado a id_proveedor

  db.query(query, [id_proveedor], (err, result) => {
    if (err) {
      console.error('Error al eliminar proveedor:', err);
      return res.status(500).json({ message: 'Error interno al eliminar el proveedor' });
    }
    res.status(200).json({ message: 'Proveedor eliminado exitosamente' });
  });
});

// Búsqueda de proveedores por diferentes criterios
app.get('/api/proveedores/buscar', async (req, res) => {
  try {
    const { id, name, contact } = req.query;

    let query = 'SELECT * FROM proveedores WHERE ';
    let params = [];
    let conditions = [];

    if (id) {
      conditions.push('id_proveedor ILIKE $' + (params.length + 1));  // Cambiado a id_proveedor
      params.push(`%${id}%`);
    }
    if (name) {
      conditions.push('nombre ILIKE $' + (params.length + 1));  // Cambiado de nodeve a nombre
      params.push(`%${name}%`);
    }
    if (contact) {
      conditions.push('contacto ILIKE $' + (params.length + 1));
      params.push(`%${contact}%`);
    }

    if (conditions.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un criterio de búsqueda' });
    }

    query += conditions.join(' OR ');

    const resultado = await db.query(query, params);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron proveedores' });
    }

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al buscar proveedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor de proveedores corriendo en http://localhost:${PORT}`);
});
