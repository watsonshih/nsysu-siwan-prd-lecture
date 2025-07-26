// api/upload.js
import { handleUpload } from '@vercel/blob/server';

export default async function handler(request, response) {
  // 【核心修正】直接將 request 和 response 交給 handleUpload 處理
  // 它會自動處理 OPTIONS (預檢)、POST (請求簽名URL)、PUT (上傳) 等動作
  try {
    const jsonResponse = await handleUpload({
      request,
      response, // 將 response 物件傳遞進去
      onBeforeGenerateToken: async () => {
        // 這是在請求簽名 URL 時觸發
        return {
          allowedContentTypes: ['application/pdf'],
          tokenPayload: JSON.stringify({
            // 可以在此夾帶額外資訊，例如使用者ID
            // userId: 'user.id' 
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 檔案上傳完成後觸發
        console.log('Vercel Blob upload completed', blob.url);
        // 您可以在此處進行後續操作，例如將 blob.url 存到您的資料庫
      },
    });

    // handleUpload 成功後會回傳 JSON，您可以直接返回給前端
    return response.status(200).json(jsonResponse);
  } catch (error) {
    // 如果 handleUpload 內部出錯
    return response.status(400).json({ error: error.message });
  }
}