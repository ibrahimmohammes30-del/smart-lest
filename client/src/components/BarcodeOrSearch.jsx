import React, { useState } from "react";
import axios from "axios";

const BarcodeOrSearch = () => {
  const [searchValue, setSearchValue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) return alert("الرجاء إدخال Serial");
    setLoading(true);
    setResult(null);

    try {
      // البحث أولًا في الأجزاء
      const partRes = await axios.get(`http://localhost:5000/api/parts/${searchValue}`);
      if (partRes.data.success && partRes.data.data) {
        setResult({ type: "part", data: partRes.data.data });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("لم يتم العثور على جزء بهذا Serial");
    }

    try {
      // البحث في الماكينات
      const machineRes = await axios.get(`http://localhost:5000/api/machines/${searchValue}`);
      if (machineRes.data.success && machineRes.data.data) {
        const machine = machineRes.data.data;

        // جلب الأجزاء التابعة للماكينة
        const partsRes = await axios.get(`http://localhost:5000/api/parts/machine/${machine.serial}`);
        setResult({
          type: "machine",
          data: {
            ...machine,
            status: machine.delivered ? "تم التسليم" : "غير محددة",
            parts: partsRes.data.data.map(p => ({
              ...p,
              delivered: p.delivered ? true : false
            })) || []
          }
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("لم يتم العثور على ماكينة بهذا Serial");
    }

    setLoading(false);
    alert("❌ لم يتم العثور على جزء أو ماكينة بهذا الـ Serial");
  };

  return (
    <div style={{
      padding: "30px",
      maxWidth: "800px",
      margin: "20px auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "25px" }}>🔍 بحث عن ماكينة أو جزء</h2>

      {/* مدخل البحث */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="أدخل Serial الجزء أو الماكينة"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          style={{
            padding: "12px",
            width: "70%",
            border: "1px solid #ccc",
            borderRadius: "6px 0 0 6px",
            outline: "none",
            fontSize: "16px"
          }}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "12px 25px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "0 6px 6px 0",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          {loading ? "جار البحث..." : "بحث"}
        </button>
      </div>

      {/* عرض الجزء */}
      {result && result.type === "part" && result.data && (
        <div style={{
          backgroundColor: "#e8f4ff",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          marginBottom: "20px"
        }}>
          <h3 style={{ color: "#007BFF", marginBottom: "10px" }}>الجزء: {result.data.part_name}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <p><strong>تابع للماكينة:</strong> {result.data.machine_name || "غير محددة"}</p>
            <p><strong>Serial الجزء:</strong> {result.data.serial_number}</p>
            <p><strong>تاريخ الإضافة:</strong> {result.data.created_at}</p>
            <p><strong>تم التسليم:</strong> {result.data.delivered ? "نعم" : "لا"}</p>
          </div>
        </div>
      )}

      {/* عرض الماكينة وجميع أجزاءها */}
      {result && result.type === "machine" && result.data && (
        <div style={{
          backgroundColor: "#fff7f0",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ color: "#FF5722", marginBottom: "10px" }}>الماكينة: {result.data.name}</h3>
          <p style={{ fontStyle: "italic", marginBottom: "15px" }}>{result.data.description || "لا يوجد وصف"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            <p><strong>Serial الماكينة:</strong> {result.data.serial}</p>
            <p><strong>حالة الماكينة:</strong> {result.data.status}</p>
          </div>

          <h4 style={{ marginBottom: "10px" }}>الأجزاء التابعة:</h4>
          {result.data.parts.length === 0 ? (
            <p style={{ padding: "10px", backgroundColor: "#fff3e0", borderRadius: "6px" }}>لا توجد أجزاء لهذه الماكينة</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "15px" }}>
              {result.data.parts.map(p => (
                <div key={p.serial_number} style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}>
                  <p><strong>الجزء:</strong> {p.part_name}</p>
                  <p><strong>Serial:</strong> {p.serial_number}</p>
                  <p><strong>تاريخ الإضافة:</strong> {p.created_at}</p>
                  <p><strong>تم التسليم:</strong> {p.delivered ? "نعم" : "لا"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BarcodeOrSearch;
