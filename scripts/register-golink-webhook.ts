// One-time setup script — registers our webhook callback URL with Golink Transact
// and prints the signing secret to paste into GOLINK_WEBHOOK_SECRET in .env.
//
// Run once per environment (sandbox now, production later — do NOT re-run
// casually, it creates a new webhook registration each time):
//   npx tsx scripts/register-golink-webhook.ts

const BASE_URL = process.env.GOLINK_BASE_URL ?? 'https://sandbox.transact.golink.co.ls/api';
const API_KEY = process.env.GOLINK_API_KEY ?? '';
const CALLBACK_URL = process.env.GOLINK_CALLBACK_URL ?? 'https://myhealth.ithembahealth.com/api/webhooks/golink';

async function main() {
  if (!API_KEY) {
    console.error('GOLINK_API_KEY is not set. Export it or run via `export $(cat .env | xargs) && npx tsx scripts/register-golink-webhook.ts`.');
    process.exit(1);
  }

  console.log(`Registering webhook ${CALLBACK_URL} against ${BASE_URL} ...`);

  const res = await fetch(`${BASE_URL}/webhooks`, {
    method: 'POST',
    headers: { 'X-Api-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: CALLBACK_URL,
      events: ['payment.succeeded', 'payment.failed', 'payment.refunded'],
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error(`Failed (${res.status}):`, body);
    process.exit(1);
  }

  console.log('\nWebhook registered successfully.');
  console.log('Webhook ID:', body.id);
  console.log('Secret (shown once — paste into .env as GOLINK_WEBHOOK_SECRET):');
  console.log(body.secret);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
