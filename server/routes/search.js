const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// البحث بالـ Serial
router.get('/:serial', async (req, res) => {
  try {
    const { serial } = req.params;

    // البحث في الأجزاء أولًا
    const [parts] = await pool.query(`
      SELECT p.id, p.part_name, p.machine_id, m.name AS machine_name,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM parts p
      JOIN machines m ON p.machine_id = m.id
      WHERE p.id = ?
    `, [serial]);

    if (parts.length) return res.json({ success: true, type: 'part', data: parts[0] });

    // البحث في الماكينات
    const [machines] = await pool.query(`SELECT * FROM machines WHERE id = ?`, [serial]);
    if (!machines.length) return res.status(404).json({ success: false, message: "لم يتم العثور على جزء أو ماكينة بهذا Serial" });

    const machine = machines[0];

    // جلب الأجزاء التابعة للماكينة
    const [machineParts] = await pool.query(`
      SELECT id, part_name, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM parts
      WHERE machine_id = ?
    `, [serial]);

    res.json({ success: true, type: 'machine', data: { ...machine, parts: machineParts } });
  } catch (err) {
    console.error("❌ خطأ في البحث:", err);
    res.status(500).json({ success: false, message: "حدث خطأ في البحث بالـ Serial" });
  }
});

module.exports = router;
