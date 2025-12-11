import React from "react";
import Machines from "./components/Machines";
import Parts from "./components/Parts";
import BarcodeOrSearch from "./components/BarcodeOrSearch";

function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f7fa", padding: "20px" }}>
      {/* 1️⃣ بحث عن جزء أو ماكينة أولًا */}
      <BarcodeOrSearch />
      <hr style={{ margin: "40px 0" }} />

      {/* 2️⃣ عرض الماكينات */}
      <Machines />
      <hr style={{ margin: "40px 0" }} />

      {/* 3️⃣ عرض وإضافة أجزاء جديدة لكل ماكينة */}
      <Parts />
    </div>
  );
}

export default App;
