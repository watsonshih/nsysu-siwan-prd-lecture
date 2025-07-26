// api/upload.js
import { handleUpload } from '@vercel/blob/server';

export default async function handler(request, response) {
  // 預檢請求
  if (request.method === 'OPTIONS') {
    response.setHeader('Access-Control-Allow-Origin', '*');           // 視需要改成你的前端網域
    response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');
    return response.status(204).end();
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS');
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const jsonResponse = await handleUpload({
      request,
      body: request.body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/pdf'],
        tokenPayload: JSON.stringify({}),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('Vercel Blob upload completed', blob.url);
      },
    });

    response.setHeader('Access-Control-Allow-Origin', '*'); // 如需
    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}
