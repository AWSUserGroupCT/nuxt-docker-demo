<template>
  <section class="page-head">
    <div class="wrap">
      <h1>How this site runs</h1>
      <p>A look behind the scenes at the containers serving this page.</p>
    </div>
  </section>
  <div class="wrap page">
    <p>Every page here comes from one of several identical containers behind a load balancer.</p>
    <InstanceBadge />
    <pre class="diagram">
    Browser ──▶ nginx load balancer (:8080)
                   ├──▶ web container #1  (Nuxt / Node)
                   ├──▶ web container #2  (Nuxt / Node)
                   └──▶ web container #N  ← docker compose up --scale web=N
    </pre>
    <p>Click <b>Send 10 requests</b>: each colored chip is a different container answering.</p>
  </div>
</template>
