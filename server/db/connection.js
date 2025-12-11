// 📁 server/db/connection.js
const mysql = require('mysql2/promise');

// إنشاء pool للاتصال
const pool = mysql.createPool({
    host: 'localhost',
    user: 'amera',
    password: 'amera1810',
    database: 'machines_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4' // لدعم العربية
});

// اختبار الاتصال
pool.getConnection()
    .then(connection => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        connection.release();
    })
    .catch(err => {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
        process.exit(1);
    });

module.exports = pool;