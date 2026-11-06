import os from 'node:os'
import { randomBytes } from 'node:crypto'

// Accepts a demo contact request and returns a ticket number. Nothing is stored or sent.

const topics = ['payment', 'plans', 'trouble', 'account', 'other'] as const

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; email?: string; topic?: string; method?: string; message?: string }>(event)

  const errors: Record<string, string> = {}
  if (!body?.name?.trim()) errors.name = 'Enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body?.email ?? '')) errors.email = 'Enter a valid email address.'
  if (!topics.includes(body?.topic as (typeof topics)[number])) errors.topic = 'Choose a topic.'
  const len = body?.message?.trim().length ?? 0
  if (len < 10) errors.message = 'Tell us a little more (at least 10 characters).'
  else if (len > 1000) errors.message = 'Keep it under 1,000 characters.'

  if (Object.keys(errors).length) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid request', data: { errors } })
  }

  return {
    ticket: `NB-${randomBytes(3).toString('hex').toUpperCase()}`,
    replyWithin: body!.topic === 'trouble' ? '1 business day' : '2 business days',
    method: body!.method === 'phone' ? 'phone' : 'email',
    processedBy: os.hostname(),
  }
})
