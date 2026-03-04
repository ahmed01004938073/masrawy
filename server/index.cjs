const express = require('express');
console.log("SERVER VERSION 10008 - DB DIAGNOSTICS ACTIVE");
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

// FORCED LOAD: Ensure database.cjs is loaded
const db = require('./database.cjs');

// Import Routes
const productRoutes = require('./routes/productRoutes.cjs');
const orderRoutes = require('./routes/orderRoutes.cjs');
const shippingRoutes = require('./routes/shippingRoutes.cjs');
const employeeRoutes = require('./routes/employeeRoutes.cjs');
const authRoutes = require('./routes/authRoutes.cjs');
const favoritesRoutes = require('./routes/favoritesRoutes.cjs');
const settingsRoutes = require('./routes/settingsRoutes.cjs');
const systemRoutes = require('./routes/systemRoutes.cjs');
const marketerRoutes = require('./routes/marketerRoutes.cjs');
const categoryRoutes = require('./routes/categoryRoutes.cjs');
const analyticsRoutes = require('./routes/analyticsRoutes.cjs');
const notificationRoutes = require('./routes/notificationRoutes.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
    const authHeader = req.headers['authorization'] ? '✅ Has Auth' : '❌ No Auth';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${authHeader}`);
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${res.statusCode}`);
    });
    next();
});

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// Health Check
app.get('/ping', (req, res) => {
    const now = new Date();
    const localTime = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

    res.json({
        status: 'server-updated-v3-mysql',
        timestamp: now.toISOString(),
        serverLocalTime: localTime,
        db: 'mysql-connected'
    });
});

// Diagnostic route for orders
app.get('/api/orders/health', (req, res) => {
    res.json({ status: 'orders-route-active' });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/kv', settingsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/marketers', marketerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shipping', shippingRoutes);

// Catch-all middleware to serve React App for non-API requests
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API Endpoint Not Found' });
    }
    if (req.method === 'GET') {
        const indexPath = path.join(__dirname, '../dist/index.html');
        if (require('fs').existsSync(indexPath)) {
            return res.sendFile(indexPath);
        } else {
            console.error('Frontend build missing at:', indexPath);
            return res.status(500).send(`
                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #e11d48;">Frontend Build Missing</h1>
                    <p>The system could not find the built frontend assets.</p>
                    <code style="background: #f1f5f9; padding: 10px; display: block;">${indexPath}</code>
                </div>
            `);
        }
    }
    next();
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        path: req.url
    });
});

app.listen(PORT, '0.0.0.0', () => {
    const startupMsg = `[${new Date().toISOString()}] Server running on port ${PORT} (0.0.0.0) - VERS 10004 - DIAGNOSTICS ACTIVE`;
    console.log(startupMsg);
});
