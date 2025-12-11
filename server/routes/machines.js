const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

/*
===========================================
1. عرض جميع الماكينات
===========================================
*/
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT serial, name, description, 
                   DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                   delivered
            FROM machines 
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            message: 'تم جلب بيانات الماكينات بنجاح',
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('❌ خطأ في عرض الماكينات:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب البيانات'
        });
    }
});

/*
===========================================
2. عرض ماكينة واحدة مع جميع الأجزاء التابعة لها
===========================================
*/
router.get('/:serial', async (req, res) => {
    try {
        const { serial } = req.params;

        const [machines] = await pool.query(
            "SELECT serial, name, description, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, delivered FROM machines WHERE serial = ?",
            [serial]
        );

        if (machines.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لم يتم العثور على الماكينة"
            });
        }

        const [parts] = await pool.query(
            "SELECT serial, part_name, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, delivered FROM parts WHERE machine_id = ?",
            [serial]
        );

        res.json({
            success: true,
            message: "تم جلب بيانات الماكينة مع الأجزاء التابعة لها بنجاح",
            data: { ...machines[0], parts }
        });

    } catch (error) {
        console.error("❌ خطأ في عرض الماكينة:", error);
        res.status(500).json({
            success: false,
            message: "حدث خطأ في جلب بيانات الماكينة"
        });
    }
});

/*
===========================================
3. إضافة ماكينة جديدة
===========================================
*/
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'اسم الماكينة مطلوب'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO machines (name, description) VALUES (?, ?)',
            [name.trim(), description ? description.trim() : null]
        );

        const [newMachine] = await pool.query(
            'SELECT serial, name, description, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") as created_at, delivered FROM machines WHERE serial = (SELECT serial FROM machines ORDER BY id DESC LIMIT 1)'
        );

        res.status(201).json({
            success: true,
            message: 'تم إضافة الماكينة بنجاح',
            data: newMachine[0]
        });

    } catch (error) {
        console.error('❌ خطأ في إضافة ماكينة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إضافة الماكينة'
        });
    }
});

/*
===========================================
4. تحديث ماكينة
===========================================
*/
router.put('/:serial', async (req, res) => {
    try {
        const { serial } = req.params;
        const { name, description, delivered } = req.body;

        const [checkRows] = await pool.query(
            'SELECT serial FROM machines WHERE serial = ?',
            [serial]
        );

        if (checkRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'لم يتم العثور على الماكينة'
            });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'اسم الماكينة مطلوب'
            });
        }

        await pool.query(
            'UPDATE machines SET name = ?, description = ?, delivered = ? WHERE serial = ?',
            [name.trim(), description ? description.trim() : null, delivered ? 1 : 0, serial]
        );

        const [updatedMachine] = await pool.query(
            'SELECT serial, name, description, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") as created_at, delivered FROM machines WHERE serial = ?',
            [serial]
        );

        res.json({
            success: true,
            message: 'تم تحديث الماكينة بنجاح',
            data: updatedMachine[0]
        });

    } catch (error) {
        console.error('❌ خطأ في تحديث الماكينة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحديث الماكينة'
        });
    }
});

/*
===========================================
5. حذف ماكينة (الأجزاء التابعة تُحذف تلقائيًا)
===========================================
*/
router.delete('/:serial', async (req, res) => {
    try {
        const { serial } = req.params;

        const [checkRows] = await pool.query(
            'SELECT serial FROM machines WHERE serial = ?',
            [serial]
        );

        if (checkRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'لم يتم العثور على الماكينة'
            });
        }

        await pool.query('DELETE FROM machines WHERE serial = ?', [serial]);

        res.json({
            success: true,
            message: 'تم حذف الماكينة بنجاح (الأجزاء التابعة حُذفت تلقائيًا)'
        });

    } catch (error) {
        console.error('❌ خطأ في حذف الماكينة:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف الماكينة'
        });
    }
});

/*
===========================================
6. البحث في الماكينات
===========================================
*/
router.get('/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const [rows] = await pool.query(
            `SELECT serial, name, description, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at, delivered
             FROM machines 
             WHERE name LIKE ? OR description LIKE ? 
             ORDER BY created_at DESC`,
            [`%${keyword}%`, `%${keyword}%`]
        );

        res.json({
            success: true,
            message: 'تم البحث بنجاح',
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('❌ خطأ في البحث:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في البحث'
        });
    }
});

module.exports = router;
