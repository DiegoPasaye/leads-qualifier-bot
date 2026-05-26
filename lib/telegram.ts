const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: number, text: string) {
  // peticion post a telegram para enviar mensaje
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('error al enviar telegram:', error);
    throw new Error('error telegram');
  }

  return response.json();
}
