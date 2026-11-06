<template>
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <p class="eyebrow">Your student loans, all in one place</p>
        <h1>Student loans, made manageable.</h1>
        <p class="lead">See your balance, pick a repayment plan, and make payments in one place.</p>
        <div class="cta">
          <NuxtLink to="/estimate" class="btn primary">Estimate my payment</NuxtLink>
          <NuxtLink to="/help" class="btn ghost">Get help</NuxtLink>
        </div>
      </div>
      <InstanceBadge />
    </div>
  </section>

  <section class="wrap quick-actions">
    <NuxtLink to="/payment" class="action"><span class="icon">$</span>Make a payment</NuxtLink>
    <NuxtLink to="/plans" class="action"><span class="icon">≡</span>Compare plans</NuxtLink>
    <NuxtLink to="/payment-trouble" class="action"><span class="icon">?</span>Payment trouble</NuxtLink>
    <NuxtLink to="/contact" class="action"><span class="icon">☏</span>Contact us</NuxtLink>
  </section>

  <section class="wrap section">
    <h2>What would you like to do?</h2>
    <div class="cards">
      <div class="card">
        <h3>Make a payment</h3>
        <p>One-time or recurring payments with autopay discounts.</p>
        <NuxtLink to="/payment" class="more">Make a payment →</NuxtLink>
      </div>
      <div class="card">
        <h3>Repayment plans</h3>
        <p>Compare standard, graduated, and extended plans.</p>
        <NuxtLink to="/plans" class="more">Compare plans →</NuxtLink>
      </div>
      <div class="card">
        <h3>Payment trouble?</h3>
        <p>Look into deferment, forbearance, and other options.</p>
        <NuxtLink to="/payment-trouble" class="more">See your options →</NuxtLink>
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap band-inner">
      <div>
        <h2>Having trouble making payments?</h2>
        <p>You may have options. Contact us before your due date and we'll go over them with you.</p>
      </div>
      <NuxtLink to="/payment-trouble" class="btn light">Explore options</NuxtLink>
    </div>
  </section>
</template>
