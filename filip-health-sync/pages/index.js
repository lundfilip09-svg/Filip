import { Sleep } from '@zos/sensor'
import { MessageBuilder } from '../shared/message'

const messageBuilder = new MessageBuilder()

Page({
  build() {
    const sleep = new Sleep()
    const sleepInfo = sleep.getInfo()

    // Ingen søvndata tilgjengelig for denne dagen — avbryt stille
    if (!sleepInfo || !sleepInfo.score) {
      console.log('Ingen søvndata funnet, avbryter sending')
      return
    }

    const { score, deepMin, startTime, endTime } = sleepInfo
    const totalTime = sleep.getTotalTime() ?? 0

    const payload = {
      sleepScore: score,
      sleepMinutes: totalTime,
      sleepHours: +(totalTime / 60).toFixed(2),
      deepSleepMin: deepMin ?? 0,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      date: new Date().toISOString().slice(0, 10)
    }

    console.log('Sender søvndata:', JSON.stringify(payload))

    messageBuilder.request({ payload })
      .then(res => {
        console.log('Sendt OK:', JSON.stringify(res))
      })
      .catch(err => {
        console.log('Feil ved sending:', err.message ?? err)
      })
  }
})