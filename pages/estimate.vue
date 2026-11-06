<script setup lang="ts">
import type { Schedule } from '~/utils/loan'

useHead({ title: 'Estimate my payment — Northbridge' })

const balance = ref(30000)
const rate = ref(5.5)
const years = ref(10)
const extra = ref(0)
const showTable = ref(false)

const base = computed(() => standardPlan(balance.value || 0, rate.value || 0, years.value))
const withExtra = computed(() => standardPlan(balance.value || 0, rate.value || 0, years.value, extra.value || 0))
const monthly = computed(() => amortizedPayment(balance.value || 0, rate.value || 0, years.value * 12))
const saved = computed(() => base.value.totalInterest - withExtra.value.totalInterest)
const monthsSaved = computed(() => base.value.months - withExtra.value.months)
const payoffDate = (months: number) =>
  addMonths(new Date(), months).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

// ---- Chart: remaining balance by year ----
const W = 1000
const H = 340
const pad = { l: 60, r: 100, t: 20, b: 32 }
const colors = { base: '#5b8fd6', extra: '#d97a3a' }

// Four even steps on a clean 1/2/2.5/5/7.5 × 10ⁿ interval.
const yStep = computed(() => {
  const raw = Math.max(balance.value || 0, 1) / 4
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  return ([1, 2, 2.5, 5, 7.5, 10].find((m) => m * mag >= raw) ?? 10) * mag
})
const yMax = computed(() => yStep.value * 4)
const yTicks = computed(() => Array.from({ length: 5 }, (_, i) => yStep.value * i))
const xTicks = computed(() => Array.from({ length: years.value / 5 + 1 }, (_, i) => i * 5))
const sx = (yr: number) => pad.l + (yr / years.value) * (W - pad.l - pad.r)
const sy = (v: number) => pad.t + (1 - v / yMax.value) * (H - pad.t - pad.b)
const compact = (v: number) => (v >= 1000 ? `$${+(v / 1000).toFixed(1)}K` : `$${Math.round(v)}`)

// [year, balance] points; the last point lands on the actual payoff month.
const points = (s: Schedule) =>
  s.yearlyBalance.map((v, i) => [i === s.yearlyBalance.length - 1 && s.months % 12 ? s.months / 12 : i, v] as const)
const path = (s: Schedule) => points(s).map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('')
const hasExtra = computed(() => (extra.value || 0) > 0)

const hoverYear = ref<number | null>(null)
const balanceAt = (s: Schedule, yr: number) => (yr < s.yearlyBalance.length ? s.yearlyBalance[yr] : 0)
function onMove(e: PointerEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * W
  const yr = Math.round(((x - pad.l) / (W - pad.l - pad.r)) * years.value)
  hoverYear.value = Math.min(Math.max(yr, 0), years.value)
}
const tableRows = computed(() =>
  Array.from({ length: years.value + 1 }, (_, yr) => ({
    yr,
    base: balanceAt(base.value, yr),
    extra: balanceAt(withExtra.value, yr),
  })),
)
</script>

