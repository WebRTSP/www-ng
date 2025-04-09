import { ref } from 'vue'
import { defineStore } from 'pinia'


export const useStreamersStore = defineStore('streamers', () => {
  const streamers = ref<Map<string, string>>()

  return { streamers }
})
