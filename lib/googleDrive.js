import { getDriveClient } from './googleSheets';
import { Readable } from 'stream';

export async function uploadImageToDrive({ base64, mimeType, name }) {
  const drive = await getDriveClient();

  // Clean folder id from env
  let folderId = (process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim();
  // remove accidental quotes
  folderId = folderId.replace(/^["']|["']$/g, '');

  if (!base64) {
    throw new Error('Image base64 missing');
  }

  const buffer = Buffer.from(base64, 'base64');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const requestBody = {
    name: name || `evidence_${Date.now()}.jpg`,
  };

  // Only add parents if folder id exists
  if (folderId) {
    requestBody.parents = [folderId];
  }

  try {
    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType: mimeType || 'image/jpeg',
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
      // Shared Drives ke liye zaroori
      supportsAllDrives: true,
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error('Drive upload failed: no file id returned');
    }

    // Public view permission
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
    } catch (permErr) {
      // Shared drive me permission policy alag ho sakti hai — file phir bhi upload ho chuki hai
      console.warn('Permission warning:', permErr.message);
    }

    // Prefer webViewLink
    if (response.data.webViewLink) {
      return response.data.webViewLink;
    }

    return `https://drive.google.com/file/d/${fileId}/view`;
  } catch (err) {
    const msg = err?.message || '';
    const status = err?.code || err?.status;

    // Folder not found / no access
    if (status === 404 || msg.toLowerCase().includes('file not found')) {
      throw new Error(
        `Drive folder not found or no access. ` +
          `Check GOOGLE_DRIVE_FOLDER_ID="${folderId}" and share that folder with GOOGLE_CLIENT_EMAIL as Editor. ` +
          `Original: ${msg}`
      );
    }

    // Storage / quota / auth
    if (status === 403) {
      throw new Error(
        `Drive permission denied. Share folder with service account (Editor). Original: ${msg}`
      );
    }

    throw new Error(`Drive upload failed: ${msg}`);
  }
}