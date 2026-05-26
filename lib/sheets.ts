import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

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

    // 1. decodificar si es base64 o usar normal
    let decoded = rawKey;
    if (!rawKey.includes('-----BEGIN')) {
      decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
    }

    // 2. estrategia nuclear: extraer solo el contenido base64 de la llave
    // quitamos cabeceras, pies, saltos de linea y espacios
    const keyContent = decoded
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')
      .replace(/\\n/g, '');

    // 3. reconstruir el pem perfecto
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${keyContent}\n-----END PRIVATE KEY-----\n`;

    const serviceAccountAuth = new JWT({
      email: clientEmail?.replace(/["']/g, '').trim(),
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId?.replace(/^"|"$/g, ''),
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
