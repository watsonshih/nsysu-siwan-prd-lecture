// api/upload.js
import { handleUpload, VercelBlobError } from '@vercel/blob/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  try {
    // 【核心修正】將 request 和 response 交給 handleUpload，並等待它完成即可。
    // handleUpload 會自行處理所有需要回傳給前端的回應。
    await handleUpload({
      request,
      response,
      onBeforeGenerateToken: async (pathname) => {
        // pathname 是前端準備上傳的檔案名稱
        return {
          allowedContentTypes: ['application/pdf'],
          tokenPayload: JSON.stringify({
            // 如果需要在上傳完成後使用特定資料（如使用者ID），可以在此傳遞
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 這個函式會在檔案成功上傳到 Vercel Blob 後於「伺服器端」執行
        console.log('檔案上傳成功!', blob.url);
        // 您可以在此處執行額外的伺服器端操作，例如記錄到另一個資料庫
      },
    });

    // 【核心修正】刪除所有在 handleUpload 之後的 response.status(...).json(...) 程式碼
    // 因為 handleUpload 已經處理完畢，所以函式到此直接結束。

  } catch (error) {
    // 【重要】在 Vercel 日誌中印出完整的錯誤物件，方便我們除錯
    console.error("Upload API Error:", error); 

    if (error instanceof VercelBlobError) {
      // 這是 Vercel Blob 套件已知的錯誤
      return response.status(400).json({ error: error.message });
    }
    // 捕捉所有其他未預期的錯誤
    return response.status(500).json({ error: '發生未預期的伺服器錯誤。' });
  }
}