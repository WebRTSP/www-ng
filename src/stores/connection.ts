import { ref, markRaw } from 'vue'
import { defineStore } from 'pinia'
// import Log from "webrtsp/helpers/Log"
// import { FormatTag } from "webrtsp/helpers/Helpers"
import { WebRTSP } from 'webrtsp/WebRTSPClient.ts'


// const TAG = FormatTag("Connection Store")

declare const WebRTSPPort: number

export const useConnectionStore = defineStore('connection', () => {
  const protocol = window.location.protocol === 'http:' ?  "ws" : "wss"
  const url = `${protocol}://${window.location.hostname}:${WebRTSPPort}/`

  const connected = ref(false)

  const client = new WebRTSP.Client(url)
  client.onConnected = () => { connected.value = true }
  client.onDisconnected = () => { connected.value = false }
  client.connect()

  return { client: markRaw(client), connected }
})
