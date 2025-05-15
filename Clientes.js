const express = require('express');
const cors = require('cors');
const db = require("./db"); // tu módulo de conexión a BD

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
};

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Obtener todas las tiendas
app.get('/api/tiendas', (req, res) => {
  const query = 'SELECT * FROM tienda ORDER BY id_tienda';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener tiendas:', err);
      return res.status(500).json({ message: 'Error al obtener tiendas' });
    }
    res.status(200).json(results.rows);
  });
});

// Buscar tiendas (por nombre o id)
app.get('/api/tiendas/buscar', (req, res) => {
  const { q } = req.query; // q es el parámetro de búsqueda

  if (!q) {
    return res.status(400).json({ message: 'Falta parámetro de búsqueda' });
  }

  const query = `
    SELECT * FROM tienda
    WHERE LOWER(nombre_tienda) LIKE LOWER($1)
    OR CAST(id_tienda AS TEXT) = $2
    LIMIT 10
  `;
  const params = [`%${q}%`, q];

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error en búsqueda de tiendas:', err);
      return res.status(500).json({ message: 'Error interno en búsqueda' });
    }
    if (results.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron tiendas' });
    }
    res.json(results.rows);
  });
});

// Crear una nueva tienda
app.post('/api/tiendas', (req, res) => {
  const { nombre_tienda, direccion, telefono, correo } = req.body;

  if (!nombre_tienda) {
    return res.status(400).json({ message: 'El nombre de la tienda es obligatorio' });
  }

  const query = `
    INSERT INTO tienda (nombre_tienda, direccion, telefono, correo)
    VALUES ($1, $2, $3, $4)
    RETURNING id_tienda
  `;

  db.query(query, [nombre_tienda, direccion || null, telefono || null, correo || null], (err, result) => {
    if (err) {
      console.error('Error al insertar tienda:', err);
      return res.status(500).json({ message: 'Error interno al guardar la tienda' });
    }

    res.status(201).json({
      message: 'Tienda guardada exitosamente',
      id_tienda: result.rows[0].id_tienda
    });
  });
});

// Actualizar tienda
app.put('/api/tiendas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre_tienda, direccion, telefono, correo } = req.body;

  if (!nombre_tienda) {
    return res.status(400).json({ message: 'El nombre de la tienda es obligatorio' });
  }

  const query = `
    UPDATE tienda
    SET nombre_tienda = $1, direccion = $2, telefono = $3, correo = $4
    WHERE id_tienda = $5
  `;

  db.query(query, [nombre_tienda, direccion || null, telefono || null, correo || null, parseInt(id)], (err, result) => {
    if (err) {
      console.error('Error al actualizar tienda:', err);
      return res.status(500).json({ message: 'Error interno al actualizar la tienda' });
    }
    res.status(200).json({ message: 'Tienda actualizada exitosamente' });
  });
});

// Eliminar tienda (corregido a tabla correcta)
app.delete('/api/tiendas/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM tienda WHERE id_tienda = $1';

  db.query(query, [parseInt(id)], (err, result) => {
    if (err) {
      console.error('Error al eliminar tienda:', err);
      return res.status(500).json({ message: 'Error interno al eliminar la tienda' });
    }
    res.status(200).json({ message: 'Tienda eliminada exitosamente' });
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
