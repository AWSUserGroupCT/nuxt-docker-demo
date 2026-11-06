<script setup lang="ts">
useHead({ title: 'Compare plans — Northbridge' })

const balance = ref(demoAccount.balance)
const rate = ref(demoAccount.ratePct)
const income = ref(52000)
const family = ref(1)
const sortBy = ref<'first' | 'total'>('first')
const selected = ref<string | null>(null)

const plans = computed(() => {
  const b = Math.max(balance.value || 0, 0)
  const r = Math.max(rate.value || 0, 0)
  return [
    {
      id: 'standard', name: 'Standard', term: '10 years',
      blurb: 'The same payment every month. Usually the least interest of any fixed plan.',
      s: standardPlan(b, r, 10),
    },
    {
      id: 'graduated', name: 'Graduated', term: '10 years',
      blurb: 'Starts lower and goes up every 2 years. Good if you expect your income to grow.',
      s: graduatedPlan(b, r),
    },
    {
      id: 'extended', name: 'Extended', term: '25 years',
      blurb: 'Smaller fixed payments over a longer time. You pay much more interest overall.',
      s: standardPlan(b, r, 25),
    },
    {
      id: 'income', name: 'Income-driven', term: 'Up to 20 years',
      blurb: '10% of your income above 150% of the poverty line. Any balance left after 20 years is forgiven.',
      s: incomeDrivenPlan(b, r, Math.max(income.value || 0, 0), family.value),
    },
  ]
})

const yourCost = (p: (typeof plans.value)[number]) => p.s.totalPaid
const sorted = computed(() =>
  [...plans.value].sort((a, b) => (sortBy.value === 'first' ? a.s.firstPayment - b.s.firstPayment : yourCost(a) - yourCost(b))),
)
const lowestFirst = computed(() => Math.min(...plans.value.map((p) => p.s.firstPayment)))
const lowestTotal = computed(() => Math.min(...plans.value.map(yourCost)))
const maxTotal = computed(() => Math.max(...plans.value.map(yourCost), 1))
const selectedPlan = computed(() => plans.value.find((p) => p.id === selected.value))
</script>

<template>
  <section class="page-head">
    <div class="wrap">
      <h1>Compare repayment plans</h1>
      <p>Change the numbers to see how each plan affects your monthly payment and total cost.</p>
    </div>
  </section>

  <div class="wrap page">
    <div class="panel inputs-row">
      <label class="field">Loan balance <input v-model.number="balance" type="number" min="0" step="500" /></label>
      <label class="field">Interest rate (%) <input v-model.number="rate" type="number" min="0" max="15" step="0.1" /></label>
      <label class="field">Annual income <input v-model.number="income" type="number" min="0" step="1000" /></label>
      <label class="field">Family size
        <select v-model.number="family"><option v-for="n in 6" :key="n" :value="n">{{ n }}</option></select>
      </label>
    </div>

    <div class="sort-bar">
      <span>Sort by</span>
      <div class="seg" role="group" aria-label="Sort plans">
        <button type="button" :class="{ on: sortBy === 'first' }" @click="sortBy = 'first'">Lowest monthly payment</button>
        <button type="button" :class="{ on: sortBy === 'total' }" @click="sortBy = 'total'">Lowest total cost</button>
      </div>
    </div>

    <TransitionGroup name="list" tag="div" class="plan-list">
      <article
        v-for="p in sorted"
        :key="p.id"
        class="plan"
        :class="{ on: selected === p.id }"
        @click="selected = selected === p.id ? null : p.id"
      >
        <header>
          <div>
            <h3>{{ p.name }} <small>{{ p.term }}</small></h3>
            <div class="tags">
              <span v-if="p.s.firstPayment === lowestFirst" class="tag">Lowest monthly</span>
              <span v-if="yourCost(p) === lowestTotal" class="tag">Lowest total cost</span>
              <span v-if="p.s.forgiven >= 1" class="tag alt">{{ fmtUSD(p.s.forgiven, 0) }} forgiven</span>
            </div>
          </div>
          <div class="plan-pay">
            <strong>{{ fmtUSD(p.s.firstPayment) }}</strong><span>/mo to start</span>
            <small v-if="Math.abs(p.s.lastPayment - p.s.firstPayment) > 1">rising to {{ fmtUSD(p.s.lastPayment) }}</small>
          </div>
        </header>
        <div class="cost-bar" :title="`Total paid ${fmtUSD(yourCost(p), 0)}`">
          <span class="principal" :style="{ width: `${(Math.min(balance, yourCost(p)) / maxTotal) * 100}%` }" />
          <span class="interest" :style="{ width: `${(Math.max(yourCost(p) - balance, 0) / maxTotal) * 100}%` }" />
        </div>
        <dl class="plan-stats">
          <div><dt>Total paid</dt><dd>{{ fmtUSD(yourCost(p), 0) }}</dd></div>
          <div><dt>Interest</dt><dd>{{ fmtUSD(Math.max(yourCost(p) - balance, 0), 0) }}</dd></div>
          <div><dt>Time to finish</dt><dd>{{ fmtMonths(p.s.months) }}</dd></div>
        </dl>
        <p v-if="selected === p.id" class="plan-blurb">{{ p.blurb }}</p>
      </article>
    </TransitionGroup>
    <p class="legend-note"><span class="key principal" /> Principal <span class="key interest" /> Interest. Click a plan to see details.</p>

    <div v-if="selectedPlan" class="band-inline">
      <div>
        <b>Want to switch to {{ selectedPlan.name }}?</b>
        <span> Your payment would start at {{ fmtUSD(selectedPlan.s.firstPayment) }} a month.</span>
      </div>
      <NuxtLink :to="{ path: '/contact', query: { topic: 'plans' } }" class="btn primary">Request this plan</NuxtLink>
    </div>

    <p class="muted fine">
      Estimates only. Graduated payments go up 15% every 2 years. The income-driven plan assumes your income grows 3% a year
      and uses the 2025 poverty guideline. Your real payments depend on your loan type and eligibility.
    </p>
  </div>
</template>
