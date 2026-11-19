k6 run --vus 100 --duration 3m -e TARGET=https://testurl.cooltest.com - <<EOF
import http from 'k6/http';
export default function () {
  http.get(__ENV.TARGET);
}
EOF