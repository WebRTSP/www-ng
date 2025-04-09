// import { ref } from 'vue'
import { defineStore } from 'pinia'
import { WebRTSP } from 'webrtsp/WebRTSPClient.ts'

declare const WebRTSPPort: number

export const useConnectionStore = defineStore('connection', () => {
  const protocol = window.location.protocol === 'http:' ?  "ws" : "wss"
  const url = `${protocol}://${window.location.hostname}:${WebRTSPPort}/`

  const client = new WebRTSP.Client(url)
  client.connect()

  return { client }
})
