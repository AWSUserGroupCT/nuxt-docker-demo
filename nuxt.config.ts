export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  css: ['~/assets/css/main.css'],
  // The old estimator URL moved to /estimate.
  routeRules: { '/repayment': { redirect: '/estimate' } },
  app: {
    head: {
      title: 'Northbridge Loan Servicing — Container Demo',
      meta: [{ name: 'robots', content: 'noindex' }],
    },
  },
})
