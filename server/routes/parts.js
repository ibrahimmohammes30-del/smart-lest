const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

/*---------------------------------
1. جلب كل الأجزاء لجميع الماكينات
---------------------------------*/
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.serial AS serial_number, p.part_name,
             p.machine_id, m.name AS machine_name,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
             p.delivered
      FROM parts p
      JOIN machines m ON p.machine_id = m.serial
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, message: "تم جلب جميع الأجزاء بنجاح", count: rows.length, data: rows });
  } catch (error) {
    console.error("❌ خطأ في جلب الأجزاء:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في جلب الأجزاء" });
  }
});

/*---------------------------------
2. جلب كل أجزاء ماكينة معينة
---------------------------------*/
router.get("/machine/:machine_id", async (req, res) => {
  try {
    const { machine_id } = req.params;
    const [rows] = await pool.query(
      "SELECT serial AS serial_number, part_name, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at, delivered FROM parts WHERE machine_id = ? ORDER BY created_at DESC",
      [machine_id]
    );
    res.json({ success: true, message: "تم جلب أجزاء الماكينة بنجاح", count: rows.length, data: rows });
  } catch (error) {
    console.error("❌ خطأ في جلب أجزاء الماكينة:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في جلب أجزاء الماكينة" });
  }
});

/*---------------------------------
3. جلب جزء واحد
---------------------------------*/
router.get("/:serial", async (req, res) => {
  try {
    const { serial } = req.params;
    const [rows] = await pool.query(
      `SELECT p.serial AS serial_number, p.part_name, p.machine_id, m.name AS machine_name,
              DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at, p.delivered
       FROM parts p
       JOIN machines m ON p.machine_id = m.serial
       WHERE p.serial = ?`,
      [serial]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "الجزء غير موجود" });
    res.json({ success: true, message: "تم جلب بيانات الجزء بنجاح", data: rows[0] });
  } catch (error) {
    console.error("❌ خطأ في عرض الجزء:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في جلب بيانات الجزء" });
  }
});

/*---------------------------------
4. إضافة جزء جديد
---------------------------------*/
router.post("/", async (req, res) => {
  try {
    const { part_name, machine_id } = req.body;
    if (!part_name || !machine_id) return res.status(400).json({ success: false, message: "اسم الجزء ومعرف الماكينة مطلوبان" });

    // التحقق من وجود الماكينة
    const [machine] = await pool.query("SELECT serial FROM machines WHERE serial = ?", [machine_id]);
    if (machine.length === 0) return res.status(404).json({ success: false, message: "المكينة غير موجودة" });

    const [result] = await pool.query("INSERT INTO parts (part_name, machine_id) VALUES (?, ?)", [part_name.trim(), machine_id]);

    const [newPart] = await pool.query("SELECT serial AS serial_number, part_name, machine_id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at, delivered FROM parts WHERE serial = ?", [result.insertId]);

    res.status(201).json({ success: true, message: "تم إضافة الجزء بنجاح", data: newPart[0] });
  } catch (error) {
    console.error("❌ خطأ في إضافة جزء:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في إضافة الجزء" });
  }
});

/*---------------------------------
5. تحديث جزء كامل
---------------------------------*/
router.put("/:serial", async (req, res) => {
  try {
    const { serial } = req.params;
    const { part_name, machine_id, delivered } = req.body;

    const [partCheck] = await pool.query("SELECT serial FROM parts WHERE serial = ?", [serial]);
    if (partCheck.length === 0) return res.status(404).json({ success: false, message: "الجزء غير موجود" });

    const [machineCheck] = await pool.query("SELECT serial FROM machines WHERE serial = ?", [machine_id]);
    if (machineCheck.length === 0) return res.status(404).json({ success: false, message: "المكينة غير موجودة" });

    await pool.query("UPDATE parts SET part_name = ?, machine_id = ?, delivered = ? WHERE serial = ?", [part_name.trim(), machine_id, delivered ? 1 : 0, serial]);

    const [updated] = await pool.query("SELECT serial AS serial_number, part_name, machine_id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at, delivered FROM parts WHERE serial = ?", [serial]);

    res.json({ success: true, message: "تم تحديث الجزء بنجاح", data: updated[0] });
  } catch (error) {
    console.error("❌ خطأ في تحديث الجزء:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في تحديث الجزء" });
  }
});

/*---------------------------------
6. تحديث حالة التسليم فقط
---------------------------------*/
router.put("/delivered/:serial", async (req, res) => {
  try {
    const { serial } = req.params;
    const { delivered } = req.body;

    const [partCheck] = await pool.query("SELECT serial FROM parts WHERE serial = ?", [serial]);
    if (partCheck.length === 0) return res.status(404).json({ success: false, message: "الجزء غير موجود" });

    await pool.query("UPDATE parts SET delivered = ? WHERE serial = ?", [delivered ? 1 : 0, serial]);

    const [updated] = await pool.query("SELECT serial AS serial_number, part_name, machine_id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at, delivered FROM parts WHERE serial = ?", [serial]);

    res.json({ success: true, message: "تم تحديث حالة التسليم بنجاح", data: updated[0] });
  } catch (error) {
    console.error("❌ خطأ في تحديث حالة التسليم:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء تحديث حالة التسليم" });
  }
});

/*---------------------------------
7. حذف جزء
---------------------------------*/
router.delete("/:serial", async (req, res) => {
  try {
    const { serial } = req.params;
    const [partCheck] = await pool.query("SELECT serial FROM parts WHERE serial = ?", [serial]);
    if (partCheck.length === 0) return res.status(404).json({ success: false, message: "الجزء غير موجود" });

    await pool.query("DELETE FROM parts WHERE serial = ?", [serial]);
    res.json({ success: true, message: "تم حذف الجزء بنجاح" });
  } catch (error) {
    console.error("❌ خطأ في حذف الجزء:", error);
    res.status(500).json({ success: false, message: "حدث خطأ في حذف الجزء" });
  }
});

module.exports = router;
