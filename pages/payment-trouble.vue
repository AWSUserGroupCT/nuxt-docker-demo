<script setup lang="ts">
useHead({ title: 'Payment trouble — Northbridge' })

type Answers = { reason?: string; duration?: string; behind?: string }

const questions = [
  {
    key: 'reason', title: 'What’s making it hard to pay?',
    options: [
      { v: 'income', label: 'I lost my job or my income dropped' },
      { v: 'high', label: 'My payment is just too high' },
      { v: 'hardship', label: 'Medical bills or another hardship' },
      { v: 'school', label: 'I’m going back to school' },
      { v: 'military', label: 'I’m on active military duty' },
      { v: 'date', label: 'My due date doesn’t line up with payday' },
    ],
  },
  {
    key: 'duration', title: 'How long do you expect this to last?',
    options: [
      { v: 'short', label: 'Less than 3 months' },
      { v: 'medium', label: '3 to 12 months' },
      { v: 'long', label: 'Longer, or I’m not sure' },
    ],
  },
  {
    key: 'behind', title: 'Are you behind on payments right now?',
    options: [
      { v: 'no', label: 'No, I’m up to date' },
      { v: 'one', label: 'I’ve missed one payment' },
      { v: 'more', label: 'I’ve missed two or more' },
    ],
  },
] as const

const step = ref(0)
const answers = reactive<Answers>({})
const done = computed(() => step.value >= questions.length)

function pick(key: keyof Answers, v: string) {
  answers[key] = v
  step.value++
}
function restart() {
  Object.assign(answers, { reason: undefined, duration: undefined, behind: undefined })
  step.value = 0
}

const options = [
  {
    id: 'idr', title: 'Switch to an income-driven plan',
    body: 'Your payment is based on your income and family size. It can be as low as $0 a month.',
    cta: { label: 'Compare plans', to: '/plans' },
    score: (a: Answers) => (a.reason === 'income' ? 3 : 0) + (a.reason === 'high' ? 3 : 0) + (a.reason === 'hardship' ? 1 : 0) + (a.duration === 'long' ? 2 : 0),
  },
  {
    id: 'deferment', title: 'Ask for a deferment',
    body: 'Pause payments while you’re unemployed, in school, or on active duty. Some loans don’t charge interest during a deferment.',
    cta: { label: 'Request a deferment', to: '/contact?topic=trouble' },
    score: (a: Answers) => (a.reason === 'school' || a.reason === 'military' ? 5 : 0) + (a.reason === 'income' ? 2 : 0) + (a.duration !== 'long' ? 1 : 0),
  },
  {
    id: 'forbearance', title: 'Ask for a forbearance',
    body: 'A short break from payments, usually up to 12 months at a time. Interest keeps building while payments are paused.',
    cta: { label: 'Request a forbearance', to: '/contact?topic=trouble' },
    score: (a: Answers) => (a.reason === 'hardship' ? 3 : 0) + (a.reason === 'income' ? 2 : 0) + (a.duration === 'short' ? 2 : a.duration === 'medium' ? 1 : -1),
  },
  {
    id: 'extend', title: 'Spread payments over a longer time',
    body: 'The extended or graduated plans lower your monthly payment. You pay more interest overall.',
    cta: { label: 'See the numbers', to: '/plans' },
    score: (a: Answers) => (a.reason === 'high' ? 2 : 0) + (a.duration === 'long' ? 1 : 0),
  },
  {
    id: 'duedate', title: 'Change your due date',
    body: 'Move your due date to any day from the 1st to the 28th so it falls right after payday.',
    cta: { label: 'Ask to change it', to: '/contact?topic=account' },
    score: (a: Answers) => (a.reason === 'date' ? 6 : 0),
  },
  {
    id: 'catchup', title: 'Catch up on missed payments',
    body: 'Pay what’s past due, or ask us to set up a plan to catch up over a few months.',
    cta: { label: 'Make a payment', to: '/payment' },
    score: (a: Answers) => (a.behind === 'one' ? 3 : a.behind === 'more' ? 4 : 0),
  },
]

const ranked = computed(() =>
  options
    .map((o) => ({ ...o, s: o.score(answers) }))
    .filter((o) => o.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3),
)

// ---- What a pause costs ----
const pauseMonths = ref(6)
const acct = demoAccount
const remainingMonths = simulate(acct.balance, acct.ratePct, 600, () => acct.monthlyDue).months
const accrued = computed(() => acct.balance * (acct.ratePct / 100 / 12) * pauseMonths.value)
const paymentAfter = computed(() => amortizedPayment(acct.balance + accrued.value, acct.ratePct, remainingMonths))
</script>

<template>
  <section class="page-head">
    <div class="wrap">
      <h1>Having trouble making payments?</h1>
      <p>Answer three quick questions and we’ll show the options that fit your situation.</p>
    </div>
  </section>

  <div class="wrap page layout-aside">
    <div>
      <div v-if="!done" class="panel quiz">
        <div class="progress" :aria-label="`Question ${step + 1} of ${questions.length}`">
          <span :style="{ width: `${(step / questions.length) * 100}%` }" />
        </div>
        <p class="muted">Question {{ step + 1 }} of {{ questions.length }}</p>
        <Transition name="fade" mode="out-in">
          <div :key="step">
            <h2>{{ questions[step].title }}</h2>
            <div class="quiz-options">
              <button
                v-for="o in questions[step].options"
                :key="o.v"
                type="button"
                class="quiz-option"
                :class="{ on: answers[questions[step].key] === o.v }"
                @click="pick(questions[step].key, o.v)"
              >
                {{ o.label }}
              </button>
            </div>
          </div>
        </Transition>
        <button v-if="step > 0" type="button" class="link-btn" @click="step--">← Back</button>
      </div>

      <div v-else>
        <div v-if="answers.behind === 'more'" class="alert">
          <b>Call us soon: 1-800-555-0100.</b> When you’re two or more payments behind, talking to us now can keep your
          loan from going into default.
        </div>
        <h2 class="results-title">Your best options</h2>
        <TransitionGroup name="list" tag="div" class="option-list" appear>
          <article v-for="(o, i) in ranked" :key="o.id" class="card option">
            <span v-if="i === 0" class="tag">Best match</span>
            <h3>{{ o.title }}</h3>
            <p>{{ o.body }}</p>
            <NuxtLink :to="o.cta.to" class="more">{{ o.cta.label }} →</NuxtLink>
          </article>
        </TransitionGroup>
        <button type="button" class="btn" @click="restart">Start over</button>
      </div>
    </div>

    <aside class="panel">
      <h3>What does pausing payments cost?</h3>
      <p class="muted">Interest keeps building during a forbearance. At the end, it’s added to your balance.</p>
      <label class="slider">
        <span>Pause for <output>{{ pauseMonths }} month{{ pauseMonths === 1 ? '' : 's' }}</output></span>
        <input v-model.number="pauseMonths" type="range" min="1" max="12" />
      </label>
      <dl class="summary">
        <dt>Interest added</dt><dd>{{ fmtUSD(accrued) }}</dd>
        <dt>New balance</dt><dd>{{ fmtUSD(acct.balance + accrued) }}</dd>
        <dt>Payment now</dt><dd>{{ fmtUSD(acct.monthlyDue) }}</dd>
        <dt>Payment after</dt><dd>{{ fmtUSD(paymentAfter) }}</dd>
      </dl>
      <p class="muted fine">Based on the demo account: {{ fmtUSD(acct.balance) }} at {{ acct.ratePct }}%.</p>
    </aside>
  </div>
</template>
