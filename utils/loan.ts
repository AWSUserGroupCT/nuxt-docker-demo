// Loan math shared by the payment, estimator, plans, and payment-trouble pages.
// Everything here is an estimate for a demo, not real servicing rules.

export const fmtUSD = (v: number, digits = 2) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits })

export const fmtMonths = (months: number) => {
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y && `${y} yr`, m && `${m} mo`].filter(Boolean).join(' ') || '0 mo'
}

// Fixed monthly payment that pays off `balance` in `months`.
export function amortizedPayment(balance: number, ratePct: number, months: number) {
  const r = ratePct / 100 / 12
  if (months <= 0) return 0
  if (r === 0) return balance / months
  return (balance * r) / (1 - Math.pow(1 + r, -months))
}

export interface Schedule {
  months: number
  totalPaid: number
  totalInterest: number
  firstPayment: number
  lastPayment: number
  // Remaining balance at the end of each year (index 0 = start).
  yearlyBalance: number[]
  forgiven: number
}

// Runs a month-by-month simulation. `paymentFor(month, balance)` returns the
// scheduled payment for that month (1-based). Stops at payoff or `maxMonths`;
// anything left at `maxMonths` counts as forgiven.
export function simulate(
  balance: number,
  ratePct: number,
  maxMonths: number,
  paymentFor: (month: number, balance: number) => number,
): Schedule {
  const r = ratePct / 100 / 12
  let b = balance
  let totalPaid = 0
  let firstPayment = 0
  let lastPayment = 0
  let month = 0
  const yearlyBalance = [balance]
  while (b > 0.005 && month < maxMonths) {
    month++
    const interest = b * r
    const pay = Math.min(paymentFor(month, b), b + interest)
    b = b + interest - pay
    totalPaid += pay
    if (month === 1) firstPayment = pay
    lastPayment = pay
    if (month % 12 === 0) yearlyBalance.push(Math.max(b, 0))
  }
  if (month % 12 !== 0) yearlyBalance.push(Math.max(b, 0))
  return {
    months: month,
    totalPaid,
    totalInterest: totalPaid - balance + Math.max(b, 0),
    firstPayment,
    lastPayment,
    yearlyBalance,
    forgiven: Math.max(b, 0),
  }
}

export function standardPlan(balance: number, ratePct: number, years = 10, extra = 0) {
  const base = amortizedPayment(balance, ratePct, years * 12)
  return simulate(balance, ratePct, years * 12, () => base + extra)
}

// Payments start low and rise every 2 years, paid off in 10 years.
export function graduatedPlan(balance: number, ratePct: number) {
  const step = 1.15
  const run = (start: number) =>
    simulate(balance, ratePct, 120, (m) => start * Math.pow(step, Math.floor((m - 1) / 24)))
  // Binary-search the starting payment that lands on payoff at month 120.
  let lo = 0
  let hi = amortizedPayment(balance, ratePct, 120)
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (run(mid).forgiven > 0.01) lo = mid
    else hi = mid
  }
  return run(hi)
}

// 2025 HHS poverty guideline, contiguous US.
export const povertyLine = (familySize: number) => 15650 + 5500 * Math.max(familySize - 1, 0)

// Income-driven: 10% of income above 150% of the poverty line, never more than
// the 10-year standard payment, with the remainder forgiven after 20 years.
// Assumes income grows 3% a year.
export function incomeDrivenPlan(balance: number, ratePct: number, income: number, familySize: number) {
  const cap = amortizedPayment(balance, ratePct, 120)
  return simulate(balance, ratePct, 240, (m) => {
    const yearIncome = income * Math.pow(1.03, Math.floor((m - 1) / 12))
    const discretionary = Math.max(yearIncome - 1.5 * povertyLine(familySize), 0)
    return Math.min((discretionary * 0.1) / 12, cap)
  })
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}
