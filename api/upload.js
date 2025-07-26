// api/upload.js
import { handleUpload } from '@vercel/blob/server';

export default async function handler(request, response) {
  // 檢查請求方法是否為 POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = request.body;

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

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}