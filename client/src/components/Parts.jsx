import React, { useState, useEffect } from "react";
import axios from "axios";

const Parts = () => {
  const [parts, setParts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [newPartName, setNewPartName] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [filterMachine, setFilterMachine] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // جلب الماكينات
  const fetchMachines = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/machines");
      const machinesData = res.data.data || [];
      setMachines(machinesData);
      if (machinesData.length > 0 && !selectedMachine) {
        setSelectedMachine(machinesData[0].serial);
      }
    } catch (err) {
      console.error(err);
      setMachines([]);
      setErrorMessage("❌ فشل تحميل الماكينات");
    }
  };

  // جلب الأجزاء
  const fetchParts = async () => {
    try {
      setIsLoading(true);
      let url = "http://localhost:5000/api/parts";
      if (filterMachine) url = `http://localhost:5000/api/parts/machine/${filterMachine}`;
      const res = await axios.get(url);
      setParts(res.data.data || []);
      setErrorMessage("");
    } catch (err) {
      console.error(err);
      setParts([]);
      setErrorMessage("❌ فشل تحميل الأجزاء");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMachines(); }, []);
  useEffect(() => { fetchParts(); }, [filterMachine]);

  // إضافة جزء
  const handleAddPart = async () => {
    if (!newPartName || !selectedMachine) {
      setErrorMessage("❌ الرجاء إدخال اسم الجزء واختيار الماكينة");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/parts", {
        part_name: newPartName,
        machine_id: selectedMachine,
      });
      setSuccessMessage("✔ تم إضافة الجزء بنجاح");
      setNewPartName("");
      fetchParts();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ حدث خطأ أثناء إضافة الجزء");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  // تحديث جزء (اسم أو تسليم)
  const handleUpdatePart = async (serial, updatedName, delivered) => {
    try {
      await axios.put(`http://localhost:5000/api/parts/${serial}`, {
        part_name: updatedName,
        delivered,
        machine_id: parts.find(p => p.serial_number === serial)?.machine_id || ""
      });
      setSuccessMessage("✔ تم حفظ التعديلات بنجاح");
      fetchParts();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ حدث خطأ أثناء التحديث");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  // حذف جزء
  const handleDeletePart = async (serial) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الجزء؟")) return;
    try {
      await axios.delete(`http://localhost:5000/api/parts/${serial}`);
      setSuccessMessage("✔ تم حذف الجزء بنجاح");
      fetchParts();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ حدث خطأ أثناء الحذف");
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  // فلترة وبحث مع حماية من undefined
  const filteredParts = parts
    .filter(p => p && (!filterMachine || p.machine_id === filterMachine))
    .filter(p => p && p.part_name.toLowerCase().includes(searchKeyword.toLowerCase()));

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>إدارة الأجزاء</h2>

        {successMessage && <div style={{ ...styles.alert, ...styles.success }}>{successMessage}</div>}
        {errorMessage && <div style={{ ...styles.alert, ...styles.error }}>{errorMessage}</div>}

        {/* إضافة جزء */}
        <div style={styles.addPartContainer}>
          <input
            type="text"
            placeholder="اسم الجزء"
            value={newPartName}
            onChange={(e) => setNewPartName(e.target.value)}
            style={styles.input}
          />
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            style={styles.select}
          >
            {machines.map((m) => (
              <option key={m.serial} value={m.serial}>{m.name}</option>
            ))}
          </select>
          <button onClick={handleAddPart} style={{ ...styles.button, ...styles.primaryButton }}>إضافة جزء</button>
        </div>

        {/* فلتر وبحث */}
        <div style={styles.filterContainer}>
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            style={styles.select}
          >
            <option value="">كل الماكينات</option>
            {machines.map((m) => (
              <option key={m.serial} value={m.serial}>{m.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="بحث بالاسم..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* عرض الأجزاء */}
        {isLoading ? (
          <p style={styles.loading}>جاري التحميل...</p>
        ) : filteredParts.length === 0 ? (
          <p style={styles.noMachines}>لا توجد أجزاء حاليا</p>
        ) : (
          <div style={styles.machinesGrid}>
            {filteredParts.map((part) => (
              <PartCard
                key={part.serial_number}
                part={part}
                onUpdate={handleUpdatePart}
                onDelete={handleDeletePart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// بطاقة الجزء مع أزرار مثل الماكينات
const PartCard = ({ part, onUpdate, onDelete }) => {
  const [editedName, setEditedName] = useState(part.part_name);
  const [delivered, setDelivered] = useState(part.delivered === 1);

  const handleSave = () => onUpdate(part.serial_number, editedName, delivered ? 1 : 0);
  const handleToggleDelivered = () => {
    const newStatus = !delivered;
    setDelivered(newStatus);
    onUpdate(part.serial_number, editedName, newStatus ? 1 : 0);
  };

  return (
    <div style={styles.machineCard}>
      {delivered && <div style={styles.deliveredBadge}>تم التسليم</div>}

      <input
        type="text"
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        style={styles.input}
      />

      <p><strong>الماكينة:</strong> {part.machine_name || "غير محددة"}</p>
      <p><strong>Serial:</strong> {part.serial_number}</p>
      <p><strong>تاريخ الإضافة:</strong> {part.created_at}</p>

      <div style={styles.cardActions}>
        <button style={{ ...styles.button, ...styles.primaryButton }} onClick={handleSave}>حفظ</button>
        <button style={{ ...styles.button, ...styles.cancelButton }} onClick={() => onDelete(part.serial_number)}>حذف</button>
        <button style={{ ...styles.button, background: '#2196f3', color: '#fff' }} onClick={handleToggleDelivered}>
          {delivered ? 'إلغاء التسليم' : 'تسليم'}
        </button>
      </div>
    </div>
  );
};

// الأنماط
const styles = {
  page: { padding: '20px', fontFamily: 'Tahoma, sans-serif', background: '#f9f9f9', minHeight: '100vh' },
  container: { maxWidth: '900px', margin: '0 auto' },
  title: { textAlign: 'center', marginBottom: '20px', color: '#333' },
  addPartContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  filterContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  input: { width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' },
  select: { padding: '8px' },
  button: { padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: 'bold' },
  primaryButton: { background: '#4caf50', color: '#fff' },
  cancelButton: { background: '#f44336', color: '#fff' },
  machinesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '15px' },
  machineCard: { background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', transition: '0.3s', position: 'relative' },
  cardActions: { display: 'flex', gap: '10px', marginTop: '10px' },
  deliveredBadge: { position: 'absolute', top: '10px', right: '10px', background: '#4caf50', color: '#fff', padding: '3px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' },
  alert: { padding: '10px', borderRadius: '5px', marginBottom: '15px', fontWeight: 'bold' },
  success: { background: '#d4edda', color: '#155724' },
  error: { background: '#f8d7da', color: '#721c24' },
  loading: { textAlign: 'center', margin: '20px 0' },
  noMachines: { textAlign: 'center', margin: '20px 0', color: '#999' },
};

export default Parts;
