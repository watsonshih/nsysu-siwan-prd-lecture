// src/components/Dashboard.jsx
import React from 'react';
import { auth, signOut } from '../firebase';
import { Link } from 'react-router-dom'; // 引入 Link

const Dashboard = () => {
  const handleLogout = () => {
    signOut(auth).catch(error => console.error("Logout Failed", error));
  };

  return (
    <div>
      <h1>歡迎，您已成功登入！</h1>
      <p>這裡是系統主頁面。</p>
      <p>使用者 Email: {auth.currentUser?.email}</p>
      <nav>
        <Link to="/apply">
          <button>前往活動申請</button>
        </Link>
      </nav>
      <br/>
      <button onClick={handleLogout}>登出</button>
    </div>
  );
};

export default Dashboard;