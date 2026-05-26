import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

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
  return `-----BEGIN PRIVATE KEY-----\n${keyContent.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

export async function appendToSheet(data: {
  date: string;
  leadData: string;
  decision: string;
  reason: string;
}) {
  try {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!rawKey) throw new Error('GOOGLE_PRIVATE_KEY no definida');
    if (!clientEmail) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL no definida');
    if (!sheetId) throw new Error('GOOGLE_SHEET_ID no definida');

    const privateKey = normalizePrivateKey(rawKey);

    const serviceAccountAuth = new JWT({
      email: clientEmail?.replace(/["']/g, '').trim(),
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
