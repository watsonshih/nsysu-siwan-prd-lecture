// api/upload.js
import { handleUpload } from '@vercel/blob/server';

export default async function handler(request, response) {
  const body = request.body;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // 【核心修正】將 pathname 改為 _pathname，告訴 Linter 我們故意不用它
      onBeforeGenerateToken: async (_pathname /*, clientPayload */) => {
        return {
          allowedContentTypes: ['application/pdf'],
          tokenPayload: JSON.stringify({
            // 此處可以為空，或放入未來可能用到的資訊
          }),
        };
      },
      // 【核心修正】只解構我們需要用到的 blob 參數
      onUploadCompleted: async ({ blob }) => {
        console.log('Vercel Blob upload completed', blob.url);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}