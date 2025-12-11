import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    delivered: false,
    editSerial: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // جلب الماكينات
  const fetchMachines = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/machines');
      setMachines(res.data.data || []);
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setErrorMessage('❌ فشل تحميل الماكينات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMachines(); }, []);

  // التعامل مع تغييرات الفورم
  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => setFormData({ name: '', description: '', delivered: false, editSerial: null });

  // حفظ أو تحديث الماكينة
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name) return setErrorMessage('اسم الماكينة مطلوب');

    try {
      setIsLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        delivered: formData.delivered ? 1 : 0,
      };

      if (formData.editSerial) {
        await axios.put(`http://localhost:5000/api/machines/${formData.editSerial}`, payload);
        setSuccessMessage('تم تحديث الماكينة بنجاح');
      } else {
        await axios.post('http://localhost:5000/api/machines', payload);
        setSuccessMessage('تم إضافة الماكينة بنجاح');
      }

      await fetchMachines();
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
      setErrorMessage('');
    } catch (err) {
      console.error(err);
      setErrorMessage('❌ حدث خطأ أثناء العملية');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  // تعديل الماكينة
  const handleEdit = machine => {
    setFormData({
      name: machine.name || '',
      description: machine.description || '',
      delivered: machine.delivered === 1,
      editSerial: machine.serial,  // استخدام serial الصحيح
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // حذف الماكينة
  const handleDelete = async serial => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الماكينة؟')) return;
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:5000/api/machines/${serial}`);
      setSuccessMessage('تم حذف الماكينة بنجاح');
      await fetchMachines();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('❌ حدث خطأ أثناء الحذف');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally { setIsLoading(false); }
  };

  // تبديل حالة التسليم
  const toggleDelivered = async machine => {
    try {
      setIsLoading(true);
      await axios.put(`http://localhost:5000/api/machines/${machine.serial}`, {
        name: machine.name,
        description: machine.description,
        delivered: machine.delivered ? 0 : 1,
      });
      await fetchMachines();
    } catch (err) {
      console.error(err);
      setErrorMessage('❌ حدث خطأ أثناء تحديث التسليم');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally { setIsLoading(false); }
  };

  // الأنماط
  const styles = {
    page: { padding: '20px', fontFamily: 'Tahoma, sans-serif', background: '#f9f9f9', minHeight: '100vh' },
    container: { maxWidth: '900px', margin: '0 auto' },
    title: { textAlign: 'center', marginBottom: '20px', color: '#333' },
    form: { background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
    input: { width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' },
    buttonGroup: { display: 'flex', gap: '10px' },
    button: { padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: 'bold' },
    primaryButton: { background: '#4caf50', color: '#fff' },
    cancelButton: { background: '#f44336', color: '#fff' },
    alert: { padding: '10px', borderRadius: '5px', marginBottom: '15px', fontWeight: 'bold' },
    success: { background: '#d4edda', color: '#155724' },
    error: { background: '#f8d7da', color: '#721c24' },
    machinesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '15px' },
    machineCard: { background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', transition: '0.3s', position: 'relative' },
    cardActions: { marginTop: '10px', display: 'flex', gap: '10px' },
    muted: { color: '#666' },
    loading: { textAlign: 'center', margin: '20px 0' },
    noMachines: { textAlign: 'center', margin: '20px 0', color: '#999' },
    deliveredBadge: { position: 'absolute', top: '10px', right: '10px', background: '#4caf50', color: '#fff', padding: '3px 8px', borderRadius: '5px', fontSize: '12px' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>إدارة الماكينات</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{formData.editSerial ? 'تعديل الماكينة' : 'إضافة ماكينة جديدة'}</h3>
          {successMessage && <div style={{ ...styles.alert, ...styles.success }}>{successMessage}</div>}
          {errorMessage && <div style={{ ...styles.alert, ...styles.error }}>{errorMessage}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>اسم الماكينة</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} style={styles.input} required />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>وصف الماكينة</label>
            <input type="text" name="description" value={formData.description} onChange={handleInputChange} style={styles.input} />
          </div>

          <div style={styles.formGroup}>
            <label>
              <input type="checkbox" name="delivered" checked={formData.delivered} onChange={handleInputChange} /> تم التسليم
            </label>
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" style={{ ...styles.button, ...styles.primaryButton }} disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : (formData.editSerial ? 'تحديث' : 'حفظ')}
            </button>
            {formData.editSerial && (
              <button type="button" style={{ ...styles.button, ...styles.cancelButton }} onClick={resetForm} disabled={isLoading}>إلغاء</button>
            )}
          </div>
        </form>

        <div>
          <h3>قائمة الماكينات</h3>
          {isLoading && machines.length === 0 ? (
            <div style={styles.loading}>جاري التحميل...</div>
          ) : machines.length === 0 ? (
            <div style={styles.noMachines}>لا توجد ماكينات متاحة</div>
          ) : (
            <div style={styles.machinesGrid}>
              {machines.map(machine => (
                <div key={machine.serial} style={styles.machineCard}>
                  {machine.delivered ? <div style={styles.deliveredBadge}>تم التسليم</div> : null}
                  <h4>{machine.name} (Serial: {machine.serial})</h4>
                  <p style={styles.muted}>{machine.description || 'لا يوجد وصف'}</p>
                  <small>مضافة في: {machine.created_at}</small>
                  <div style={styles.cardActions}>
                    <button style={{ ...styles.button, ...styles.primaryButton }} onClick={() => handleEdit(machine)}>تعديل</button>
                    <button style={{ ...styles.button, color: 'red', background: 'transparent', border: '1px solid red' }} onClick={() => handleDelete(machine.serial)}>حذف</button>
                    <button style={{ ...styles.button, background: '#2196f3', color: '#fff' }} onClick={() => toggleDelivered(machine)}>
                      {machine.delivered ? 'إلغاء التسليم' : 'تسليم'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Machines;
