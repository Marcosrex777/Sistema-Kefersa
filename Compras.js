const express = require('express');
const cors = require('cors');
const db = require("./db");

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
};

const app = express();
const PORT = 3005;

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API para obtener proveedores
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM proveedores');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener proveedores:', err);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

// API para obtener productos
app.get('/api/productos', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM productos');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// API para buscar productos
app.get('/api/productos/buscar', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
    }

    try {
        const result = await db.query(
            `SELECT * FROM productos 
             WHERE nombre_producto ILIKE $1 OR id_producto::text ILIKE $1`,
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error al buscar productos:', err);
        res.status(500).json({ error: 'Error al buscar productos' });
    }
});

// API para registrar compras
app.post('/api/compras', async (req, res) => {
    const { id_proveedor, fecha_compra, productos } = req.body;
    
    if (!id_proveedor || !fecha_compra || !productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'Datos de compra incompletos' });
    }

    try {
        // Iniciar transacción
        await db.query('BEGIN');

        // 1. Insertar la compra principal
        const compraResult = await db.query(
            'INSERT INTO compras (id_proveedor, fecha_compra) VALUES ($1, $2) RETURNING id_compra',
            [id_proveedor, fecha_compra]
        );
        const id_compra = compraResult.rows[0].id_compra;

        // 2. Insertar los detalles de la compra y actualizar el stock
        let total = 0;
        for (const producto of productos) {
            const subtotal = producto.cantidad * producto.precio_unitario;
            total += subtotal;

            // Insertar detalle de compra
            await db.query(
                'INSERT INTO detalles_compra (id_compra, id_producto, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [id_compra, producto.id_producto, producto.cantidad, producto.precio_unitario, subtotal]
            );

            // Actualizar stock del producto
            await db.query(
                'UPDATE productos SET stock = stock + $1 WHERE id_producto = $2',
                [producto.cantidad, producto.id_producto]
            );
        }

        // 3. Actualizar el total de la compra
        await db.query(
            'UPDATE compras SET total = $1 WHERE id_compra = $2',
            [total, id_compra]
        );

        // Confirmar transacción
        await db.query('COMMIT');

        res.json({ 
            message: 'Compra registrada exitosamente',
            id_compra,
            total
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error al registrar compra:', err);
        res.status(500).json({ error: 'Error al registrar compra' });
    }
});

// API para obtener compras con detalles
app.get('/api/compras-con-detalles', async (req, res) => {
    try {
        // Obtener compras principales
        const comprasResult = await db.query('SELECT * FROM compras ORDER BY fecha_compra DESC');
        const compras = comprasResult.rows;

        // Obtener detalles para cada compra
        for (const compra of compras) {
            const detallesResult = await db.query(
                'SELECT * FROM detalles_compra WHERE id_compra = $1',
                [compra.id_compra]
            );
            compra.detalles = detallesResult.rows;
        }

        res.json(compras);
    } catch (err) {
        console.error('Error al obtener compras con detalles:', err);
        res.status(500).json({ error: 'Error al obtener compras con detalles' });
    }
});

// API para actualizar productos
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_producto, precio_unitario, stock } = req.body;

    if (!nombre_producto || !precio_unitario || !stock) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        const result = await db.query(
            `UPDATE productos 
             SET nombre_producto = $1, precio_unitario = $2, stock = $3 
             WHERE id_producto = $4 
             RETURNING *`,
            [nombre_producto, precio_unitario, stock, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ 
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// API para retirar productos (disminuir stock)
app.post('/api/productos/retirar', async (req, res) => {
    const { id_producto, cantidad } = req.body;

    if (!id_producto || !cantidad || cantidad <= 0) {
        return res.status(400).json({ error: 'Datos inválidos para retiro' });
    }

    try {
        // Verificar stock disponible
        const producto = await db.query(
            'SELECT stock FROM productos WHERE id_producto = $1',
            [id_producto]
        );

        if (producto.rowCount === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const stockActual = producto.rows[0].stock;
        if (stockActual < cantidad) {
            return res.status(400).json({ 
                error: `Stock insuficiente. Disponible: ${stockActual}` 
            });
        }

        // Actualizar stock
        const nuevoStock = stockActual - cantidad;
        await db.query(
            'UPDATE productos SET stock = $1 WHERE id_producto = $2',
            [nuevoStock, id_producto]
        );

        res.json({ 
            message: 'Retiro exitoso',
            id_producto,
            cantidad_retirada: cantidad,
            nuevo_stock: nuevoStock
        });
    } catch (err) {
        console.error('Error al retirar producto:', err);
        res.status(500).json({ error: 'Error al retirar producto' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});