import os from 'node:os'
import { randomBytes } from 'node:crypto'
import { demoAccount, toISODate, validRouting } from '../../utils/account'
import { addMonths } from '../../utils/loan'

// Validates a demo payment and "schedules" it. Nothing is stored or charged.
// The response says which container handled it, to show any replica can take writes.

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    amount?: number
    date?: string
    source?: { type: 'saved'; id: string } | { type: 'new'; routing: string; account: string }
    autopay?: boolean
  }>(event)

  const errors: Record<string, string> = {}
  const amount = Number(body?.amount)
  if (!Number.isFinite(amount) || amount < 1) errors.amount = 'Enter an amount of at least $1.00.'
  else if (amount > demoAccount.balance) errors.amount = 'Amount is more than your balance.'

  const today = toISODate(new Date())
  const latest = toISODate(addMonths(new Date(), 2))
  if (!body?.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) errors.date = 'Choose a payment date.'
  else if (body.date < today || body.date > latest) errors.date = 'Date must be within the next 60 days.'

  const src = body?.source
  let paidFrom = ''
  if (src?.type === 'saved') {
    const acct = demoAccount.bankAccounts.find((a) => a.id === src.id)
    if (!acct) errors.source = 'Choose a bank account.'
    else paidFrom = `${acct.label} ••••${acct.last4}`
  } else if (src?.type === 'new') {
    if (!validRouting(src.routing ?? '')) errors.routing = 'That routing number isn’t valid.'
    if (!/^\d{4,17}$/.test(src.account ?? '')) errors.account = 'Account numbers are 4–17 digits.'
    paidFrom = `Bank account ••••${(src.account ?? '').slice(-4)}`
  } else {
    errors.source = 'Choose a bank account.'
  }

  if (Object.keys(errors).length) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid payment', data: { errors } })
  }

  return {
    confirmation: `PMT-${randomBytes(4).toString('hex').toUpperCase()}`,
    amount: Math.round(amount * 100) / 100,
    date: body.date,
    paidFrom,
    autopay: Boolean(body.autopay),
    processedBy: os.hostname(),
    processedAt: new Date().toISOString(),
  }
})
