import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export async function appendToSheet(data: {
  date: string;
  leadData: string;
  decision: string;
  reason: string;
}) {
  try {
    // llaves de la cuenta de servicio de google
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYUX/ZxecBhUUw
tPfsRFY/sMgfzEUhtcreMiqjhkNtUreUcm1avR+xxuWuUPMfy1lq+UE/3JteH2pk
QFy2550EZuKVVQUl0FnIllMLRNFGgr32W17xnTg0G3dNOOKZHk1pZ/m4r16ZIWsT
1mW6EV64KIWr8ieCn9oRb1t7VEGuhk8xOvXBgHi7ovMorSayncO9faM3ChHP1CYQ
MZf00clchjaiH1yRM86dyXMCvb7hFzKPonaCZ5tVKoIz+LZoFsT7xlvqIG4Bj6AP
0p+KVnlYvBGAhjzDhOK5ldWFGihwoUIYFZs4nTAeogK70YthB71EFCAW8FujOBUO
cj4f1g6XAgMBAAECggEAGgfwsTWp/1pYwaw9W267zE1LP9xWg2B7ibKSw/vfuFOo
aNI+S5mPq1aKhCgUocJYP9G/4t36ymBQbsD6Bz6m/AUfhiXliS/h5gwE8Um2P1xz
XKaRLdUkEs0tVZsfVZq6aRFMkUd1REsrtgbqVfJKKjIiJ9drnsH6vXdflF9GyigB
zTk6KlkLnuyC5kFM/jK1rcc+OAMgvg2GwnTRxH3dQj1/c93ZiSeeOKStJwKwLEnh
t1FiE6AktnXzI05tQM4rV6djYtR9isOccJU102+Tz6g7YsNU8pqz9m1dRfWfIQV4
JP/N/4kalCGBuDg+bI6Umh6g+2qg5rd20WYw2vS0OQKBgQDyYB9WeuMJsAv5wpGO
CLpm8ZNUXbUrhtx9eqXcAuu3O0lxs/sOqdCIlsLYNvwDaSP4vzpalBvrCZ5omEjJ
NAwqQfRPbTvdpucBmgxudygKjFs0sJcmXtO9k0hEPxgdd60atjPOmU0ERxZC9Y4q
fgYlV4ELvZL53hOXpSWJN09AaQKBgQDkemel+fwrvUZAJ3f8uSd8Izhso7IRukMe
f2OSvg4R/yEXJBTXDKnpZJBsKQmLlwum+O4w1cwK+GDLYtzqOcHKZl+K/ua6BnN5
dwkH6QSuN/eoFIxmjoMx71IKX4qmcAQJsr4siDr8r3h48C/p6LxAqejJySe/Ligf
1QDe4AD2/wKBgD7To8vq9scgFzqasNg8cvUUUbhgwgGSZ70u+adaKnfIqnUKzl0y
r5d4XPFm71SDAIwOJbYtBj+asrEyKEvfbffWONoN2qLODLthjy9jO8HgOBQkYknT
8tcFQopOQJYC26A88pjvLAOb2a1psXxaRoWPdSfx8BNM+Y8pg91ZtPVhAoGBAIjy
XYH8zwugjaUSgzb1/BbKPZ3QmIFLtcNn89UXGfPringGZn9n1chRQMez6UbEKHXS
q2KWI5FHwyzleyjhqaiZqBb2JnHGQBzEHqOhJe8PGOCkQGuQbE7X9cLF9aNBbQor
GxYyKbkfrARBY1a+62eO8DtS2QIctmwuDjGI7ssdAoGAbMj9sQV0smTRdNjPvg8N
hk0RoAhgiEqu/R0hrE0ClzknvcDWArXhRD/djpr8hQb+WKRahfmwxWDxrtZ5PFXS
Bsaboeq+XAMew9X+DhjmcJRtDXKVpFSu/xOcajhlJKC8E2dNmZ3QOQCqDypKUbM0
vvtDuIeashbdivzNRZBC4M4=
-----END PRIVATE KEY-----`;

    const clientEmail = "leadsqualifierdiego@leadsqualifier.iam.gserviceaccount.com";
    const sheetId = "1oHmHT44XlPb1lsdY17K8_6QZJMlum-nETRpUmLmE-0o";

    // autenticacion con jwt
    const serviceAccountAuth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

    // insertar fila en el sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
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
