# Container demo: Northbridge Loan Servicing (fictional)

A small Nuxt 3 loan-servicing site for showing how containers package, scale,
and heal an app. Every page shows **which container served it**.

Requires Docker Desktop (includes `docker compose`). Node is not needed locally.

## Demo script

```bash
# 1. Build the image and start the container
docker compose up -d --build
open http://localhost:3000/infrastructure

# 2. Self-healing: kill the container, the restart policy brings it back
docker compose ps
docker kill <web-container>

# 3. Check which container answered from the terminal
curl -s localhost:3000/api/instance

# 4. Tear down
docker compose down
```
Scaling and load balancing across multiple containers are shown in the
Kubernetes setup below.

## Talking points
- **One artifact, anywhere**: the image built here runs the same on a laptop, in
  ECS, or in Kubernetes.
- **Small and locked down**: multi-stage build ships only compiled output, runs as
  a non-root user, has a health check.
- **Stateless = scalable**: the request counter is per container on purpose. It
  shows why session/state belongs in a shared store (Redis, a database).

## Kubernetes (autoscaling)
```bash
docker build -t container-demo:1.0.0 .
kubectl apply -f k8s/
kubectl get pods -w          # HPA scales 3–20 pods on CPU
```
For a remote cluster, push the image to your registry and update `image:` in
`k8s/deployment.yaml`.

### Helm
The chart in `helm/container-demo` deploys the same thing (Deployment, Service,
HPA) plus a PodDisruptionBudget and an optional Ingress.
```bash
docker build -t container-demo:1.0.0 .
helm upgrade --install demo helm/container-demo
kubectl get pods -w

# Remote cluster: point at your registry
helm upgrade --install demo helm/container-demo \
  --set image.repository=registry.example.com/container-demo --set image.tag=1.0.0

# Rolling update demo: the version shows on every page
docker build --build-arg APP_VERSION=1.0.1 -t container-demo:1.0.1 .
helm upgrade demo helm/container-demo --set image.tag=1.0.1

helm uninstall demo
```
Use either `k8s/` or the chart, not both. Each one creates a LoadBalancer on
port 80, so they would conflict.
