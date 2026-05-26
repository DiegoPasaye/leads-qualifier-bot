import { NextRequest, NextResponse } from 'next/server';
import { qualifyLead } from '@/lib/openai';
import { appendToSheet } from '@/lib/sheets';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// limites y configuracion de seguridad
const MAX_BODY_SIZE = 100_000; // 100kb
const MAX_TEXT_LENGTH = 1000;
const RATE_LIMIT_WINDOW = 60_000; // 1 minuto
const MAX_MESSAGES_PER_WINDOW = 10;

// stores en memoria (se limpian al reiniciar el servidor)
const rateLimitMap = new Map<number, { count: number; reset: number }>();
const processedUpdates = new Set<number>();

export async function POST(req: NextRequest) {
  // validar secret token
  const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // validar tamaño de la peticion
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  try {
    const body = await req.json();
    
    // deduplicacion para evitar procesar lo mismo dos veces
    if (body.update_id && processedUpdates.has(body.update_id)) {
      return NextResponse.json({ ok: true });
    }
    if (body.update_id) processedUpdates.add(body.update_id);

    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    // sanitizar y limitar longitud del texto
    const leadText = message.text
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
      .slice(0, MAX_TEXT_LENGTH)
      .trim();

    // rate limit por usuario
    const now = Date.now();
    const userRate = rateLimitMap.get(chatId);
    if (!userRate || userRate.reset < now) {
      rateLimitMap.set(chatId, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    } else {
      if (userRate.count >= MAX_MESSAGES_PER_WINDOW) {
        console.warn(`rate limit excedido para ${chatId}`);
        return NextResponse.json({ ok: true });
      }
      userRate.count++;
    }

    // comando start
    if (leadText === '/start') {
      await sendTelegramMessage(chatId, 'Hola. Soy tu asistente de calificacion de leads. Enviame los datos de una empresa y la evaluare.');
      return NextResponse.json({ ok: true });
    }

    // calificar con openai
    let evaluation;
    try {
      evaluation = await qualifyLead(leadText);
    } catch (llmError) {
      console.error('error en openai:', llmError);
      await sendTelegramMessage(chatId, 'Lo siento, tuve un problema al procesar tu solicitud. Intentalo mas tarde.');
      return NextResponse.json({ ok: true });
    }

    // guardar en google sheets
    try {
      const date = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
      await appendToSheet({
        date,
        leadData: leadText,
        decision: evaluation.qualified ? 'Cualificado' : 'No cualificado',
        reason: evaluation.reason,
      });
    } catch (sheetError) {
      console.error('error al guardar en sheets:', sheetError);
      // continuamos para responder al usuario aunque falle el log
    }

    // responder a telegram
    const responseText = `Decision: ${evaluation.qualified ? 'CUALIFICADO' : 'NO CUALIFICADO'}\n\nRazonamiento: ${evaluation.reason}`;
    
    await sendTelegramMessage(chatId, responseText);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('error webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
