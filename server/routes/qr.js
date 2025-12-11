// routes/search.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// البحث بالـ Serial (جزء أو ماكينة)
router.get('/:serial', async (req, res) => {
  try {
    const { serial } = req.params;

    // 1️⃣ البحث في الأجزاء أولاً
    const [parts] = await pool.query(`
      SELECT p.id AS serial, p.part_name, p.delivered, p.machine_id,
             m.name AS machine_name,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM parts p
      LEFT JOIN machines m ON p.machine_id = m.id
      WHERE p.id = ?
    `, [serial]);

    if (parts.length > 0) {
      return res.json({
        success: true,
        type: 'part',
        data: parts[0]
      });
    }

    // 2️⃣ البحث في الماكينات
    const [machines] = await pool.query(`
      SELECT m.id AS serial, m.name, m.description
      FROM machines m
      WHERE m.id = ?
    `, [serial]);

    if (machines.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على جزء أو ماكينة بهذا Serial'
      });
    }

    const machine = machines[0];

    // جلب جميع الأجزاء التابعة للماكينة
    const [machineParts] = await pool.query(`
      SELECT id AS serial, part_name, delivered,
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM parts
      WHERE machine_id = ?
    `, [serial]);

    res.json({
      success: true,
      type: 'machine',
      data: {
        ...machine,
        parts: machineParts
      }
    });

  } catch (err) {
    console.error('❌ خطأ في البحث بالـ Serial:', err);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في البحث بالـ Serial'
    });
  }
});

module.exports = router;
