// k6 load test for compile-service (spec §9): 50 concurrent cache-miss
// builds. Run before a release against a staging deployment:
//   k6 run -e URL=https://compile.staging.example infra/load/compile.k6.js
import http from 'k6/http';
import { check } from 'k6';

const SCENE = open('../sandbox/template/src/scene.rs');

export const options = {
  scenarios: {
    burst: { executor: 'per-vu-iterations', vus: 50, iterations: 1, maxDuration: '5m' },
  },
  thresholds: {
    'http_req_duration{expected_response:true}': ['p(50)<5000', 'p(95)<15000'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const source = `${SCENE}\n// k6 ${__VU}-${Date.now()}\n`;
  const res = http.post(
    `${__ENV.URL}/api/compile`,
    JSON.stringify({ source, sdk_version: '0.5.0' }),
    {
      headers: { 'content-type': 'application/json' },
      timeout: '120s',
    },
  );
  check(res, { compiled: (r) => r.status === 200 && r.json('status') === 'done' });
}