<template>
  <section class="page-head">
    <div class="wrap">
      <h1>Estimate my payment</h1>
      <p>Move the sliders to see your monthly payment, and how paying a little extra adds up.</p>
    </div>
  </section>

  <div class="wrap page estimate">
    <div class="panel sliders">
      <label class="slider">
        <span>Loan balance <output>{{ fmtUSD(balance, 0) }}</output></span>
        <input v-model.number="balance" type="range" min="1000" max="150000" step="500" />
      </label>
      <label class="slider">
        <span>Interest rate <output>{{ rate.toFixed(1) }}%</output></span>
        <input v-model.number="rate" type="range" min="0" max="12" step="0.1" />
      </label>
      <div class="slider">
        <span>Term</span>
        <div class="seg" role="group" aria-label="Term in years">
          <button v-for="y in [10, 15, 20, 25]" :key="y" type="button" :class="{ on: years === y }" @click="years = y">{{ y }} yr</button>
        </div>
      </div>
      <label class="slider">
        <span>Extra each month <output>{{ fmtUSD(extra, 0) }}</output></span>
        <input v-model.number="extra" type="range" min="0" max="500" step="10" />
      </label>
    </div>

    <div class="panel results">
      <div class="hero-figure">
        <span>Estimated monthly payment</span>
        <strong>{{ fmtUSD(monthly + (extra || 0)) }}</strong>
        <small v-if="hasExtra">{{ fmtUSD(monthly) }} + {{ fmtUSD(extra, 0) }} extra</small>
      </div>
      <dl class="summary">
        <dt>Total interest</dt><dd>{{ fmtUSD(withExtra.totalInterest, 0) }}</dd>
        <dt>Total paid</dt><dd>{{ fmtUSD(withExtra.totalPaid, 0) }}</dd>
        <dt>Paid off by</dt><dd>{{ payoffDate(withExtra.months) }}</dd>
      </dl>
      <p v-if="hasExtra && saved > 0" class="tip">
        Paying {{ fmtUSD(extra, 0) }} extra saves <b>{{ fmtUSD(saved, 0) }}</b> in interest and finishes
        <b>{{ fmtMonths(monthsSaved) }}</b> sooner.
      </p>
      <p v-else class="muted">Try the “Extra each month” slider to see how much faster you could pay it off.</p>
      <NuxtLink to="/plans" class="more">Compare all plans →</NuxtLink>
    </div>

    <div class="panel chart-panel">
      <div class="chart-head">
        <h2>Remaining balance</h2>
        <div class="legend">
          <span><i :style="{ background: colors.base }" /> {{ years }}-year schedule</span>
          <span v-if="hasExtra"><i :style="{ background: colors.extra }" /> With {{ fmtUSD(extra, 0) }} extra</span>
        </div>
        <button type="button" class="link-btn" @click="showTable = !showTable">{{ showTable ? 'Show chart' : 'Show table' }}</button>
      </div>

      <div v-if="!showTable" class="chart-wrap">
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          role="img"
          :aria-label="`Remaining balance over ${years} years`"
          @pointermove="onMove"
          @pointerleave="hoverYear = null"
        >
          <g class="grid">
            <g v-for="t in yTicks" :key="t">
              <line :x1="pad.l" :x2="W - pad.r" :y1="sy(t)" :y2="sy(t)" />
              <text :x="pad.l - 8" :y="sy(t) + 4" text-anchor="end">{{ compact(t) }}</text>
            </g>
            <text v-for="t in xTicks" :key="t" :x="sx(t)" :y="H - 8" text-anchor="middle">{{ t === 0 ? 'Now' : `Yr ${t}` }}</text>
          </g>
          <path :d="path(base)" fill="none" :stroke="colors.base" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <path v-if="hasExtra" :d="path(withExtra)" fill="none" :stroke="colors.extra" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <!-- Direct labels at the payoff points -->
          <g class="end-label">
            <circle :cx="sx(base.months / 12)" :cy="sy(0)" r="4" :fill="colors.base" stroke="#fff" stroke-width="2" />
            <text :x="sx(base.months / 12) + 8" :y="sy(0) - 8">Paid off</text>
            <template v-if="hasExtra && monthsSaved > 0">
              <circle :cx="sx(withExtra.months / 12)" :cy="sy(0)" r="4" :fill="colors.extra" stroke="#fff" stroke-width="2" />
              <text :x="sx(withExtra.months / 12) + 8" :y="sy(0) - 8">{{ fmtMonths(monthsSaved) }} sooner</text>
            </template>
          </g>
          <g v-if="hoverYear !== null" class="crosshair">
            <line :x1="sx(hoverYear)" :x2="sx(hoverYear)" :y1="pad.t" :y2="H - pad.b" />
            <circle :cx="sx(hoverYear)" :cy="sy(balanceAt(base, hoverYear))" r="4" :fill="colors.base" stroke="#fff" stroke-width="2" />
            <circle v-if="hasExtra" :cx="sx(hoverYear)" :cy="sy(balanceAt(withExtra, hoverYear))" r="4" :fill="colors.extra" stroke="#fff" stroke-width="2" />
          </g>
          <rect :x="pad.l" :y="pad.t" :width="W - pad.l - pad.r" :height="H - pad.t - pad.b" fill="transparent" />
        </svg>
        <div
          v-if="hoverYear !== null"
          class="chart-tip"
          :style="{ left: `${(sx(hoverYear) / W) * 100}%`, transform: hoverYear > years / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }"
        >
          <b>{{ hoverYear === 0 ? 'Today' : `After year ${hoverYear}` }}</b>
          <span><i :style="{ background: colors.base }" /> {{ fmtUSD(balanceAt(base, hoverYear), 0) }}</span>
          <span v-if="hasExtra"><i :style="{ background: colors.extra }" /> {{ fmtUSD(balanceAt(withExtra, hoverYear), 0) }}</span>
        </div>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr><th>Year</th><th>{{ years }}-year schedule</th><th v-if="hasExtra">With extra</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in tableRows" :key="r.yr">
            <td>{{ r.yr === 0 ? 'Today' : r.yr }}</td>
            <td>{{ fmtUSD(r.base, 0) }}</td>
            <td v-if="hasExtra">{{ fmtUSD(r.extra, 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
