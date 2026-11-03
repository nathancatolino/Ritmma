type DriveTokenResponse = { access_token?: string; error?: string; error_description?: string };
type DriveTokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: DriveTokenResponse) => void;
            error_callback?: (error: { type?: string }) => void;
          }) => DriveTokenClient;
        };
      };
    };
  }
}

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function isGoogleDriveConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID);
}

function requestAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) return Promise.reject(new Error('O Google Drive ainda não está configurado para este app.'));
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) return Promise.reject(new Error('Não foi possível carregar a autenticação do Google. Recarregue a página.'));

  return new Promise((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => response.access_token
        ? resolve(response.access_token)
        : reject(new Error(response.error_description || response.error || 'A autorização do Google Drive foi recusada.')),
      error_callback: () => reject(new Error('A janela de autorização do Google Drive foi bloqueada.'))
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export interface DrivePhotoUpload {
  file: File;
  title: string;
  description: string;
  doctorEmail?: string;
}

export interface DrivePhotoResult {
  fileId: string;
  webViewLink: string;
  sharedWithDoctor: boolean;
}

export async function uploadPhotoToGoogleDrive({ file, title, description, doctorEmail }: DrivePhotoUpload): Promise<DrivePhotoResult> {
  const accessToken = await requestAccessToken();
  const metadata = {
    name: title,
    description,
    mimeType: file.type,
    appProperties: { app: 'Ritmma', kind: 'clinical-photo' }
  };
  const boundary = `ritmma_${crypto.randomUUID()}`;
  const multipart = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`
  ], { type: `multipart/related; boundary=${boundary}` });
  const upload = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart
  });
  if (!upload.ok) throw new Error('O Google Drive não conseguiu salvar esta imagem. Confira sua conexão e espaço disponível.');
  const result = await upload.json() as { id: string; webViewLink?: string };

  let sharedWithDoctor = false;
  if (doctorEmail) {
    const share = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(result.id)}/permissions?sendNotificationEmail=true`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'user', role: 'reader', emailAddress: doctorEmail })
    });
    if (!share.ok) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(result.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      throw new Error('A foto não foi salva porque não foi possível compartilhar a leitura com o profissional vinculado.');
    }
    sharedWithDoctor = true;
  }

  return {
    fileId: result.id,
    webViewLink: result.webViewLink || `https://drive.google.com/open?id=${encodeURIComponent(result.id)}`,
    sharedWithDoctor
  };
}
