import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from './connection'
import Log from "webrtsp/helpers/Log"
import { FormatTag } from "webrtsp/helpers/Helpers"
import { Method, Options, URI2Description } from 'webrtsp/Types'

const TAG = FormatTag("Streamers Store")

interface StreamerInfo {
  description: string
  options: Options
}

export const useStreamersStore = defineStore('streamers', () => {
  const fetching = ref(false)
  const rootStreamers = ref(new Map<string, StreamerInfo>)

  const connection = useConnectionStore()
  const client = connection.client
  watch(() => connection.connected, (connected) => {
    if(connected) {
      fetchStreamers()
    }
  })

  async function fetchStreamers() {
    fetching.value = true
    rootStreamers.value.clear()

    try {
      let rootOptions: Options
      try {
        rootOptions = await client.OPTIONS("*")
      } catch(e: unknown) {
        if(e instanceof Error) {
          Log.error(TAG, "Failed to get OPTIONS", e.message)
        } else {
          Log.error(TAG, "Failed to get OPTIONS", e)
        }

        return
      }

      if(!rootOptions.has(Method.LIST)) {
        return
      }

      let list: URI2Description
      try {
        list =  await client.LIST("*")
      } catch(e: unknown) {
        if(e instanceof Error) {
          Log.error(TAG, "Failed to get OPTIONS", e.message)
        } else {
          Log.error(TAG, "Failed to get OPTIONS", e)
        }

        return
      }

      const streamers = new Map<string, StreamerInfo>
      for(const [uri, description] of list) {
        try {
          const options = await client.OPTIONS(uri)
          if(!options.has(Method.LIST)) {
            streamers.set(uri, { description, options })
          }
        } catch(e: unknown) {
          if(e instanceof Error) {
            Log.error(TAG, `Failed to get OPTIONS for "${uri}":`, e.message)
          } else {
            Log.error(TAG, `Failed to get OPTIONS for "${uri}":`, e)
          }
        }
      }
      rootStreamers.value = streamers
    } finally {
      fetching.value = false
    }
  }

  return { fetching }
})
