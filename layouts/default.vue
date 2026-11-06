<template>
  <div>
    <div class="demo-banner">Demo site for showing how containers work. Not a real lender.</div>
    <div class="utility-bar">
      <div class="wrap">
        <span>Student loan servicing</span>
        <div class="utility-links">
          <NuxtLink to="/contact">Contact us</NuxtLink>
          <NuxtLink to="/infrastructure">Site status</NuxtLink>
          <span>1-800-555-0100</span>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="wrap">
        <NuxtLink to="/" class="logo">
          <span class="logo-mark">N</span>
          <span class="logo-text">Northbridge<small>Loan Servicing</small></span>
        </NuxtLink>
        <nav>
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/payment">Make a payment</NuxtLink>
          <NuxtLink to="/plans">Plans</NuxtLink>
          <NuxtLink to="/estimate">Estimate</NuxtLink>
          <NuxtLink to="/payment-trouble">Payment trouble</NuxtLink>
          <NuxtLink to="/infrastructure">Infrastructure</NuxtLink>
        </nav>
        <button class="btn primary login" type="button" title="Demo only — there are no accounts">Log in</button>
      </div>
    </header>
    <main><slot /></main>
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          <div class="footer-logo">Northbridge</div>
          <p>Helping borrowers understand and manage their student loans.</p>
        </div>
        <div>
          <h4>Borrowers</h4>
          <NuxtLink to="/payment">Make a payment</NuxtLink>
          <NuxtLink to="/plans">Compare plans</NuxtLink>
          <NuxtLink to="/estimate">Payment estimator</NuxtLink>
          <NuxtLink to="/payment-trouble">Payment trouble</NuxtLink>
        </div>
        <div>
          <h4>Support</h4>
          <NuxtLink to="/help">Help center</NuxtLink>
          <NuxtLink to="/contact">Contact us</NuxtLink>
          <NuxtLink to="/infrastructure">How this site runs</NuxtLink>
        </div>
        <div>
          <h4>Contact</h4>
          <span>1-800-555-0100</span>
          <span>Mon–Fri, 8am–9pm ET</span>
        </div>
      </div>
      <div class="wrap footer-legal">Northbridge Loan Servicing is a made-up company for a container demo.</div>
    </footer>
  </div>
</template>
