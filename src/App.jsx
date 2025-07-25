// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, ref, get, signOut } from './firebase';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProfileForm from './components/ProfileForm';
import ActivityApply from './components/ActivityApply';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleProfileCreated = () => {
    setIsNewUser(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!user.email.endsWith('@g-mail.nsysu.edu.tw')) {
          alert('登入失敗：請務必使用 "@g-mail.nsysu.edu.tw" 結尾的學校帳號。');
          await signOut(auth);
          setCurrentUser(null);
        } else {
          // 【核心修正】我們現在使用 user.uid 來定位資料庫中的使用者路徑
          const userRef = ref(db, 'users/' + user.uid);
          const snapshot = await get(userRef);
          
          setIsNewUser(!snapshot.exists());
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>載入中...</div>;
  }

  if (!currentUser) {
    return <Login />;
  }
  
  if (isNewUser) {
    return <ProfileForm onProfileCreated={handleProfileCreated} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/apply" element={<ActivityApply />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;