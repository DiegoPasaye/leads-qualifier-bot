import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { createPrivateKey } from 'crypto';

type GoogleCredentials = {
  client_email?: string;
  private_key?: string;
};

function normalizePrivateKey(rawKey: string) {
  let key = rawKey.trim().replace(/^["']|["']$/g, '');

  if (key.startsWith('{')) {
    try {
      const parsed = JSON.parse(key) as { private_key?: string };
      if (parsed.private_key) key = parsed.private_key;
    } catch {
      // Si no era JSON valido, continuamos con el valor original.
    }
  }

  if (!key.includes('-----BEGIN')) {
    key = Buffer.from(key, 'base64').toString('utf-8').trim();
  }

  key = key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();

  const match = key.match(
    /-----BEGIN (?:RSA )?PRIVATE KEY-----([\s\S]+?)-----END (?:RSA )?PRIVATE KEY-----/,
  );
  if (!match) {
    throw new Error('GOOGLE_PRIVATE_KEY tiene un formato invalido');
  }

  const keyContent = match[1].replace(/\s/g, '');
  const privateKey = `-----BEGIN PRIVATE KEY-----\n${keyContent.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----\n`;

  createPrivateKey(privateKey);

  return privateKey;
}

function parseServiceAccount(rawCredentials: string) {
  const trimmed = rawCredentials.trim().replace(/^["']|["']$/g, '');
  const json = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf-8');

  return JSON.parse(json) as GoogleCredentials;
}

function getGoogleCredentials() {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (rawCredentials) {
    const credentials = parseServiceAccount(rawCredentials);
    if (!credentials.client_email) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 no contiene client_email');
    }
    if (!credentials.private_key) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 no contiene private_key');
    }

    return {
      clientEmail: credentials.client_email,
      privateKey: normalizePrivateKey(credentials.private_key),
    };
  }

  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!rawKey) throw new Error('GOOGLE_PRIVATE_KEY no definida');
  if (!clientEmail) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL no definida');

  return {
    clientEmail: clientEmail.replace(/["']/g, '').trim(),
    privateKey: normalizePrivateKey(rawKey),
  };
}

export async function appendToSheet(data: {
  date: string;
  leadData: string;
  decision: string;
  reason: string;
}) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) throw new Error('GOOGLE_SHEET_ID no definida');

    const { clientEmail, privateKey } = getGoogleCredentials();

    const serviceAccountAuth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId.replace(/^"|"$/g, ''),
      range: 'A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[data.date, data.leadData, data.decision, data.reason]],
      },
    });
    
    console.log('lead guardado correctamente');
  } catch (error) {
    console.error('error en sheets:', error);
    throw error;
  }
}
