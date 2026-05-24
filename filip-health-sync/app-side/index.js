import { MessageBuilder } from '../shared/message'

const messageBuilder = new MessageBuilder()

messageBuilder.on('request', (ctx) => {
  const payload = ctx.request.payload

  fetch('https://filip-vita.vercel.app/api/zepp-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(() => ctx.response({ data: { ok: true } }))
  .catch(err => ctx.response({ data: { ok: false, error: err.message } }))
})