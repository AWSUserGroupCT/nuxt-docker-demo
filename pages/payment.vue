<script setup lang="ts">
useHead({ title: 'Make a payment — Northbridge' })

type Result = { confirmation: string; amount: number; date: string; paidFrom: string; autopay: boolean; processedBy: string }

const acct = demoAccount
const due = nextDueDate()
const today = toISODate(new Date())
const latest = toISODate(addMonths(new Date(), 2))

const step = ref<'details' | 'review' | 'done'>('details')
const amountChoice = ref<'due' | 'payoff' | 'other'>('due')
const otherAmount = ref<number | null>(null)
const date = ref(toISODate(due) <= latest ? toISODate(due) : today)
const sourceId = ref<string>(acct.bankAccounts[0].id)
const routing = ref('')
const accountNo = ref('')
const autopay = ref(false)
const touched = ref(false)
const submitting = ref(false)
const serverErrors = ref<Record<string, string>>({})
const result = ref<Result | null>(null)

const amount = computed(() =>
  amountChoice.value === 'due' ? acct.monthlyDue : amountChoice.value === 'payoff' ? acct.balance : Number(otherAmount.value) || 0,
)

const errors = computed(() => {
  const e: Record<string, string> = {}
  if (amount.value < 1) e.amount = 'Enter an amount of at least $1.00.'
  else if (amount.value > acct.balance) e.amount = `You can pay up to your balance of ${fmtUSD(acct.balance)}.`
  if (!date.value || date.value < today || date.value > latest) e.date = 'Choose a date within the next 60 days.'
  if (sourceId.value === 'new') {
    if (!validRouting(routing.value)) e.routing = 'That routing number isn’t valid. It’s the 9 digits at the bottom left of a check.'
    if (!/^\d{4,17}$/.test(accountNo.value)) e.account = 'Account numbers are 4–17 digits.'
  }
  return { ...e, ...serverErrors.value }
})
const showErr = (k: string) => touched.value && errors.value[k]

// What paying above the amount due does: the extra goes straight to principal.
const extra = computed(() => Math.max(amount.value - acct.monthlyDue, 0))
const impact = computed(() => {
  if (extra.value <= 0 || amount.value >= acct.balance) return null
  const run = (b: number) => simulate(b, acct.ratePct, 600, () => acct.monthlyDue)
  const base = run(acct.balance - acct.monthlyDue)
  const withExtra = run(acct.balance - amount.value)
  return { interest: base.totalInterest - withExtra.totalInterest, months: base.months - withExtra.months }
})

const newRate = computed(() => acct.ratePct - (autopay.value ? acct.autopayDiscountPct : 0))
const late = computed(() => date.value > toISODate(due))

const paidFromLabel = computed(() => {
  if (sourceId.value === 'new') return `Bank account ••••${accountNo.value.slice(-4)}`
  const a = acct.bankAccounts.find((b) => b.id === sourceId.value)!
  return `${a.label} ••••${a.last4}`
})

function toReview() {
  touched.value = true
  serverErrors.value = {}
  if (Object.keys(errors.value).length === 0) step.value = 'review'
}

async function submit() {
  submitting.value = true
  try {
    result.value = await $fetch<Result>('/api/payments', {
      method: 'POST',
      body: {
        amount: amount.value,
        date: date.value,
        autopay: autopay.value,
        source: sourceId.value === 'new'
          ? { type: 'new', routing: routing.value, account: accountNo.value }
          : { type: 'saved', id: sourceId.value },
      },
    })
    step.value = 'done'
  } catch (err: any) {
    serverErrors.value = err?.data?.data?.errors ?? { form: 'Something went wrong. Please try again.' }
    step.value = 'details'
  } finally {
    submitting.value = false
  }
}

function startOver() {
  step.value = 'details'
  touched.value = false
  result.value = null
  amountChoice.value = 'due'
  otherAmount.value = null
}
</script>

