const express = require("express");
const router = express.Router();
const pool = require("./db");

router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Ruta de prueba
router.get("/", (req, res) => {
  res.status(200).json({ status: "API usuarios funcionando" });
});

// Endpoint para login de usuarios
router.post("/login", async (req, res) => {
  console.log("Datos recibidos:", req.body);

  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({
      error: "Faltan credenciales",
      detalles: "Se requieren usuario y contraseña"
    });
  }

  try {
    const client = await pool.connect();
    console.log("Conexión a DB establecida");

    const userResult = await client.query(
      "SELECT * FROM usuarios WHERE usuario = $1",
      [usuario.trim()]
    );

    client.release();

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: "Credenciales inválidas",
        detalles: "Usuario no encontrado"
      });
    }

    const user = userResult.rows[0];

    if (user.contrasena !== contrasena) {
      return res.status(401).json({
        error: "Credenciales inválidas",
        detalles: "Contraseña incorrecta"
      });
    }

    res.status(200).json({
      usuario: user.usuario.trim(),
      mensaje: "Autenticación exitosa"
    });
  } catch (err) {
    console.error("Error detallado:", {
      message: err.message,
      stack: err.stack,
      query: err.query,
      parameters: err.parameters
    });

    res.status(500).json({
      error: "Error interno del servidor",
      detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
