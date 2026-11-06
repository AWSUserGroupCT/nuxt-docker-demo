import os from 'node:os'

// Module-level state lives per container, which is what makes scaling visible.
const startedAt = new Date()
let requests = 0

export default defineEventHandler((event) => {
  requests++
  setHeader(event, 'Cache-Control', 'no-store')
  const hostname = os.hostname()
  // Stable color per container so replicas are easy to tell apart on screen.
  let hash = 0
  for (const ch of hostname) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return {
    hostname,
    color: `hsl(${hash % 360} 70% 45%)`,
    pid: process.pid,
    node: process.version,
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    requestsServed: requests,
    version: process.env.APP_VERSION ?? 'dev',
  }
})
