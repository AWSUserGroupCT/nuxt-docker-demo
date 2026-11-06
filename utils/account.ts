// The one made-up borrower every page uses. There are no real accounts.
export const demoAccount = {
  name: 'Jordan Rivera',
  accountNumber: 'NB-4471-2093',
  balance: 28412.37,
  ratePct: 5.5,
  monthlyDue: 325.41,
  autopayDiscountPct: 0.25,
  plan: 'Standard (10-year)',
  bankAccounts: [
    { id: 'chk', label: 'Everyday Checking', last4: '4821' },
    { id: 'sav', label: 'High-Yield Savings', last4: '0937' },
  ],
}

// The 15th of the current month, or of next month once that has passed.
export function nextDueDate(from = new Date()) {
  const due = new Date(from.getFullYear(), from.getMonth(), 15)
  if (from.getDate() > 15) due.setMonth(due.getMonth() + 1)
  return due
}

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const fmtDate = (d: Date | string) =>
  new Date(typeof d === 'string' ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

// ABA routing numbers carry a weighted checksum (3-7-1 repeating).
export function validRouting(n: string) {
  if (!/^\d{9}$/.test(n)) return false
  const d = n.split('').map(Number)
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])
  return sum % 10 === 0
}
