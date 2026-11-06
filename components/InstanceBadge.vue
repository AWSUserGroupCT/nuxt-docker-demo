<script setup lang="ts">
const { data, refresh, pending } = await useFetch('/api/instance', { key: 'instance' })
const history = ref<{ hostname: string; color: string }[]>([])

async function hitTen() {
  const results = await Promise.all(
    Array.from({ length: 10 }, () => $fetch<{ hostname: string; color: string }>('/api/instance')),
  )
  history.value = results
}
</script>

<template>
  <div v-if="data" class="badge" :style="{ borderColor: data.color }">
    <div class="badge-head">
      <span class="dot" :style="{ background: data.color }" />
      Served by container <code>{{ data.hostname }}</code>
    </div>
    <dl>
      <dt>Version</dt><dd>{{ data.version }}</dd>
      <dt>Uptime</dt><dd>{{ data.uptimeSeconds }}s</dd>
      <dt>Requests</dt><dd>{{ data.requestsServed }}</dd>
      <dt>Node</dt><dd>{{ data.node }}</dd>
    </dl>
    <div class="badge-actions">
      <button :disabled="pending" @click="refresh()">Ask again</button>
      <button @click="hitTen">Send 10 requests</button>
    </div>
    <ul v-if="history.length" class="history">
      <li v-for="(h, i) in history" :key="i" :style="{ background: h.color }" :title="h.hostname">
        {{ h.hostname.slice(0, 6) }}
      </li>
    </ul>
  </div>
</template>
