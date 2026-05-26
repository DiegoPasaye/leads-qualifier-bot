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

    // si la llave no empieza con el formato pem, asumimos que es base64
    let privateKey = rawKey;
    if (!rawKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = Buffer.from(rawKey, 'base64').toString('utf-8');
    }

    /* 
    // codigo anterior por si no usas base64:
    const privateKey = rawKey
      .replace(/\\n/g, '\n')
      .replace(/"/g, '')
      .trim();
    */

    // limpieza final por si acaso
    privateKey = privateKey.replace(/\\n/g, '\n').trim();

    const serviceAccountAuth = new JWT({
      email: clientEmail?.replace(/^"|"$/g, ''),
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
