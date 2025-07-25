// src/components/ProfileForm.jsx
import React, { useState } from 'react';
import { auth, db, ref, set } from '../firebase';

const ProfileForm = ({ onProfileCreated }) => {
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    title: '',
    phone: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userData = {
      // 依 PRD 規定，這個 id 是指 Email 前綴的學號，用於顯示
      id: user.email.split('@')[0], 
      // 這個 uid 是 Firebase 的使用者認證 ID，用於資料庫定位
      uid: user.uid,
      name: formData.name,
      unit: formData.unit,
      title: formData.title,
      phone: formData.phone,
      email: formData.email,
      role: 'applicant',
    };

    try {
      // 【核心修正】我們使用 user.uid 作為資料庫路徑的 key 來儲存整包使用者資料
      await set(ref(db, 'users/' + user.uid), userData);
      
      alert('資料儲存成功！');
      if (onProfileCreated) {
        onProfileCreated();
      }
    } catch (error) {
      console.error("儲存資料失敗:", error);
      alert(`儲存失敗: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>初次使用系統，請填寫您的基本資料</h1>
      <p>所有欄位皆為必填</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ID (系統自動帶入):</label>
          <input type="text" value={user.email.split('@')[0]} disabled />
        </div>
        <div>
          <label htmlFor="name">姓名:</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="unit">單位:</label>
          <input type="text" id="unit" name="unit" value={formData.unit} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="title">職稱:</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="phone">聯絡電話:</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="email">常用 E-mail:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '儲存中...' : '儲存資料'}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;