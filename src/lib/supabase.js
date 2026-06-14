// Supabase client for syncing data between the senior's and family's devices.
// 1. npm install @supabase/supabase-js
// 2. Fill in your project URL and anon key (Supabase dashboard → Settings → API)
// 3. Import and use these helpers in App.jsx to replace localStorage when you're ready.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth ──
export const signUp = (email, password) => supabase.auth.signUp({ email, password });
export const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export const getUser = () => supabase.auth.getUser();

// ── Check-ins ──
export const addCheckin = (profileId, mood) =>
  supabase.from("checkins").insert({ profile_id: profileId, mood });

export const getCheckins = (profileId) =>
  supabase.from("checkins").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(100);

// ── Activity (for family dashboard, updates live) ──
export const addActivity = (profileId, type, detail, mood) =>
  supabase.from("activity").insert({ profile_id: profileId, type, detail, mood });

export const subscribeToActivity = (profileId, callback) =>
  supabase.channel("activity-" + profileId)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity", filter: `profile_id=eq.${profileId}` }, callback)
    .subscribe();

// ── Start Stripe checkout ──
export const startCheckout = async (email, profileId) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ email, profileId }),
  });
  const { url } = await res.json();
  if (url) window.location.href = url; // redirect to Stripe
};
