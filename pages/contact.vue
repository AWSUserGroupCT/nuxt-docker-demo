<script setup lang="ts">
useHead({ title: 'Contact us — Northbridge' })

type Result = { ticket: string; replyWithin: string; method: string; processedBy: string }

const topics = [
  { v: 'payment', label: 'A payment' },
  { v: 'plans', label: 'Changing my repayment plan' },
  { v: 'trouble', label: 'Trouble making payments' },
  { v: 'account', label: 'My account or due date' },
  { v: 'other', label: 'Something else' },
]

const route = useRoute()
const form = reactive({
  name: '',
  email: '',
  topic: topics.some((t) => t.v === route.query.topic) ? String(route.query.topic) : '',
  method: 'email',
  message: '',
})
const touched = reactive<Record<string, boolean>>({})
const submitted = ref(false)
const sending = ref(false)
const serverErrors = ref<Record<string, string>>({})
const result = ref<Result | null>(null)
const MAX = 1000

const errors = computed(() => {
  const e: Record<string, string> = {}
  if (!form.name.trim()) e.name = 'Enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
  if (!form.topic) e.topic = 'Choose a topic.'
  const len = form.message.trim().length
  if (len < 10) e.message = 'Tell us a little more (at least 10 characters).'
  else if (len > MAX) e.message = 'Keep it under 1,000 characters.'
  return { ...e, ...serverErrors.value }
})
const show = (k: string) => (submitted.value || touched[k]) && errors.value[k]

async function send() {
  submitted.value = true
  serverErrors.value = {}
  if (Object.keys(errors.value).length) return
  sending.value = true
  try {
    result.value = await $fetch<Result>('/api/contact', { method: 'POST', body: form })
  } catch (err: any) {
    serverErrors.value = err?.data?.data?.errors ?? { form: 'Something went wrong. Please try again.' }
  } finally {
    sending.value = false
  }
}

// Open Mon–Fri 8am–9pm Eastern. Worked out in the browser so it uses the visitor's clock.
const status = ref<{ open: boolean; text: string } | null>(null)
onMounted(() => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hour12: false })
    .formatToParts(new Date())
  const day = parts.find((p) => p.type === 'weekday')!.value
  const hour = Number(parts.find((p) => p.type === 'hour')!.value) % 24
  const weekday = !['Sat', 'Sun'].includes(day)
  const open = weekday && hour >= 8 && hour < 21
  status.value = open
    ? { open, text: `Open now · closes at 9pm ET` }
    : { open, text: weekday && hour < 8 ? 'Closed · opens at 8am ET' : 'Closed · opens next weekday at 8am ET' }
})
</script>

<template>
  <section class="page-head">
    <div class="wrap">
      <h1>Contact us</h1>
      <p>Send us a message, or call during business hours.</p>
    </div>
  </section>

  <div class="wrap page layout-aside">
    <div>
      <div v-if="result" class="panel success">
        <div class="success-icon">✓</div>
        <h2>Thanks, {{ form.name.split(' ')[0] }}. We got your message.</h2>
        <p>Your ticket number is <code>{{ result.ticket }}</code>. We’ll reply by {{ result.method }} within {{ result.replyWithin }}.</p>
        <p class="host-chip">Received by container <code>{{ result.processedBy }}</code></p>
        <NuxtLink to="/" class="btn primary">Back to home</NuxtLink>
      </div>

      <form v-else class="panel form" novalidate @submit.prevent="send">
        <p v-if="serverErrors.form" class="err">{{ serverErrors.form }}</p>
        <div class="field-row">
          <label class="field">
            Full name
            <input v-model="form.name" autocomplete="name" :aria-invalid="!!show('name')" @blur="touched.name = true" />
            <small v-if="show('name')" class="err">{{ errors.name }}</small>
          </label>
          <label class="field">
            Email
            <input v-model.trim="form.email" type="email" autocomplete="email" :aria-invalid="!!show('email')" @blur="touched.email = true" />
            <small v-if="show('email')" class="err">{{ errors.email }}</small>
          </label>
        </div>

        <label class="field">
          What’s this about?
          <select v-model="form.topic" :aria-invalid="!!show('topic')" @blur="touched.topic = true">
            <option value="" disabled>Choose a topic</option>
            <option v-for="t in topics" :key="t.v" :value="t.v">{{ t.label }}</option>
          </select>
          <small v-if="show('topic')" class="err">{{ errors.topic }}</small>
        </label>
        <p v-if="form.topic === 'trouble'" class="tip">
          You can also <NuxtLink to="/payment-trouble">answer three questions</NuxtLink> to see your options right away.
        </p>

        <label class="field">
          Message
          <textarea v-model="form.message" rows="6" :maxlength="MAX + 50" :aria-invalid="!!show('message')" @blur="touched.message = true" />
          <span class="field-foot">
            <small v-if="show('message')" class="err">{{ errors.message }}</small>
            <small class="counter" :class="{ over: form.message.length > MAX }">{{ form.message.length }} / {{ MAX }}</small>
          </span>
        </label>

        <fieldset>
          <legend>How should we reply?</legend>
          <div class="seg" role="radiogroup">
            <button type="button" :class="{ on: form.method === 'email' }" @click="form.method = 'email'">Email</button>
            <button type="button" :class="{ on: form.method === 'phone' }" @click="form.method = 'phone'">Phone call</button>
          </div>
        </fieldset>

        <p class="muted fine">Don’t include your full Social Security number or bank account numbers.</p>
        <div class="actions">
          <button class="btn primary" type="submit" :disabled="sending">{{ sending ? 'Sending…' : 'Send message' }}</button>
        </div>
      </form>
    </div>

    <aside class="panel">
      <h3>Call us</h3>
      <p class="phone">1-800-555-0100</p>
      <p v-if="status" class="status" :class="status.open ? 'open' : 'closed'">
        <span class="status-dot" aria-hidden="true" />{{ status.text }}
      </p>
      <dl class="summary">
        <dt>Monday–Friday</dt><dd>8am–9pm ET</dd>
        <dt>Saturday–Sunday</dt><dd>Closed</dd>
      </dl>
      <h3>Mail</h3>
      <p class="muted">Northbridge Loan Servicing<br />PO Box 0000<br />Anytown, ST 00000</p>
      <h3>Quick links</h3>
      <NuxtLink to="/payment" class="more">Make a payment →</NuxtLink>
      <NuxtLink to="/payment-trouble" class="more">Payment trouble →</NuxtLink>
      <NuxtLink to="/help" class="more">Help center →</NuxtLink>
    </aside>
  </div>
</template>