<template>
  <section class="page-head">
    <div class="wrap">
      <h1>Make a payment</h1>
      <p>Pay your monthly amount, pay extra toward principal, or pay off your loan.</p>
    </div>
  </section>

  <div class="wrap page layout-aside">
    <div>
      <ol class="stepper">
        <li :class="{ active: step === 'details', done: step !== 'details' }">Payment details</li>
        <li :class="{ active: step === 'review', done: step === 'done' }">Review</li>
        <li :class="{ active: step === 'done' }">Confirmation</li>
      </ol>

      <!-- Step 1 -->
      <form v-if="step === 'details'" class="panel form" novalidate @submit.prevent="toReview">
        <p v-if="serverErrors.form" class="err">{{ serverErrors.form }}</p>

        <fieldset>
          <legend>How much?</legend>
          <label class="choice" :class="{ on: amountChoice === 'due' }">
            <input v-model="amountChoice" type="radio" value="due" />
            <span><b>Amount due</b><small>Due {{ fmtDate(due) }}</small></span>
            <strong>{{ fmtUSD(acct.monthlyDue) }}</strong>
          </label>
          <label class="choice" :class="{ on: amountChoice === 'other' }">
            <input v-model="amountChoice" type="radio" value="other" />
            <span><b>Other amount</b><small>Anything above the amount due goes to principal</small></span>
            <span class="money-input" @click="amountChoice = 'other'">
              $<input v-model.number="otherAmount" type="number" min="1" step="0.01" placeholder="0.00" aria-label="Other amount" @focus="amountChoice = 'other'" />
            </span>
          </label>
          <label class="choice" :class="{ on: amountChoice === 'payoff' }">
            <input v-model="amountChoice" type="radio" value="payoff" />
            <span><b>Pay off my loan</b><small>Current balance, before interest since your last statement</small></span>
            <strong>{{ fmtUSD(acct.balance) }}</strong>
          </label>
          <p v-if="showErr('amount')" class="err">{{ errors.amount }}</p>
          <p v-if="impact" class="tip">
            Paying {{ fmtUSD(extra) }} extra could save about <b>{{ fmtUSD(impact.interest) }}</b> in interest
            and finish your loan <b>{{ fmtMonths(impact.months) }}</b> sooner.
          </p>
        </fieldset>

        <fieldset>
          <legend>When?</legend>
          <label class="field">
            Payment date
            <input v-model="date" type="date" :min="today" :max="latest" />
          </label>
          <p v-if="showErr('date')" class="err">{{ errors.date }}</p>
          <p v-else-if="late" class="warn">This date is after your due date ({{ fmtDate(due) }}). A late payment may add a fee.</p>
        </fieldset>

        <fieldset>
          <legend>Pay from</legend>
          <label v-for="b in acct.bankAccounts" :key="b.id" class="choice" :class="{ on: sourceId === b.id }">
            <input v-model="sourceId" type="radio" :value="b.id" />
            <span><b>{{ b.label }}</b><small>••••{{ b.last4 }}</small></span>
          </label>
          <label class="choice" :class="{ on: sourceId === 'new' }">
            <input v-model="sourceId" type="radio" value="new" />
            <span><b>Use a different bank account</b><small>Try routing number 011000015</small></span>
          </label>
          <div v-if="sourceId === 'new'" class="field-row">
            <label class="field">
              Routing number
              <input v-model.trim="routing" inputmode="numeric" maxlength="9" placeholder="9 digits" />
              <small v-if="routing.length === 9" :class="validRouting(routing) ? 'ok' : 'err'">
                {{ validRouting(routing) ? '✓ Valid routing number' : '✗ Checksum doesn’t match' }}
              </small>
            </label>
            <label class="field">
              Account number
              <input v-model.trim="accountNo" inputmode="numeric" maxlength="17" />
            </label>
          </div>
          <p v-if="showErr('routing')" class="err">{{ errors.routing }}</p>
          <p v-if="showErr('account')" class="err">{{ errors.account }}</p>
        </fieldset>

        <label class="toggle">
          <input v-model="autopay" type="checkbox" />
          <span>
            <b>Turn on autopay</b> and get {{ acct.autopayDiscountPct }}% off your interest rate
            <small v-if="autopay">Your rate would go from {{ acct.ratePct }}% to {{ newRate.toFixed(2) }}%.</small>
          </span>
        </label>

        <div class="actions">
          <button class="btn primary" type="submit">Review payment</button>
        </div>
      </form>

      <!-- Step 2 -->
      <div v-else-if="step === 'review'" class="panel">
        <h2>Review your payment</h2>
        <dl class="summary">
          <dt>Amount</dt><dd class="big">{{ fmtUSD(amount) }}</dd>
          <dt>Date</dt><dd>{{ fmtDate(date) }}</dd>
          <dt>From</dt><dd>{{ paidFromLabel }}</dd>
          <dt>Autopay</dt><dd>{{ autopay ? `On (rate ${newRate.toFixed(2)}%)` : 'Off' }}</dd>
          <dt>Balance after</dt><dd>{{ fmtUSD(acct.balance - amount) }}</dd>
        </dl>
        <p class="muted">By selecting Submit, you authorize Northbridge to debit this account. (Demo only: nothing is charged.)</p>
        <div class="actions">
          <button class="btn" type="button" @click="step = 'details'">Edit</button>
          <button class="btn primary" type="button" :disabled="submitting" @click="submit">
            {{ submitting ? 'Submitting…' : 'Submit payment' }}
          </button>
        </div>
      </div>

      <!-- Step 3 -->
      <div v-else-if="result" class="panel success">
        <div class="success-icon">✓</div>
        <h2>Payment scheduled</h2>
        <p>Confirmation number <code>{{ result.confirmation }}</code></p>
        <dl class="summary">
          <dt>Amount</dt><dd class="big">{{ fmtUSD(result.amount) }}</dd>
          <dt>Date</dt><dd>{{ fmtDate(result.date) }}</dd>
          <dt>From</dt><dd>{{ result.paidFrom }}</dd>
          <dt>Autopay</dt><dd>{{ result.autopay ? 'On' : 'Off' }}</dd>
        </dl>
        <p class="host-chip">Processed by container <code>{{ result.processedBy }}</code></p>
        <div class="actions">
          <button class="btn" type="button" @click="startOver">Make another payment</button>
          <NuxtLink to="/" class="btn primary">Back to home</NuxtLink>
        </div>
      </div>
    </div>

    <aside class="panel account">
      <h3>Your account</h3>
      <p class="muted">{{ acct.name }} · {{ acct.accountNumber }}</p>
      <dl class="summary">
        <dt>Current balance</dt><dd>{{ fmtUSD(acct.balance) }}</dd>
        <dt>Amount due</dt><dd>{{ fmtUSD(acct.monthlyDue) }}</dd>
        <dt>Due date</dt><dd>{{ fmtDate(due) }}</dd>
        <dt>Interest rate</dt><dd>{{ acct.ratePct }}%</dd>
        <dt>Plan</dt><dd>{{ acct.plan }}</dd>
      </dl>
      <NuxtLink to="/plans" class="more">Compare repayment plans →</NuxtLink>
      <NuxtLink to="/payment-trouble" class="more">Can’t make this payment? →</NuxtLink>
    </aside>
  </div>
</template>
