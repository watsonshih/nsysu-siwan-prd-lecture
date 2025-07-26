// /api/upload.js
// 【2025-07-26 最新正確版本】

import { put, BlobError } from '@vercel/blob';

export default async function handler(request, response) {
  // 確保請求方法是 POST
  console.log("Received request:", request.method, request.body);
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. 取得前端 @vercel/blob/client 的 upload() 函式傳來的完整 body
    //    Vercel 會自動為我們解析 JSON
    const body = request.body;

    // 2. 從 body.payload 中取得檔案名稱
    //    這是修正的核心：pathname 被包在 payload 物件裡面！
    const pathname = body?.payload?.pathname;

    // 3. 再次驗證 pathname 是否存在
    if (!pathname) {
      return response.status(400).json({ error: 'Missing pathname in request payload' });
    }

    // 4. 呼叫 put 函式產生一個帶有簽名的上傳 URL
    //    注意：這裡不再有 onBeforeGenerateToken，安全性檢查需要直接在這裡完成
    const blob = await put(pathname, {
      access: 'public', // 檔案設為公開
      addRandomSuffix: false, // 不自動添加隨機後綴
    });

    // 5. 將 Vercel Blob 回傳的完整資訊（包含簽名 URL）回傳給前端
    //    前端的 upload() 函式需要這個完整的物件來完成後續操作
    return response.status(200).json(blob);

  } catch (error) {
    if (error instanceof BlobError) {
      return response.status(400).json({ error: error.message });
    }
    console.error("An unexpected error occurred:", error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}