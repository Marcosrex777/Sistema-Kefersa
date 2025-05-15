const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("../Server/db"); 


app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.status(200).json({ status: "API funcionando" });
});

// Endpoint para login de usuarios
app.post("/api/login", async (req, res) => {
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

    if (userResult.rows.length === 0) {
      client.release();
      return res.status(401).json({
        error: "Credenciales inválidas",
        detalles: "Usuario no encontrado"
      });
    }

    const user = userResult.rows[0];

    if (user.contrasena !== contrasena) {
      client.release();
      return res.status(401).json({
        error: "Credenciales inválidas",
        detalles: "Contraseña incorrecta"
      });
    }

    client.release();

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

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
