const express = require('express');
const cors = require('cors');
const db = require("./db");


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


// Crear un nuevo camión
app.post('/api/camiones', (req, res) => {
  const {
    id_camion,
    placa,
    modelo,
    capacidad,
    estado
  } = req.body;

  if (!id_camion || !placa || !estado) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const query = `
    INSERT INTO camiones (
      id_camion, placa, modelo, capacidad, estado
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id_camion
  `;

  db.query(query, [
    id_camion,
    placa,
    modelo || null,
    capacidad ? parseInt(capacidad) : null,
    estado
  ], (err, result) => {
    if (err) {
      console.error('Error al insertar camión:', err);
      return res.status(500).json({ message: 'Error interno al guardar el camión' });
    }

    console.log(`Camión creado con id: ${result.rows[0].id_camion}`);
    res.status(201).json({
      message: 'Camión registrado exitosamente',
      id: result.rows[0].id_camion
    });
  });
});

// Actualizar un camión
app.put('/api/camiones/:id', (req, res) => {
  const { id } = req.params;
  const { placa, modelo, capacidad, estado } = req.body;

  if (!placa || !estado) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  const query = `
    UPDATE camiones 
    SET placa = $1, modelo = $2, capacidad = $3, estado = $4
    WHERE id_camion = $5
  `;

  db.query(query, [
    placa,
    modelo || null,
    capacidad ? parseInt(capacidad) : null,
    estado,
    id
  ], (err, result) => {
    if (err) {
      console.error('Error al actualizar camión:', err);
      return res.status(500).json({ message: 'Error interno al actualizar el camión' });
    }
    console.log(`Camión actualizado con id: ${id}`);
    res.status(200).json({ message: 'Camión actualizado exitosamente' });
  });
});

// Eliminar un camión
app.delete('/api/camiones/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM camiones WHERE id_camion = $1';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar camión:', err);
      return res.status(500).json({ message: 'Error interno al eliminar el camión' });
    }
    console.log(`Camión eliminado con id: ${id}`);
    res.status(200).json({ message: 'Camión eliminado exitosamente' });
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

/*------------------------------BUSQUEDA-------------------------------*/

app.get('/api/camiones/buscar', async (req, res) => {
  try {
    const { query, placa } = req.query;

    if (!query && !placa) {
      return res.status(400).json({ error: 'Falta parámetro de búsqueda' });
    }

    let searchQuery;
    let params;

   if (query) {
  searchQuery = `
    SELECT * FROM camiones 
    WHERE CAST(id_camion AS TEXT) ILIKE $1 
      OR modelo ILIKE $1 
      OR placa ILIKE $1
  `;
  params = [`%${query}%`];
}


    const resultado = await db.query(searchQuery, params);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron camiones' });
    }

    console.log(`Búsqueda realizada con parámetros: ${query} y ${placa}`);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al buscar el camión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

//---------------------------------Cambio de estado
app.put('/api/camiones/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  try {
    // Verificar si el camión existe
    const camion = await db.query(
      'SELECT estado FROM camiones WHERE id_camion = $1', 
      [id]
    );

    if (camion.rows.length === 0) {
      return res.status(404).json({ message: 'Camión no encontrado' });
    }

    // Actualizar estado
    await db.query(
      'UPDATE camiones SET estado = $1 WHERE id_camion = $2',
      [estado, id]
    );

    console.log(`Estado actualizado para camión con id: ${id}`);
    res.status(200).json({ 
      message: 'Estado actualizado exitosamente',
      nuevo_estado: estado
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de camiones corriendo en http://localhost:${PORT}`);
});


