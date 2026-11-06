<script setup lang="ts">
const faqs = [
  { q: 'When is my payment due?', a: 'Your due date is shown on your monthly statement and account dashboard.' },
  { q: 'Can I change my repayment plan?', a: 'Yes. Most plans can be changed at any time by request.' },
  { q: 'What if I can’t make a payment?', a: 'Contact us before your due date to go over deferment or forbearance options.' },
]
</script>

<template>
  <section class="page-head">
    <div class="wrap">
      <h1>Help center</h1>
      <p>Answers to common questions about your account and payments.</p>
    </div>
  </section>
  <div class="wrap page">
    <details v-for="f in faqs" :key="f.q" class="faq">
      <summary>{{ f.q }}</summary>
      <p>{{ f.a }}</p>
    </details>
    <p class="muted">Still need help? <NuxtLink to="/contact">Contact us</NuxtLink>, or see
      <NuxtLink to="/payment-trouble">options if you’re having trouble paying</NuxtLink>.</p>
  </div>
</template>
