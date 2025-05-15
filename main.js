const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

// Routers externos
const camiones = require("./Camiones");
const clientes = require("./Clientes");
const compras = require("./Compras");
const productos = require("./Productos");
const proveedores = require("./Proveedores");
const ventas = require("./Ventas");
const usuariosRouter = require("./usuarios"); // debe exportar un router

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

// Endpoint para login
app.post("/api/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({
      error: "Faltan credenciales",
      detalles: "Se requieren usuario y contraseña"
    });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM usuarios WHERE usuario = $1",
      [usuario.trim()]
    );

    if (result.rows.length === 0) {
      client.release();
      return res.status(401).json({
        error: "Credenciales inválidas",
        detalles: "Usuario no encontrado"
      });
    }

    const user = result.rows[0];

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
    console.error("Error al autenticar:", err);
    res.status(500).json({
      error: "Error interno del servidor"
    });
  }
});

// Montar routers con prefijos
app.use("/camiones", camiones);
app.use("/clientes", clientes);
app.use("/compras", compras);
app.use("/productos", productos);
app.use("/proveedores", proveedores);
app.use("/ventas", ventas);
app.use("/usuarios", usuariosRouter); // por ejemplo: /usuarios/listar

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
