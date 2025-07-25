// src/components/Login.jsx
import React from 'react';
import { auth, provider, signInWithPopup } from '../firebase';

const Login = () => {
  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .catch((error) => {
        // 登入彈出視窗被使用者關閉等錯誤，可以在此處理
        console.error("登入過程中斷或發生錯誤:", error);
      });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h1>西灣學院大學之道線上申請系統</h1>
        <button onClick={handleGoogleSignIn} style={{ padding: '10px 20px', fontSize: '16px', width: '100%' }}>
          使用 Google 帳號登入
        </button>
      </div>
    </div>
  );
};

export default Login;