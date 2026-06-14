// Supabase Edge Function: missed-checkin-alert
// Runs hourly. Finds seniors past their check-in time who haven't checked in today,
// and texts/emails their family member. Free to run on Supabase.
//
// Deploy:  supabase functions deploy missed-checkin-alert
// Secrets: supabase secrets set TWILIO_SID=... TWILIO_TOKEN=... TWILIO_FROM=... RESEND_KEY=...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  const today = now.toISOString().slice(0, 10);

  // Seniors whose check-in time has passed and who have an alert contact
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, preferred_name, name, checkin_time, alert_phone, alert_email, last_alert_sent")
    .not("alert_phone", "is", null);

  if (!profiles) return new Response("no profiles");

  let alertsSent = 0;
  for (const p of profiles) {
    // Already alerted today? skip
    if (p.last_alert_sent === today) continue;
    // Check-in time not passed yet? skip (allow 60 min grace)
    if (minutesNow < (p.checkin_time || 540) + 60) continue;

    // Did they check in today?
    const { data: ci } = await supabase
      .from("checkins")
      .select("id")
      .eq("profile_id", p.id)
      .gte("created_at", today + "T00:00:00Z")
      .limit(1);

    if (ci && ci.length > 0) continue; // they checked in, all good

    const who = p.preferred_name || p.name || "your loved one";
    const msg = `Harmony: ${who} hasn't checked in today. You may want to give them a call to make sure they're okay.`;

    // Send SMS via Twilio (if configured)
    const sid = Deno.env.get("TWILIO_SID");
    if (sid && p.alert_phone) {
      const token = Deno.env.get("TWILIO_TOKEN")!;
      const from = Deno.env.get("TWILIO_FROM")!;
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: "Basic " + btoa(`${sid}:${token}`), "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: p.alert_phone, From: from, Body: msg }),
      });
    }

    // OR send email via Resend (free tier, if configured)
    const resend = Deno.env.get("RESEND_KEY");
    if (resend && p.alert_email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Harmony <alerts@yourdomain.com>", to: p.alert_email, subject: `${who} hasn't checked in today`, text: msg }),
      });
    }

    await supabase.from("profiles").update({ last_alert_sent: today }).eq("id", p.id);
    await supabase.from("activity").insert({ profile_id: p.id, type: "alert", detail: "Missed check-in — family notified" });
    alertsSent++;
  }

  return new Response(JSON.stringify({ alertsSent }), { headers: { "Content-Type": "application/json" } });
});
