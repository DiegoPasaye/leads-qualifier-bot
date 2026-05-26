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

    // limpieza total para vercel
    const privateKey = rawKey
      .replace(/\\n/g, '\n')     // convierte \n literales
      .replace(/"/g, '')         // quita comillas dobles accidentales
      .replace(/'/g, '')         // quita comillas simples accidentales
      .trim();                   // quita espacios/saltos extra

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
