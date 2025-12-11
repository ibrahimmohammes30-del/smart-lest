const express = require('express');
const machinesRouter = require('./routes/machines');
const partsRouter = require('./routes/parts');
const searchRouter = require('./routes/search'); // ← راوتر البحث بالـ Serial
const pool = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware لمعالجة JSON و URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعدادات CORS ودعم اللغة العربية
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

// ==============================
//  🔗 ربط الراوترات
// ==============================
app.use('/api/machines', machinesRouter);
app.use('/api/parts', partsRouter);
app.use('/api/search', searchRouter); // ← إضافة راوتر البحث بالـ Serial

// ==============================
//  📌 صفحة الترحيب
// ==============================
app.get('/', (req, res) => {
    res.json({
        message: 'مرحباً بك في نظام إدارة الماكينات والأجزاء',
        version: '1.0.0',
        endpoints: {
            machines: {
                getAll: 'GET /api/machines',
                getOne: 'GET /api/machines/:id',
                create: 'POST /api/machines',
                update: 'PUT /api/machines/:id',
                delete: 'DELETE /api/machines/:id',
                search: 'GET /api/machines/search/:keyword'
            },
            parts: {
                getAll: 'GET /api/parts',
                getOne: 'GET /api/parts/:id',
                getByMachine: 'GET /api/parts/machine/:machine_id',
                create: 'POST /api/parts',
                update: 'PUT /api/parts/:id',
                delete: 'DELETE /api/parts/:id'
            },
            search: {
                partBySerial: 'GET /api/search/parts/:serial',
                machineBySerial: 'GET /api/search/machines/:serial'
            }
        }
    });
});

// ==============================
//  ❌ صفحة 404
// ==============================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة غير موجودة'
    });
});

// ==============================
//  🔥 Global Error Handler
// ==============================
app.use((err, req, res, next) => {
    console.error('🔥 خطأ في السيرفر:', err);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ داخلي في السيرفر',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==============================
//  🚀 تشغيل السيرفر
// ==============================
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على: http://localhost:${PORT}`);
    console.log(`📊 API الماكينات: http://localhost:${PORT}/api/machines`);
    console.log(`🔧 API الأجزاء: http://localhost:${PORT}/api/parts`);
    console.log(`🔍 API البحث بالـ Serial: http://localhost:${PORT}/api/search`);
});

// ==============================
//  🧹 إغلاق الاتصالات عند إيقاف السيرفر
// ==============================
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('✅ تم إغلاق اتصالات قاعدة البيانات');
        process.exit(0);
    } catch (err) {
        console.error('❌ خطأ في إغلاق الاتصالات:', err);
        process.exit(1);
    }
});
