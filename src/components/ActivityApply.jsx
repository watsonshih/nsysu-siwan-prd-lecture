// src/components/ActivityApply.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db, ref, get, auth, set, push, child } from '../firebase';
import { Link } from 'react-router-dom';
import { upload } from '@vercel/blob'; // 引入 Vercel Blob 的上傳功能

// 表單初始狀態的函式，方便重置表單
const getInitialFormData = () => ({
  semester: '',
  unit: '',
  contactPerson: '',
  title: '',
  phone: '',
  email: '',
  isEnglish: false,
  activityNameZh: '',
  activityNameEn: '',
  activityDate: '',
  startTime: '',
  endTime: '',
  location: '',
  speakers: [{ name: '', unit: '', title: '' }], // 至少一位講者
  needsTicket: false,
  hasOnlineRegistration: false,
  isCourseCredit: false,
  signInMethod: '學生證讀卡',
  remarks: '',
});

const ActivityApply = () => {
  const [announcement, setAnnouncement] = useState('');
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(getInitialFormData());
  const [proposalFile, setProposalFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = auth.currentUser;

  // 自動計算時長 (分鐘)
  const duration = useMemo(() => {
    if (!formData.startTime || !formData.endTime) return 0;
    try {
      const start = new Date(`1970-01-01T${formData.startTime}:00`);
      const end = new Date(`1970-01-01T${formData.endTime}:00`);
      const diff = (end - start) / (1000 * 60); // 轉換為分鐘
      return diff > 0 ? diff : 0;
    } catch (e) {
      return 0;
    }
  }, [formData.startTime, formData.endTime]);


  // 讀取設定與使用者預設資料
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const settingsRef = ref(db, 'settings');
        const userRef = ref(db, `users/${user.uid}`);

        // 同時讀取系統設定與使用者資料
        const [settingsSnapshot, userSnapshot] = await Promise.all([
          get(settingsRef),
          get(userRef),
        ]);

        // 處理系統設定
        if (settingsSnapshot.exists()) {
          const settings = settingsSnapshot.val();
          setAnnouncement(settings.announcement || '暫無公告');
          setFormData(prev => ({ ...prev, semester: settings.currentSemester || '' }));

          const today = new Date();
          const openDate = new Date(settings.openDate);
          const closeDate = new Date(settings.closeDate);
          closeDate.setDate(closeDate.getDate() + 1);
          setIsApplicationOpen(today >= openDate && today < closeDate);
        }

        // 預填使用者資料
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          setFormData(prev => ({
            ...prev,
            unit: userData.unit || '',
            contactPerson: userData.name || '',
            title: userData.title || '',
            phone: userData.phone || '',
            email: userData.email || '',
          }));
        }
      } catch (error) {
        console.error("讀取預設資料失敗:", error);
        alert("讀取預設資料失敗，請稍後再試。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 表單欄位通用更新函式
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  // 處理講者資訊變更
  const handleSpeakerChange = (index, e) => {
    const { name, value } = e.target;
    const newSpeakers = [...formData.speakers];
    newSpeakers[index][name] = value;
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
  };

  // 新增講者
  const addSpeaker = () => {
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { name: '', unit: '', title: '' }],
    }));
  };
  
  // 移除講者
  const removeSpeaker = (index) => {
    if (formData.speakers.length <= 1) {
      alert("必須至少保留一位講者。");
      return;
    }
    const newSpeakers = formData.speakers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
  };

  // 處理檔案上傳
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      alert("檔案格式錯誤，僅接受 PDF 檔案。");
      e.target.value = null; // 清空選擇
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) { // 5MB
      alert("檔案過大，請上傳 5MB 以內的檔案。");
      e.target.value = null; // 清空選擇
      return;
    }
    setProposalFile(file);
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (duration < 90) {
      alert("活動時長必須大於等於 90 分鐘。");
      return;
    }
    if (!proposalFile) {
      alert("請務必上傳活動企劃 PDF 檔案。");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 上傳檔案至 Vercel Blob
      const newBlob = await upload(proposalFile.name, proposalFile, {
        access: 'public',
        handleUploadUrl: '/api/upload', // Vercel 會自動處理這個 API 路由
      });
      
      // 2. 準備存入 Firebase 的資料
      const newApplicationRef = push(child(ref(db), 'applications'));
      const applicationData = {
        ...formData,
        applicationId: newApplicationRef.key, // 系統生成的唯一 ID
        applicantUid: user.uid, // 申請人 UID
        proposalUrl: newBlob.url, // Vercel Blob 回傳的檔案網址
        status: '簽核中',
        submittedAt: new Date().toISOString(),
        duration, // 儲存計算出的時長
      };

      // 3. 寫入 Firebase
      await set(newApplicationRef, applicationData);
      
      alert("申請成功送出！\n系統將會清空表單。\n請至「活動管理」頁面上傳簽核完成的 PDF 檔案。");
      // 4. 重置表單
      setFormData(getInitialFormData());
      setProposalFile(null);
      // 清空 file input 的值
      document.getElementById('proposalFile').value = null;
      // TODO: 實作跳出列印視窗功能

    } catch (error) {
      console.error("提交申請失敗:", error);
      alert(`提交失敗: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>讀取設定中...</div>;
  }

  // 主要 JSX 結構
  return (
    <div>
      <Link to="/">&lt; 返回主頁</Link>
      <h1>大學之道活動申請</h1>

      <div style={{ border: '1px solid #ccc', padding: '10px', margin: '20px 0' }}>
        <h3>公告資訊</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{announcement}</pre>
      </div>
      
      {isApplicationOpen ? (
        <form onSubmit={handleSubmit}>
          <h3>活動申請表單</h3>
          {/* 每一區塊的欄位... */}
          <fieldset>
            <legend>基本資料</legend>
            <p>申請學期/梯次: {formData.semester}</p>
            <p>承辦人: {formData.contactPerson}</p>
            <div><label>承辦單位: <input type="text" name="unit" value={formData.unit} onChange={handleChange} required /></label></div>
            <div><label>承辦人職稱: <input type="text" name="title" value={formData.title} onChange={handleChange} required /></label></div>
            <div><label>承辦人聯絡電話: <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></label></div>
            <div><label>承辦人 E-mail: <input type="email" name="email" value={formData.email} onChange={handleChange} required /></label></div>
          </fieldset>
          
          <fieldset>
            <legend>活動資訊</legend>
            <div><label>英文活動: <input type="checkbox" name="isEnglish" checked={formData.isEnglish} onChange={handleChange} /></label></div>
            <div><label>演講/活動主題中文名稱: <input type="text" name="activityNameZh" value={formData.activityNameZh} onChange={handleChange} required /></label></div>
            <div><label>演講/活動主題英文名稱: <input type="text" name="activityNameEn" value={formData.activityNameEn} onChange={handleChange} required /></label></div>
            <div><label>日期: <input type="date" name="activityDate" value={formData.activityDate} onChange={handleChange} required /></label></div>
            <div><label>開始時間: <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required /></label></div>
            <div><label>結束時間: <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required /></label></div>
            <div>時長: {duration} 分鐘 {duration > 0 && duration < 90 && <span style={{color: 'red'}}> (必須大於等於90分鐘)</span>}</div>
            <div><label>地點: <input type="text" name="location" value={formData.location} onChange={handleChange} required /></label></div>
          </fieldset>

          <fieldset>
            <legend>擬邀請講者</legend>
            {formData.speakers.map((speaker, index) => (
              <div key={index} style={{border: '1px dashed gray', padding: '10px', marginBottom: '10px'}}>
                <p>講者 {index + 1}</p>
                <div><label>姓名: <input type="text" name="name" value={speaker.name} onChange={(e) => handleSpeakerChange(index, e)} required /></label></div>
                <div><label>單位: <input type="text" name="unit" value={speaker.unit} onChange={(e) => handleSpeakerChange(index, e)} required /></label></div>
                <div><label>職稱: <input type="text" name="title" value={speaker.title} onChange={(e) => handleSpeakerChange(index, e)} required /></label></div>
                <button type="button" onClick={() => removeSpeaker(index)}>移除此講者</button>
              </div>
            ))}
            <button type="button" onClick={addSpeaker}>新增講者</button>
          </fieldset>

          <fieldset>
            <legend>其他資訊</legend>
            <div><label>需提前索票: <input type="checkbox" name="needsTicket" checked={formData.needsTicket} onChange={handleChange} /></label></div>
            <div><label>網路報名: <input type="checkbox" name="hasOnlineRegistration" checked={formData.hasOnlineRegistration} onChange={handleChange} /></label></div>
            <div><label>活動或演講屬於課程一部分或可取得學分: <input type="checkbox" name="isCourseCredit" checked={formData.isCourseCredit} onChange={handleChange} /></label>
              {formData.isCourseCredit && <p style={{color: 'orange'}}>提醒：活動或演講屬於課程一部分或可取得學分者，請勿申請認列。</p>}
            </div>
            <div><label>簽到退方式: 
              <select name="signInMethod" value={formData.signInMethod} onChange={handleChange}>
                <option value="學生證讀卡">學生證讀卡</option>
                <option value="紙本簽到退">紙本簽到退</option>
                <option value="請洽主辦單位">請洽主辦單位</option>
              </select>
            </label></div>
          </fieldset>

          <fieldset>
            <legend>附件與備註</legend>
            <div><label>活動企劃 (PDF, 5MB以內): <input type="file" id="proposalFile" name="proposalFile" accept="application/pdf" onChange={handleFileChange} required /></label></div>
            <div><label>備註: <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="4" cols="50" /></label></div>
          </fieldset>

          <button type="submit" disabled={isSubmitting || duration < 90}>
            {isSubmitting ? '提交中...' : '生成簽核單並送出申請'}
          </button>
        </form>
      ) : (
        <p style={{ color: 'red' }}>目前非開放申請期間，無法填寫表單。</p>
      )}
    </div>
  );
};

export default ActivityApply;