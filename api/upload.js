// api/upload.js
import { handleUpload } from '@vercel/blob/server';

// 【核心修正】從導出一個預設的 handler，改為導出一個名為 POST 的函式
export async function POST(request) {
  // 【核心修正】從 request.body 改為 await request.json() 來獲取請求內容
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        return {
          allowedContentTypes: ['application/pdf'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Vercel Blob upload completed', blob.url);
      },
    });

    // 【核心修正】從 response.status().json() 改為回傳一個標準的 Response 物件
    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, // Bad Request
      headers: { 'Content-Type': 'application/json' },
    });
  }
}