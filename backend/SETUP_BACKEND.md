# Harmony Backend Setup (Supabase — free)

This adds: cloud sync between senior & family devices, secure login, automatic missed check-in alerts (SMS/email), and Stripe subscriptions with a 7-day trial.

**Cost: $0 to start.** Supabase free tier covers a real launch. You only pay Stripe's per-transaction fee (no monthly fee) and ~$0.01 per alert SMS if you use Twilio (email alerts are free).

---

## Part 1 — Create the database (10 min)

1. Go to **supabase.com** → sign up (free) → New Project
2. Pick a name and a strong database password, choose the free plan
3. Wait ~2 min for it to provision
4. Left sidebar → **SQL Editor** → New query
5. Open `supabase/schema.sql` from this folder, paste the whole thing, click **Run**
6. Left sidebar → **Settings → API** — copy your **Project URL** and **anon public key**
7. Paste those into `src/lib/supabase.js` (top of file)

---

## Part 2 — Install the CLI & deploy functions (10 min)

1. Install the Supabase CLI: `npm install -g supabase`
2. In the `backend` folder run: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
   (the project ref is in your Supabase URL: https://**PROJECT_REF**.supabase.co)
4. Deploy the functions:
   ```
   supabase functions deploy missed-checkin-alert
   supabase functions deploy create-checkout
   ```

---

## Part 3 — Turn on automatic missed check-in alerts (5 min)

Choose ONE alert method:

### Email alerts (free) — recommended to start
1. Sign up at **resend.com** (free: 3,000 emails/month)
2. Get your API key
3. `supabase secrets set RESEND_KEY=re_xxxxx`

### OR SMS alerts (~$0.01 each) — more reliable for families
1. Sign up at **twilio.com**, get a phone number
2. `supabase secrets set TWILIO_SID=ACxxxx TWILIO_TOKEN=xxxx TWILIO_FROM=+1xxxxxxxxxx`

Then schedule the hourly check (free, uses Supabase pg_cron):
1. SQL Editor → run this (fill in your project ref + anon key):
```sql
select cron.schedule(
  'missed-checkin-hourly', '0 * * * *',
  $$ select net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/missed-checkin-alert',
       headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
     ); $$
);
```

---

## Part 4 — Payments with Stripe (15 min)

1. Sign up at **stripe.com**
2. Create a Product → recurring price → $19/month → copy the **price ID** (price_xxxx)
3. In Stripe → Settings → Subscriptions → turn ON **"Send trial-ending email 2 days before"** (this is the reminder Apple also requires)
4. Set your Stripe secrets:
   ```
   supabase secrets set STRIPE_SECRET=sk_live_xxxx STRIPE_PRICE=price_xxxx
   ```
5. In `create-checkout/index.ts` replace `YOUR_APP_URL` with your deployed app URL, then redeploy:
   `supabase functions deploy create-checkout`

The 7-day trial, the charge date, and the 2-day-before reminder email are all handled automatically by Stripe.

---

## Part 5 — Connect the frontend

In `App.jsx`, the demo currently uses `localStorage`. When you're ready for cloud sync and real payments:
- Import helpers from `src/lib/supabase.js`
- Swap `store.set("hm_subscribed"…)` for the real `startCheckout(email, profileId)` call
- Swap check-in/activity writes for `addCheckin` / `addActivity` so the family dashboard updates live

Take it one step at a time — the app works fully on localStorage today, and you can migrate to Supabase piece by piece.

---

## Summary of what's free
- Supabase: free tier (database, auth, realtime, functions, cron) ✓
- Resend email alerts: 3,000/month free ✓
- Vercel hosting: free ✓
- Stripe: no monthly fee, ~2.9% + 30¢ per payment
- Twilio SMS (optional): ~$0.01 per alert
