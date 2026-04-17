async function sendTelegramAlert(deviceId) {
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
  const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🚨 *Συναγερμός!*\nΗ πόρτα *${deviceId}* είναι ανοιχτή για πάνω από 5 λεπτά!`,
      parse_mode: 'Markdown'
    })
  });

  return await result.json();
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { deviceId, time } = body

    console.log('Received:', deviceId, time);

    const response = await fetch("https://maincloud.spacetimedb.com/v1/database/alarm/call/add_device_log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SPACETIMEDB_TOKEN}`
      },
      body: JSON.stringify([deviceId, Number(time)])
    })

    if (response.ok) {
      const tgResult = await sendTelegramAlert(deviceId);
      console.log('Telegram response:', JSON.stringify(tgResult));
      res.status(200).json({ status: 'ok', telegram: tgResult })
    } else {
      const err = await response.text()
      console.log('DB error:', err);
      res.status(500).json({ error: err })
    }
  }
}