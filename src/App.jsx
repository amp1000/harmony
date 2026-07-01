import { useState, useEffect, useRef, useCallback } from "react";

/* ════════════════════════════════════════════════
   Harmony — Elderly Companion + Family Care System
   iOS-style. Runs standalone. localStorage based.
   ════════════════════════════════════════════════ */

const store = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

const LANGS = [
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "it-IT", name: "Italiano", flag: "🇮🇹" },
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  { code: "zh-CN", name: "中文", flag: "🇨🇳" },
  { code: "hi-IN", name: "हिंदी", flag: "🇮🇳" },
];

const EL_VOICES = {
  female: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Sarah", desc: "Warm & gentle" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", desc: "Soft & caring" },
  ],
  male: [
    { id: "pNInz6obpgDQGcFmaJgB", name: "James", desc: "Deep & calm" },
    { id: "ErXwobaYiN019PkySvjV", name: "Michael", desc: "Friendly & warm" },
  ],
};

// ─── Design tokens ───
const C = {
  bg: "var(--bg)", card: "var(--card)", text: "var(--text)", text2: "var(--text2)", text3: "var(--text3)",
  sep: "var(--sep)", teal: "var(--teal)", tealSoft: "var(--teal-soft)", blue: "var(--blue)",
  green: "var(--green)", greenSoft: "var(--green-soft)", amber: "var(--amber)", amberSoft: "var(--amber-soft)",
  red: "var(--red)", redSoft: "var(--red-soft)",
};

const card = { background: C.card, borderRadius: 18, padding: 18 };
const bigBtn = { width: "100%", padding: "16px", borderRadius: 14, border: "none", background: C.teal, color: "#fff", fontSize: 17, fontWeight: 600, cursor: "pointer" };
const grayBtn = { ...bigBtn, background: C.card, color: C.text };

function todayKey() { return new Date().toISOString().slice(0, 10); }
function timeNow() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function fmtTime(mins) { const h = Math.floor(mins / 60), m = mins % 60; const ap = h < 12 ? "AM" : "PM"; const h12 = h % 12 || 12; return `${h12}:${String(m).padStart(2, "0")} ${ap}`; }

// ─── Interface translations (English / Spanish). Spanish uses the respectful "usted" form. ───
const STR = {
  en: {
    taglineA: "Know they're okay,", taglineB: "every single day.",
    subtagline: "A warm companion for them. Peace of mind for you.",
    feat1: "Daily check-ins with family alerts", feat2: "A warm companion to talk with", feat3: "Medication reminders & tracking", feat4: "Family wellbeing dashboard", feat5: "Gentle weekly summaries",
    swipeUp: "Swipe up to start",
    payTitle: "Start with a free week", payBody: "Try everything free for 7 days. We'll remind you 2 days before it ends, and you can cancel anytime.",
    startTrialBtn: "Start my 7-day free trial", orSubscribe: "Or subscribe now", perMonth: "/month", thenWord: "Then", secureStripe: "Secure payment by Stripe.", imFamilyInstead: "I'm a family member instead",
    trialEndedTitle: "Your free trial has ended", trialEndedBody1: "We hope Harmony has been a comforting companion. Continue keeping your family connected for", trialEndedBody2: "a month.", subscribeWord: "Subscribe", cancelAnytime: "Cancel anytime.", afterSubscribing: "after subscribing.",
    whoUsing: "Who is using this device?", welcomeHeading: "Welcome to Harmony", seniorTitle: "This is my device", seniorDesc: "I want a companion to talk to and to check in each day. (For the senior.)", familyTitle: "I'm checking on a loved one", familyDesc: "See how my parent or relative is doing, from my own phone. (For family.)", changeAnytime: "You can change this anytime.",
    confirmTitle: "Just making sure", confirmSenior: "You're here to use Harmony yourself, as a warm companion to talk with and check in with each day. Is that you?", confirmFamily: "You're here to keep an eye on a parent, family member, or friend from your own device. Is that you?", yesThatsMe: "Yes, that's me", goBackNotMe: "← Go back, that's not me",
    todayTitle: "Today", howAreYou: "How are you today?", howAreYouSub: "Tap one to let your family know you're okay", moodGreat: "Great", moodOkay: "Okay", moodNotGreat: "Not great", checkedInTitle: "You've checked in today", checkedInSub: "You let your family know you're doing well",
    meds: "Medications", edit: "Edit", add: "Add", markTaken: "Mark taken", takenWord: "Taken", noneSet: "None set", talkToHarmony: "Talk to Harmony",
    hereForYou: "Here for you", typeMessage: "Type a message", greeting: "Hello! It's so good to see you. How are you feeling today?",
    tabTalk: "Talk", tabToday: "Today", tabHelp: "Help", tabFamily: "Family", tabSettings: "Settings",
    famHi: "Hi", famHowDoing: "here's how they're doing", checkedIn: "Checked in", notCheckedIn: "Not checked in yet", everythingGood: "Everything looks good today", hasntCheckedIn: "hasn't checked in yet today",
    dailyCheckin: "Daily check-in", talkedToHarmony: "Talked to Harmony", last7days: "Last 7 days", recentActivity: "Recent activity", noActivity: "No activity yet today", callPrefix: "Call", switchRole: "Switch role", notYet: "Not yet", yesWord: "Yes", takenOf: "taken",
    nothingTitle: "Nothing to show yet", nothingBody: "Tap the gear up top to choose what you'd like to keep an eye on. They also control what they share.",
    backToDashboard: "← Back to dashboard", whatYouWatch: "What you keep an eye on", whatYouWatchSub: "Pick what shows on your dashboard. You'll only ever see what they also choose to share.", watchCheckinsSub: "Check-in status, mood, and the 7-day view", watchMedsSub: "Whether their medications were taken", activityChats: "Activity & chats", watchActivitySub: "Recent activity and conversations", famAlertNote: "If they miss a check-in, you'll get a text alert. We'll finish setting that up together.",
    familyDashTitle: "Family Dashboard", doneWord: "Done", weeklyTitle: "Weekly summary", generateWord: "Generate", weeklyPlaceholder: "Tap Generate to create an AI summary of how your loved one has been doing this week.", backToHarmony: "← Back to Harmony", familyAccessTitle: "Family Access", familyAccessSub: "For trusted family members", viewDashTitle: "View wellbeing dashboard", viewDashSub: "See check-ins, medications, mood trends, and a weekly summary.", openDashBtn: "Open Dashboard", familyPinNote: "In production this is protected by a family PIN.",
    settings: "Settings", rowVoice: "Voice & API keys", rowMeds: "Medications", rowContacts: "Trusted contacts", rowCheckinTime: "Daily check-in time", rowSwitchRole: "Switch role (senior or family)",
    whatYouShare: "What you share with family", whatYouShareSub: "Family only ever sees what you turn on here. You can change this anytime.", shareCheckinsSub: "Whether you checked in, and your mood", shareMedsSub: "Which medications you've taken", shareActivitySub: "When you talk with Harmony",
    resetAll: "Reset all data", resetConfirm: "Reset Harmony? This clears ALL data.",
    helpTitle: "Help", helpSub: "Reach your loved ones anytime", call911: "Call 911", language: "Language",
  },
  es: {
    taglineA: "Sepa que están bien,", taglineB: "cada día.",
    subtagline: "Una compañía cálida para ellos. Tranquilidad para usted.",
    feat1: "Registro diario con avisos a la familia", feat2: "Una compañía cálida con quien conversar", feat3: "Recordatorios y control de medicamentos", feat4: "Panel de bienestar para la familia", feat5: "Resúmenes semanales sencillos",
    swipeUp: "Deslice hacia arriba para empezar",
    payTitle: "Empiece con una semana gratis", payBody: "Pruebe todo gratis durante 7 días. Le avisaremos 2 días antes de que termine, y puede cancelar cuando quiera.",
    startTrialBtn: "Empezar mi prueba gratis de 7 días", orSubscribe: "O suscríbase ahora", perMonth: "/mes", thenWord: "Después", secureStripe: "Pago seguro con Stripe.", imFamilyInstead: "Soy un familiar",
    trialEndedTitle: "Su prueba gratuita ha terminado", trialEndedBody1: "Esperamos que Harmony haya sido una buena compañía. Siga manteniendo a su familia conectada por", trialEndedBody2: "al mes.", subscribeWord: "Suscribirse", cancelAnytime: "Cancele cuando quiera.", afterSubscribing: "después de suscribirse.",
    whoUsing: "¿Quién usa este teléfono?", welcomeHeading: "Bienvenido a Harmony", seniorTitle: "Este es mi teléfono", seniorDesc: "Quiero una compañía con quien conversar y registrarme cada día. (Para la persona mayor.)", familyTitle: "Estoy cuidando de un ser querido", familyDesc: "Vea cómo está su padre o familiar, desde su propio teléfono. (Para la familia.)", changeAnytime: "Puede cambiar esto cuando quiera.",
    confirmTitle: "Solo para confirmar", confirmSenior: "Usted va a usar Harmony para sí mismo, como una compañía cálida con quien conversar y registrarse cada día. ¿Es usted?", confirmFamily: "Usted va a cuidar de un padre, familiar o amigo desde su propio teléfono. ¿Es usted?", yesThatsMe: "Sí, soy yo", goBackNotMe: "← Volver, no soy yo",
    todayTitle: "Hoy", howAreYou: "¿Cómo se siente hoy?", howAreYouSub: "Toque una para que su familia sepa que está bien", moodGreat: "Muy bien", moodOkay: "Regular", moodNotGreat: "Mal", checkedInTitle: "Ya se registró hoy", checkedInSub: "Le avisó a su familia que está bien",
    meds: "Medicamentos", edit: "Editar", add: "Agregar", markTaken: "Marcar tomado", takenWord: "Tomado", noneSet: "Ninguno", talkToHarmony: "Hablar con Harmony",
    hereForYou: "Aquí para usted", typeMessage: "Escriba un mensaje", greeting: "¡Hola! Qué gusto verle. ¿Cómo se siente hoy?",
    tabTalk: "Conversar", tabToday: "Hoy", tabHelp: "Ayuda", tabFamily: "Familia", tabSettings: "Ajustes",
    famHi: "Hola", famHowDoing: "así van las cosas", checkedIn: "Registrado", notCheckedIn: "Sin registro todavía", everythingGood: "Todo se ve bien hoy", hasntCheckedIn: "aún no se ha registrado hoy",
    dailyCheckin: "Registro diario", talkedToHarmony: "Conversó con Harmony", last7days: "Últimos 7 días", recentActivity: "Actividad reciente", noActivity: "Sin actividad por hoy", callPrefix: "Llamar a", switchRole: "Cambiar de perfil", notYet: "Aún no", yesWord: "Sí", takenOf: "tomados",
    nothingTitle: "Nada que mostrar aún", nothingBody: "Toque el engranaje de arriba para elegir qué desea ver. Ellos también controlan lo que comparten.",
    backToDashboard: "← Volver al panel", whatYouWatch: "Lo que desea ver", whatYouWatchSub: "Elija lo que aparece en su panel. Solo verá lo que ellos también decidan compartir.", watchCheckinsSub: "Estado del registro, ánimo y la vista de 7 días", watchMedsSub: "Si tomaron sus medicamentos", activityChats: "Actividad y conversaciones", watchActivitySub: "Actividad y conversaciones recientes", famAlertNote: "Si no se registran, recibirá un aviso por mensaje de texto. Terminaremos de configurarlo juntos.",
    familyDashTitle: "Panel de la familia", doneWord: "Hecho", weeklyTitle: "Resumen semanal", generateWord: "Generar", weeklyPlaceholder: "Toque Generar para crear un resumen de cómo ha estado su ser querido esta semana.", backToHarmony: "← Volver a Harmony", familyAccessTitle: "Acceso para la familia", familyAccessSub: "Para familiares de confianza", viewDashTitle: "Ver el panel de bienestar", viewDashSub: "Vea los registros, los medicamentos, los ánimos y un resumen semanal.", openDashBtn: "Abrir el panel", familyPinNote: "En la versión final esto se protege con un PIN familiar.",
    settings: "Ajustes", rowVoice: "Voz y claves de API", rowMeds: "Medicamentos", rowContacts: "Contactos de confianza", rowCheckinTime: "Hora del registro diario", rowSwitchRole: "Cambiar de perfil (mayor o familiar)",
    whatYouShare: "Lo que comparte con la familia", whatYouShareSub: "La familia solo ve lo que usted activa aquí. Puede cambiarlo cuando quiera.", shareCheckinsSub: "Si se registró, y su ánimo", shareMedsSub: "Qué medicamentos ha tomado", shareActivitySub: "Cuando conversa con Harmony",
    resetAll: "Borrar todos los datos", resetConfirm: "¿Borrar Harmony? Esto elimina TODOS los datos.",
    helpTitle: "Ayuda", helpSub: "Comuníquese con sus seres queridos cuando quiera", call911: "Llamar al 911", language: "Idioma",
  },
};

export default function Harmony() {
  const [screen, setScreen] = useState("loading");
  const [tab, setTab] = useState("talk");
  const [lang, setLang] = useState("en-US");
  const [gender, setGender] = useState("female");
  const [profile, setProfile] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [voices, setVoices] = useState([]);

  // Care features
  const [checkins, setCheckins] = useState([]);       // [{ts, mood}]
  const [meds, setMeds] = useState([]);                // [{id,name,time}]
  const [medLog, setMedLog] = useState([]);            // [{medId,name,ts,taken}]
  const [activity, setActivity] = useState([]);        // [{type,ts,detail,mood?}]
  const [checkInTime, setCheckInTime] = useState(540); // 9:00 AM in minutes
  const [alertContactId, setAlertContactId] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState("");

  // TTS
  const [ttsProvider, setTtsProvider] = useState("browser");
  const [ttsKey, setTtsKey] = useState("");
  const [ttsVoiceId, setTtsVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [anthropicKey, setAnthropicKey] = useState("");

  // family lock
  const [familyUnlocked, setFamilyUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  // Face ID / biometric (optional)
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [unlockTries, setUnlockTries] = useState(0);
  const biometricSupported = typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;

  // Trial / subscription
  const TRIAL_DAYS = 7;
  const PRICE = "$19";
  const [trialStart, setTrialStart] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [cardOnFile, setCardOnFile] = useState(false);

  // App mode: "senior" (the companion) or "family" (the dashboard)
  const [appMode, setAppMode] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [familyCodeInput, setFamilyCodeInput] = useState("");
  const [linkedSenior, setLinkedSenior] = useState(null); // senior data the family is watching
  const [pendingRole, setPendingRole] = useState(null); // role tapped on the picker, awaiting confirmation
  const [payOpen, setPayOpen] = useState(false); // trial/pay bottom sheet on the preview screen

  const bottomRef = useRef(null);
  const speakFn = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const swipeStartY = useRef(null); // tracks vertical swipe on the preview screen
  const [camOn, setCamOn] = useState(false);

  // What the senior shares, and what the family chooses to watch. Family sees only the overlap.
  const [share, setShare] = useState(() => store.get("hm_share") || { checkins: true, meds: true, activity: true });
  const [watch, setWatch] = useState(() => store.get("hm_watch") || { checkins: true, meds: true, activity: true });
  const setShareKey = (k, v) => { const next = { ...share, [k]: v }; setShare(next); store.set("hm_share", next); };
  const setWatchKey = (k, v) => { const next = { ...watch, [k]: v }; setWatch(next); store.set("hm_watch", next); };

  // ─── Load ───
  useEffect(() => {
    const lv = () => { const v = window.speechSynthesis?.getVoices(); if (v?.length) setVoices(v); };
    lv(); if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = lv;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const p = store.get("hm_profile"); if (p) setProfile(p);
    const c = store.get("hm_contacts"); if (c) setContacts(c);
    const l = store.get("hm_lang"); if (l) setLang(l);
    const g = store.get("hm_gender"); if (g) setGender(g);
    setCheckins(store.get("hm_checkins") || []);
    setMeds(store.get("hm_meds") || []);
    setMedLog(store.get("hm_medlog") || []);
    setActivity(store.get("hm_activity") || []);
    const ct = store.get("hm_checkin_time"); if (ct != null) setCheckInTime(ct);
    const ac = store.get("hm_alert_contact"); if (ac) setAlertContactId(ac);
    const tp = store.get("hm_tts_provider"); if (tp) setTtsProvider(tp);
    const tk = store.get("hm_tts_key"); if (tk) setTtsKey(tk);
    const tv = store.get("hm_tts_voice"); if (tv) setTtsVoiceId(tv);
    const ak = store.get("hm_anthropic"); if (ak) setAnthropicKey(ak);
    const ws = store.get("hm_weekly"); if (ws) setWeeklySummary(ws);
    // Trial / subscription
    let ts = store.get("hm_trial_start");
    if (!ts) { ts = Date.now(); store.set("hm_trial_start", ts); }
    setTrialStart(ts);
    setSubscribed(!!store.get("hm_subscribed"));
    setCardOnFile(!!store.get("hm_card"));
    const fid = store.get("hm_faceid"); const fcred = store.get("hm_biometric_id");
    const faceOn = !!fid && !!fcred;
    setFaceIdEnabled(faceOn);

    // Ensure senior has a shareable family code
    let code = store.get("hm_family_code");
    if (!code) { code = Math.random().toString(36).slice(2, 8).toUpperCase(); store.set("hm_family_code", code); }

    // Route by app mode
    const mode = store.get("hm_app_mode");
    setAppMode(mode);
    if (!mode) { setScreen("roleSelect"); return; }
    if (mode === "family") {
      const fn = store.get("hm_family_name"); if (fn) setFamilyName(fn);
      const linked = store.get("hm_linked_senior");
      if (linked) { setLinkedSenior(linked); setScreen("familyHome"); }
      else setScreen("familyLogin");
      return;
    }
    // senior mode
    if (p) {
      setLocked(faceOn);
      setScreen("app");
    } else {
      setScreen("welcome");
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // ─── Activity logging ───
  const logActivity = useCallback((type, detail, mood) => {
    setActivity(prev => {
      const next = [...prev, { type, ts: Date.now(), detail, mood }].slice(-200);
      store.set("hm_activity", next);
      return next;
    });
  }, []);

  // ─── Check-in ───
  const checkedInToday = checkins.some(c => new Date(c.ts).toISOString().slice(0, 10) === todayKey());
  const doCheckIn = (mood) => {
    const next = [...checkins, { ts: Date.now(), mood }].slice(-100);
    setCheckins(next); store.set("hm_checkins", next);
    logActivity("checkin", "Checked in", mood);
  };

  // ─── Medications ───
  const medTakenToday = (medId) => medLog.some(m => m.medId === medId && m.taken && new Date(m.ts).toISOString().slice(0, 10) === todayKey());
  const logMed = (med, taken) => {
    const next = [...medLog, { medId: med.id, name: med.name, ts: Date.now(), taken }].slice(-300);
    setMedLog(next); store.set("hm_medlog", next);
    logActivity("medication", `${taken ? "Took" : "Skipped"} ${med.name}`);
  };

  // ─── TTS ───
  const stopAudio = useCallback(() => {
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} audioRef.current = null; }
    try { window.speechSynthesis?.cancel(); } catch {}
    setSpeaking(false);
  }, []);

  const playEL = useCallback(async (text, key, vid) => {
    stopAudio(); setSpeaking(true);
    try {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}/stream`, {
        method: "POST", headers: { Accept: "audio/mpeg", "Content-Type": "application/json", "xi-api-key": key },
        body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.45, similarity_boost: 0.78, style: 0.2, use_speaker_boost: true } })
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); setSpeaking(false); return { ok: false, error: e?.detail?.message || `HTTP ${r.status}` }; }
      const url = URL.createObjectURL(await r.blob());
      const a = new Audio(url); audioRef.current = a;
      a.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      a.onerror = () => { setSpeaking(false); audioRef.current = null; };
      await a.play(); return { ok: true };
    } catch (e) { setSpeaking(false); return { ok: false, error: e.message }; }
  }, [stopAudio]);

  const playBrowser = useCallback((text, og) => {
    stopAudio(); if (!text || !window.speechSynthesis) return;
    const g = og || gender;
    const chunks = text.match(/.{1,200}(\s|$)/g) || [text]; let i = 0;
    const next = () => {
      if (i >= chunks.length) { setSpeaking(false); return; }
      const u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = lang; u.rate = 0.84; u.pitch = g === "female" ? 1.05 : 0.82;
      if (voices.length) {
        const base = lang.split("-")[0].toLowerCase();
        const gp = voices.filter(v => v.name.toLowerCase().includes("google") && v.lang.toLowerCase().startsWith(base));
        const pool = gp.length ? gp : voices.filter(v => v.lang.toLowerCase().startsWith(base));
        const fem = ["samantha", "victoria", "karen", "ava", "allison", "emily", "anna", "sarah", "emma", "moira"];
        const mal = ["daniel", "alex", "thomas", "oliver", "fred", "david", "aaron"];
        const names = g === "female" ? fem : mal;
        const m = pool.find(v => names.some(n => v.name.toLowerCase().includes(n))) || pool[0];
        if (m) u.voice = m;
      }
      if (i === 1) u.onstart = () => setSpeaking(true);
      u.onend = next; u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    };
    next();
  }, [lang, gender, voices, stopAudio]);

  const speak = useCallback(async (text) => {
    if (!text) return;
    if (ttsProvider === "elevenlabs" && ttsKey && ttsVoiceId) {
      const r = await playEL(text, ttsKey, ttsVoiceId); if (!r.ok) playBrowser(text);
    } else playBrowser(text);
  }, [ttsProvider, ttsKey, ttsVoiceId, playEL, playBrowser]);
  useEffect(() => { speakFn.current = speak; }, [speak]);

  const listen = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening) return;
    const r = new SR(); r.lang = lang;
    r.onstart = () => setListening(true); r.onend = () => setListening(false); r.onerror = () => setListening(false);
    r.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    r.start();
  }, [lang, listening]);

  // ─── Claude ───
  const claude = async (messages, system) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages })
    });
    const d = await res.json();
    return d.content?.[0]?.text || "";
  };

  const langName = LANGS.find(l => l.code === lang)?.name || "English";
  const ui = String(lang).toLowerCase().startsWith("es") ? "es" : "en";
  const t = STR[ui];
  const loc = ui === "es" ? "es-ES" : "en-US";
  const moodLabel = (m) => ({ "Great": t.moodGreat, "Okay": t.moodOkay, "Not great": t.moodNotGreat }[m] || m);
  const toggleLang = () => { const next = ui === "es" ? "en-US" : "es-ES"; setLang(next); store.set("hm_lang", next); };
  const profileSys = () => `You are Harmony, a warm patient AI companion for elderly users. Respond in ${langName}. Build a profile by asking ONE gentle question at a time: name & preferred name, age & location, family, hobbies, daily routine, health (if comfortable), goals. Keep responses 2-3 warm sentences. After 6+ topics give a warm summary and write PROFILE_COMPLETE on its own line.`;
  const companionSys = () => `You are Harmony, a deeply warm caring AI companion for an elderly user. Respond in ${langName}. Profile: ${JSON.stringify(profile || {})}. Be warm, patient, 2-4 sentences, always end with a gentle question. If they mention pain/fall/emergency, suggest calling family or 911. Today: ${new Date().toLocaleDateString()}.`;

  useEffect(() => {
    if (screen !== "onboarding") return;
    setMsgs([]);
    const hasKey = !!(store.get("hm_anthropic") || anthropicKey);
    const g = hasKey
      ? "Hello! I'm Harmony, and I am truly delighted to meet you. I'd love to get to know you so I can be the very best companion for you. To start, what would you like me to call you?"
      : "Hello! I'm Harmony. 👋 You're exploring without an API key, so I can't chat yet — but tap the button below to jump straight into the app and look around. Add a key in Settings anytime to turn on our conversations.";
    setTimeout(() => { setMsgs([{ role: "assistant", content: g }]); setTimeout(() => speakFn.current?.(g), 400); }, 200);
  }, [screen]);

  const noKey = !(store.get("hm_anthropic") || anthropicKey);

  useEffect(() => {
    if (screen !== "app" || tab !== "talk" || !profile || msgs.length > 0) return;
    const h = new Date().getHours();
    const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
    const nm = profile.preferredName || profile.name || "";
    const g = noKey
      ? `Good ${tod}! I'm Harmony. 👋 You're in explore mode right now. Once a companion key is connected, I'll be able to chat with you here in a warm voice, remember our conversations, and keep you company every day. Feel free to look around all the tabs below!`
      : `Good ${tod}${nm ? ", " + nm : ""}! It's so wonderful to be here with you today. How are you feeling right now?`;
    setMsgs([{ role: "assistant", content: g }]);
    setTimeout(() => speakFn.current?.(g), 500);
  }, [screen, tab, profile]);

  const sendOnboarding = async (text) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const up = [...msgs, { role: "user", content: text }]; setMsgs(up); setInput("");
    try {
      const reply = await claude(up, profileSys());
      const nm = [...up, { role: "assistant", content: reply }]; setMsgs(nm);
      speakFn.current?.(reply.replace("PROFILE_COMPLETE", "").trim());
      if (reply.includes("PROFILE_COMPLETE")) {
        const sr = await claude([...nm, { role: "user", content: "Extract profile as JSON: name,preferredName,age,location,family(string[]),hobbies(string[]),routine,healthNotes,goals. ONLY JSON." }], "Return only valid JSON.");
        let parsed = { name: "Friend" };
        try { const cl = sr.replace(/```json|```/g, "").trim(); const s = cl.indexOf("{"), e = cl.lastIndexOf("}"); if (s !== -1) parsed = JSON.parse(cl.slice(s, e + 1)); } catch {}
        store.set("hm_profile", parsed); store.set("hm_lang", lang); store.set("hm_gender", gender);
        setProfile(parsed); logActivity("system", "Profile created");
        setTimeout(() => { setScreen("faceOffer"); setMsgs([]); }, 2500);
      }
    } catch { setMsgs(p => [...p, { role: "assistant", content: "I'm so sorry, I had a little hiccup. Could you say that again?" }]); }
    setBusy(false);
  };

  const sendChat = async (text) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    if (["help", "fallen", "fall", "hurt", "emergency", "chest pain", "stroke", "911"].some(w => text.toLowerCase().includes(w))) {
      logActivity("alert", "Possible distress mentioned in chat");
    }
    const up = [...msgs, { role: "user", content: text }]; setMsgs(up); setInput("");
    try {
      const reply = await claude(up.slice(-16), companionSys());
      setMsgs([...up, { role: "assistant", content: reply }]);
      speakFn.current?.(reply);
      // light mood logging every few messages
      if (up.filter(m => m.role === "user").length % 3 === 0) {
        const mood = await claude([{ role: "user", content: `User said: "${text}". In ONE word, their mood: happy, content, lonely, sad, anxious, or unwell. Just the word.` }], "One word only.");
        logActivity("mood", text.slice(0, 60), mood.trim().toLowerCase());
      }
    } catch { setMsgs(p => [...p, { role: "assistant", content: "I'm right here with you. Let's try again." }]); }
    setBusy(false);
  };

  const genWeeklySummary = async () => {
    const recent = activity.slice(-50).map(a => `${new Date(a.ts).toLocaleDateString()} ${a.type}: ${a.detail}${a.mood ? " (mood: " + a.mood + ")" : ""}`).join("\n");
    try {
      const s = await claude([{ role: "user", content: `Here is ${profile?.preferredName || profile?.name || "the user"}'s recent activity log:\n${recent}\n\nWrite a warm, concise 3-4 sentence weekly wellbeing summary for their family. Mention mood trends, check-in consistency, and medication adherence. Be reassuring but honest.` }], "You write caring family wellbeing summaries.");
      setWeeklySummary(s); store.set("hm_weekly", s);
    } catch { setWeeklySummary("Could not generate summary. Check your Anthropic API key."); }
  };

  // ─── Biometric (Face ID / Touch ID / Windows Hello) ───
  const b64 = {
    enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))),
    dec: (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0)),
  };

  const registerBiometric = async () => {
    if (!biometricSupported) { alert("This device doesn't support Face ID or fingerprint unlock."); return false; }
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const name = profile?.preferredName || profile?.name || "Harmony User";
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Harmony" },
          user: { id: userId, name, displayName: name },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
          timeout: 60000,
        }
      });
      store.set("hm_biometric_id", b64.enc(cred.rawId));
      store.set("hm_faceid", true);
      setFaceIdEnabled(true);
      return true;
    } catch (e) {
      alert("Couldn't set up Face ID. You can try again anytime in Settings.");
      return false;
    }
  };

  const authenticateBiometric = async () => {
    const credId = store.get("hm_biometric_id");
    if (!credId) { setLocked(false); return; }
    setUnlockError("");
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: "public-key", id: b64.dec(credId) }],
          userVerification: "required",
          timeout: 60000,
        }
      });
      setLocked(false); setUnlockTries(0); setUnlockError("");
    } catch (e) {
      setUnlockTries(t => t + 1);
      setUnlockError("Couldn't verify. Please try again.");
    }
  };

  const disableFaceId = () => {
    store.del("hm_faceid"); store.del("hm_biometric_id");
    setFaceIdEnabled(false); setLocked(false);
  };

  // Auto-prompt Face ID when locked screen appears
  useEffect(() => {
    if (locked && screen === "app") {
      const t = setTimeout(() => { authenticateBiometric(); }, 600);
      return () => clearTimeout(t);
    }
  }, [locked, screen]);

  // ─── Camera ───
  const startCam = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; setCamOn(true); } catch { alert("Camera access denied."); } };
  const stopCam = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCamOn(false); };

  const reset = () => { if (!confirm(t.resetConfirm)) return; ["hm_profile","hm_contacts","hm_lang","hm_gender","hm_checkins","hm_meds","hm_medlog","hm_activity","hm_checkin_time","hm_alert_contact","hm_tts_provider","hm_tts_key","hm_tts_voice","hm_weekly","hm_faceid","hm_biometric_id","hm_trial_start","hm_subscribed","hm_card","hm_app_mode","hm_linked_senior","hm_family_name","hm_share","hm_watch"].forEach(k => store.del(k)); window.location.reload(); };

  // ─── Trial / subscription math ───
  const dayMs = 86400000;
  const daysUsed = trialStart ? Math.floor((Date.now() - trialStart) / dayMs) : 0;
  const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed);
  const chargeDate = trialStart ? new Date(trialStart + TRIAL_DAYS * dayMs) : null;
  const reminderDate = trialStart ? new Date(trialStart + (TRIAL_DAYS - 2) * dayMs) : null;
  const trialExpired = !subscribed && daysLeft <= 0;
  const fmtDate = (d) => d ? d.toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "";

  const subscribeNow = () => {
    store.set("hm_subscribed", true); store.set("hm_card", true);
    setSubscribed(true); setCardOnFile(true);
    alert("✓ Subscribed! In the deployed app this opens secure Stripe checkout.");
  };
  const addCardForTrial = () => {
    store.set("hm_card", true); setCardOnFile(true);
    alert(`✓ Card saved. You will NOT be charged until ${fmtDate(chargeDate)}. We'll email you 2 days before, on ${fmtDate(reminderDate)}. Cancel anytime before then for free.`);
  };

  // Continue from the preview into the senior setup, exactly as the old "Get Started" did.
  const enterSeniorSetup = () => {
    if (anthropicKey || store.get("hm_anthropic")) { setScreen("onboarding"); }
    else { const demo = { name: "Friend", preferredName: "" }; store.set("hm_profile", demo); setProfile(demo); setScreen("faceOffer"); }
  };
  // Begin the 7-day trial: start the clock, then go into setup.
  // In the deployed app this is where Stripe checkout (card upfront, 7-day trial) opens.
  const startTrial = () => {
    if (!trialStart) { const now = Date.now(); store.set("hm_trial_start", now); setTrialStart(now); }
    setPayOpen(false);
    enterSeniorSetup();
  };
  const subscribeFromPreview = () => {
    subscribeNow();
    setPayOpen(false);
    enterSeniorSetup();
  };

  // ─── Family linking ───
  const chooseMode = (m) => {
    setAppMode(m); store.set("hm_app_mode", m);
    if (m === "senior") setScreen(store.get("hm_profile") ? "app" : "welcome");
    else setScreen("familyLogin");
  };

  const linkToSenior = () => {
    const name = familyName.trim();
    const code = familyCodeInput.trim().toUpperCase();
    if (!name || !code) { alert("Please enter your name and the family code."); return; }
    // DEMO (same browser): the senior's code is in localStorage; verify it matches.
    // PRODUCTION: this calls Supabase to find the senior by code and create a family_link row,
    //   then the dashboard reads their live data (see src/lib/supabase.js).
    const seniorCode = store.get("hm_family_code");
    const seniorProfile = store.get("hm_profile");
    if (code === seniorCode && seniorProfile) {
      const linked = { code, name: seniorProfile.preferredName || seniorProfile.name || "your loved one" };
      setLinkedSenior(linked);
      store.set("hm_family_name", name); store.set("hm_linked_senior", linked);
      setScreen("familyHome");
    } else {
      // For demo purposes, allow linking with a sample senior if code looks valid
      if (code.length === 6) {
        const linked = { code, name: "Margaret", demo: true };
        setLinkedSenior(linked);
        store.set("hm_family_name", name); store.set("hm_linked_senior", linked);
        setScreen("familyHome");
      } else {
        alert("That code wasn't found. Ask your loved one for the family code shown in their Harmony settings.");
      }
    }
  };

  const familyLogout = () => {
    store.del("hm_app_mode"); store.del("hm_linked_senior"); store.del("hm_family_name");
    setAppMode(null); setLinkedSenior(null); setScreen("roleSelect");
  };

  // Return to the role picker WITHOUT erasing anything, so a user can flip roles freely.
  const switchRole = () => {
    store.del("hm_app_mode");
    setAppMode(null); setPendingRole(null); setScreen("roleSelect");
  };

  // ════════════════════════════════════
  // RENDER
  // ════════════════════════════════════
  const Page = ({ children, title, sub }) => (
    <div style={{ padding: "8px 16px 100px" }}>
      {title && <div style={{ padding: "8px 4px 16px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h1>
        {sub && <p style={{ fontSize: 15, color: C.text2, marginTop: 2 }}>{sub}</p>}
      </div>}
      {children}
    </div>
  );

  const Avatar = ({ sz = 60, active }) => (
    <div style={{ width: sz, height: sz, borderRadius: "50%", background: `linear-gradient(135deg, ${C.teal}, #5BC0B3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.42, color: "#fff", flexShrink: 0, boxShadow: active ? `0 0 0 8px ${C.tealSoft}` : "none", transition: "box-shadow .3s" }}>♡</div>
  );

  if (screen === "loading") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 18 }}>
      <Avatar sz={84} active />
      <p style={{ color: C.text2, fontSize: 16 }}>Loading Harmony…</p>
    </div>
  );

  // ─── ROLE SELECT (first launch) ───
  if (screen === "roleSelect") return (
    <div style={{ padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingTop: 70, textAlign: "center", marginBottom: 36 }}>
        <Avatar sz={88} />
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 18 }}>{t.welcomeHeading}</h1>
        <p style={{ fontSize: 17, color: C.text2, marginTop: 8 }}>{t.whoUsing}</p>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><LangToggle ui={ui} onToggle={toggleLang} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <button onClick={() => { setPendingRole("senior"); setScreen("roleConfirm"); }} style={{ ...card, textAlign: "left", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, padding: 20 }}>
          <span style={{ fontSize: 38 }}>♡</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>{t.seniorTitle}</p>
            <p style={{ fontSize: 14, color: C.text2, marginTop: 2, lineHeight: 1.4 }}>{t.seniorDesc}</p>
          </div>
          <span style={{ fontSize: 20, color: C.text3 }}>›</span>
        </button>
        <button onClick={() => { setPendingRole("family"); setScreen("roleConfirm"); }} style={{ ...card, textAlign: "left", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, padding: 20 }}>
          <span style={{ fontSize: 38 }}>👨‍👩‍👧</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>{t.familyTitle}</p>
            <p style={{ fontSize: 14, color: C.text2, marginTop: 2, lineHeight: 1.4 }}>{t.familyDesc}</p>
          </div>
          <span style={{ fontSize: 20, color: C.text3 }}>›</span>
        </button>
      </div>
      <p style={{ fontSize: 12, color: C.text3, textAlign: "center", paddingBottom: 30 }}>{t.changeAnytime}</p>
    </div>
  );

  // ─── ROLE CONFIRM (gentle "is this really you?" step) ───
  if (screen === "roleConfirm") {
    const isSenior = pendingRole !== "family";
    return (
      <div style={{ padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ paddingTop: 70, textAlign: "center", marginBottom: 30 }}>
          <div style={{ width: 96, height: 96, borderRadius: 28, background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, margin: "0 auto" }}>{isSenior ? "♡" : "👨‍👩‍👧"}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 18 }}>{t.confirmTitle}</h1>
        </div>
        <div style={{ ...card, padding: 22 }}>
          <p style={{ fontSize: 19, lineHeight: 1.55, textAlign: "center" }}>
            {isSenior ? t.confirmSenior : t.confirmFamily}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto", paddingBottom: 40, paddingTop: 24 }}>
          <button onClick={() => chooseMode(isSenior ? "senior" : "family")} style={{ ...bigBtn, fontSize: 18, padding: 18 }}>{t.yesThatsMe}</button>
          <button onClick={() => { setPendingRole(null); setScreen("roleSelect"); }} style={{ ...grayBtn, fontSize: 16 }}>{t.goBackNotMe}</button>
        </div>
      </div>
    );
  }

  // ─── FAMILY LOGIN ───
  if (screen === "familyLogin") return (
    <div style={{ padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingTop: 50, textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 88, height: 88, borderRadius: 26, background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, margin: "0 auto" }}>👨‍👩‍👧</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 16 }}>Connect to your loved one</h1>
        <p style={{ fontSize: 15, color: C.text2, marginTop: 8, lineHeight: 1.5 }}>Enter the family code shown in their Harmony settings, under "Family Code."</p>
      </div>
      <div style={{ ...card, marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 6 }}>YOUR NAME</p>
        <input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="e.g. Sarah" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 16, marginBottom: 16 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 6 }}>FAMILY CODE</p>
        <input value={familyCodeInput} onChange={e => setFamilyCodeInput(e.target.value.toUpperCase())} placeholder="e.g. 4F2K9X" maxLength={6} style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 22, letterSpacing: "0.2em", textAlign: "center", fontWeight: 600 }} />
      </div>
      <button onClick={linkToSenior} style={{ ...bigBtn, marginBottom: 10 }}>Connect</button>
      <button onClick={() => { setAppMode(null); store.del("hm_app_mode"); setScreen("roleSelect"); }} style={{ ...grayBtn, fontSize: 15 }}>← Back</button>
      <p style={{ fontSize: 12, color: C.text3, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>In the full version you'll also sign in with email so your access stays secure and private.</p>
    </div>
  );

  // ─── FAMILY SETTINGS (what the family member keeps an eye on) ───
  if (screen === "familySettings") {
    const sName = linkedSenior?.name || "your loved one";
    return (
      <Page title={t.settings} sub={t.whatYouWatch}>
        <button onClick={() => setScreen("familyHome")} style={{ ...grayBtn, fontSize: 15, marginBottom: 14 }}>{t.backToDashboard}</button>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><LangToggle ui={ui} onToggle={toggleLang} /></div>
        <div style={{ ...card, marginBottom: 14, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 4px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.whatYouWatch}</p>
            <p style={{ fontSize: 13, color: C.text2, marginTop: 4, lineHeight: 1.5 }}>{t.whatYouWatchSub}</p>
          </div>
          <ToggleRow icon="✅" label={t.dailyCheckin} sub={t.watchCheckinsSub} on={watch.checkins} onToggle={(v) => setWatchKey("checkins", v)} />
          <ToggleRow icon="💊" label={t.meds} sub={t.watchMedsSub} on={watch.meds} onToggle={(v) => setWatchKey("meds", v)} />
          <ToggleRow icon="💬" label={t.activityChats} sub={t.watchActivitySub} on={watch.activity} onToggle={(v) => setWatchKey("activity", v)} last />
        </div>
        <div style={{ ...card, marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{t.famAlertNote}</p>
        </div>
      </Page>
    );
  }

  // ─── FAMILY HOME (dashboard on the family member's own phone) ───
  if (screen === "familyHome") {
    // In demo (same browser) we read the senior's local data. In production this comes live from Supabase.
    const sName = linkedSenior?.name || "your loved one";
    const ci = linkedSenior?.demo ? [] : (store.get("hm_checkins") || []);
    const act = linkedSenior?.demo ? [] : (store.get("hm_activity") || []);
    const medsLocal = linkedSenior?.demo ? [] : (store.get("hm_meds") || []);
    const medLogLocal = linkedSenior?.demo ? [] : (store.get("hm_medlog") || []);
    const checkedToday = ci.some(c => new Date(c.ts).toISOString().slice(0, 10) === todayKey());
    const lastMood = ci.slice(-1)[0]?.mood;
    const medsTakenCount = medsLocal.filter(m => medLogLocal.some(l => l.medId === m.id && l.taken && new Date(l.ts).toISOString().slice(0,10)===todayKey())).length;
    const talked = act.some(a => (a.type === "mood" || a.type === "checkin") && new Date(a.ts).toISOString().slice(0,10)===todayKey());
    // Family sees a section only if they chose to watch it AND the senior shares it (demo data ignores share).
    const demoView = !!linkedSenior?.demo;
    const seeChecks = watch.checkins && (demoView || share.checkins);
    const seeMeds = watch.meds && (demoView || share.meds);
    const seeActivity = watch.activity && (demoView || share.activity);
    const nothingOn = !seeChecks && !seeMeds && !seeActivity;

    return (
      <div style={{ minHeight: "100vh", paddingBottom: 40 }}>
        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{sName}</h1>
            <p style={{ fontSize: 14, color: C.text2 }}>{t.famHi}{familyName ? " " + familyName : ""} · {t.famHowDoing}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setScreen("familySettings")} aria-label="Settings" style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: C.card, color: C.text2, fontSize: 16, cursor: "pointer" }}>⚙️</button>
            <button onClick={familyLogout} aria-label="Log out" style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: C.card, color: C.text2, fontSize: 16, cursor: "pointer" }}>⏻</button>
          </div>
        </div>
        <div style={{ padding: "0 16px" }}>
          {linkedSenior?.demo && (
            <div style={{ background: C.amberSoft, borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: C.amber, fontWeight: 600 }}>{ui === "es" ? "Vista de demostración" : "Demo view"}</p>
              <p style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{ui === "es" ? "Mostrando datos de ejemplo. Conecte el servidor para ver actualizaciones reales de su dispositivo." : "Showing sample data. Connect the backend for live updates from their real device."}</p>
            </div>
          )}

          {/* Big status hero */}
          {seeChecks && (
          <div style={{ ...card, marginBottom: 12, background: checkedToday || linkedSenior?.demo ? C.greenSoft : C.amberSoft, textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 6 }}>{checkedToday || linkedSenior?.demo ? "😊" : "⏳"}</div>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{checkedToday ? `${t.checkedIn} · ${moodLabel(lastMood) || t.moodGreat}` : linkedSenior?.demo ? `${t.checkedIn} · ${t.moodGreat}` : t.notCheckedIn}</p>
            <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>{checkedToday || linkedSenior?.demo ? t.everythingGood : `${sName} ${t.hasntCheckedIn}`}</p>
          </div>
          )}

          {/* Today details */}
          {(seeChecks || seeMeds || seeActivity) && (
          <div style={{ ...card, marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>{t.todayTitle}</p>
            {seeChecks && <Row label={t.dailyCheckin} value={checkedToday ? `✓ ${moodLabel(lastMood) || t.yesWord}` : linkedSenior?.demo ? `✓ ${t.moodGreat}` : t.notYet} good={checkedToday || linkedSenior?.demo} last={!seeMeds && !seeActivity} />}
            {seeMeds && <Row label={t.meds} value={linkedSenior?.demo ? `2/2 ${t.takenOf}` : medsLocal.length ? `${medsTakenCount}/${medsLocal.length} ${t.takenOf}` : t.noneSet} good={linkedSenior?.demo || (medsLocal.length > 0 && medsTakenCount === medsLocal.length)} last={!seeActivity} />}
            {seeActivity && <Row label={t.talkedToHarmony} value={talked || linkedSenior?.demo ? `${t.yesWord} ✓` : t.notYet} good={talked || linkedSenior?.demo} last />}
          </div>
          )}

          {/* 7-day */}
          {seeChecks && (
          <div style={{ ...card, marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>{t.last7days}</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[6,5,4,3,2,1,0].map(d => {
                const date = new Date(); date.setDate(date.getDate() - d);
                const key = date.toISOString().slice(0, 10);
                const did = linkedSenior?.demo ? d > 0 : ci.some(c => new Date(c.ts).toISOString().slice(0,10) === key);
                return (
                  <div key={d} style={{ textAlign: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: did ? C.green : C.bg, color: did ? "#fff" : C.text3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginBottom: 4, border: did ? "none" : `1.5px solid ${C.sep}` }}>{did ? "✓" : "·"}</div>
                    <span style={{ fontSize: 11, color: C.text2 }}>{date.toLocaleDateString(loc, { weekday: "short" }).slice(0,1).toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Recent activity */}
          {seeActivity && (
          <div style={{ ...card, marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>{t.recentActivity}</p>
            {(linkedSenior?.demo ? (ui === "es" ? [
              { type: "checkin", detail: "Se registró · Muy bien", ts: Date.now() - 3600000 },
              { type: "medication", detail: "Tomó su medicamento de presión", ts: Date.now() - 3700000 },
              { type: "mood", detail: "Conversó sobre jardinería", ts: Date.now() - 90000000 },
            ] : [
              { type: "checkin", detail: "Checked in · Great", ts: Date.now() - 3600000 },
              { type: "medication", detail: "Took Blood Pressure", ts: Date.now() - 3700000 },
              { type: "mood", detail: "Chatted about gardening", ts: Date.now() - 90000000 },
            ]) : act.slice(-8).reverse()).map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i ? `1px solid ${C.sep}` : "none" }}>
                <span style={{ fontSize: 18 }}>{a.type === "checkin" ? "✓" : a.type === "medication" ? "💊" : a.type === "mood" ? "💬" : a.type === "alert" ? "⚠️" : "•"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: a.type === "alert" ? C.red : C.text }}>{a.detail}{a.mood ? ` · ${a.mood}` : ""}</p>
                  <p style={{ fontSize: 12, color: C.text2 }}>{new Date(a.ts).toLocaleString(loc, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            {!linkedSenior?.demo && act.length === 0 && <p style={{ fontSize: 14, color: C.text2 }}>{t.noActivity}</p>}
          </div>
          )}

          {nothingOn && (
          <div style={{ ...card, marginBottom: 12, textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 34, marginBottom: 6 }}>👀</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{t.nothingTitle}</p>
            <p style={{ fontSize: 13, color: C.text2, marginTop: 4, lineHeight: 1.5 }}>{t.nothingBody}</p>
          </div>
          )}

          {/* Quick call */}
          <button onClick={() => alert(ui === "es" ? ("En la versión completa esto llama a " + sName + " directamente.") : ("In the full version this calls " + sName + " directly."))} style={{ ...bigBtn }}>📞 {t.callPrefix} {sName}</button>
          <button onClick={switchRole} style={{ ...grayBtn, fontSize: 15, marginTop: 12 }}>🔄 {t.switchRole}</button>
        </div>
      </div>
    );
  }

  // ─── WELCOME ───
  if (screen === "welcome") return (
    <>
      <style>{`@keyframes hmUp { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }`}</style>
      <div
        onTouchStart={(e) => { swipeStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => { if (swipeStartY.current != null && swipeStartY.current - e.changedTouches[0].clientY > 40) setPayOpen(true); swipeStartY.current = null; }}
        style={{ padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 14 }}><LangToggle ui={ui} onToggle={toggleLang} /></div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 30 }}>
          <Avatar sz={92} />
          <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 14 }}>Harmony</h1>
          <p style={{ fontSize: 19, color: C.teal, fontWeight: 600, lineHeight: 1.3, maxWidth: 320, marginTop: 10 }}>{t.taglineA}<br/>{t.taglineB}</p>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.5, maxWidth: 320, marginTop: 8 }}>{t.subtagline}</p>
          <div style={{ ...card, width: "100%", maxWidth: 340, textAlign: "left", marginTop: 22 }}>
            {[t.feat1, t.feat2, t.feat3, t.feat4, t.feat5].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0" }}>
                <span style={{ color: C.green, fontSize: 17 }}>✓</span>
                <span style={{ fontSize: 15 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setPayOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "14px 0 26px" }}>
          <span style={{ fontSize: 28, color: C.teal, animation: "hmUp 1.6s ease-in-out infinite", lineHeight: 1 }}>⌃</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.teal }}>{t.swipeUp}</span>
        </button>
      </div>

      {/* Backdrop */}
      <div onClick={() => setPayOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", opacity: payOpen ? 1 : 0, pointerEvents: payOpen ? "auto" : "none", transition: "opacity .25s", zIndex: 150 }} />

      {/* Trial / pay sheet (slides up) */}
      <div
        onTouchStart={(e) => { swipeStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => { if (swipeStartY.current != null && e.changedTouches[0].clientY - swipeStartY.current > 40) setPayOpen(false); swipeStartY.current = null; }}
        style={{ position: "fixed", left: "50%", bottom: 0, transform: `translateX(-50%) translateY(${payOpen ? "0" : "100%"})`, transition: "transform .3s cubic-bezier(.32,.72,0,1)", width: "100%", maxWidth: 480, background: C.bg, borderRadius: "22px 22px 0 0", boxShadow: "0 -8px 30px rgba(0,0,0,0.18)", zIndex: 160, padding: "10px 18px 34px" }}
      >
        <div onClick={() => setPayOpen(false)} style={{ width: 40, height: 5, borderRadius: 3, background: C.sep, margin: "0 auto 14px", cursor: "pointer" }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", letterSpacing: "-0.02em" }}>{t.payTitle}</h2>
        <p style={{ fontSize: 15, color: C.text2, textAlign: "center", lineHeight: 1.5, marginTop: 6, marginBottom: 18 }}>{t.payBody}</p>
        <button onClick={startTrial} style={{ ...bigBtn, padding: 18, fontSize: 18 }}>{t.startTrialBtn}</button>
        <button onClick={subscribeFromPreview} style={{ ...grayBtn, marginTop: 10, fontSize: 15 }}>{t.orSubscribe} · {PRICE}{t.perMonth}</button>
        <p style={{ fontSize: 12, color: C.text3, textAlign: "center", lineHeight: 1.5, marginTop: 14 }}>{t.thenWord} {PRICE}{t.perMonth}. {t.secureStripe}</p>
        <button onClick={() => { setPayOpen(false); chooseMode("family"); }} style={{ background: "none", border: "none", color: C.text2, fontSize: 14, cursor: "pointer", width: "100%", marginTop: 16, textDecoration: "underline" }}>{t.imFamilyInstead}</button>
      </div>
    </>
  );

  // ─── VOICE/KEY SETUP (during onboarding) ───
  if (screen === "setupVoice") {
    const vlist = EL_VOICES[gender];
    return (
      <Page title="Set up" sub="Add your keys to bring Harmony to life">
        <div style={{ ...card, marginBottom: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>🤖 Anthropic Key</p>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 10 }}>Required for conversation. From console.anthropic.com</p>
          <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-…" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 15 }} />
        </div>
        <div style={{ ...card, marginBottom: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>✨ ElevenLabs Key</p>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 10 }}>Optional. For a real human voice. From elevenlabs.io. Leave blank to use the free built-in voice.</p>
          <input type="password" value={ttsKey} onChange={e => { setTtsKey(e.target.value); setTtsProvider(e.target.value ? "elevenlabs" : "browser"); }} placeholder="sk_…" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 15, marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["female", "male"].map(g => (
              <button key={g} onClick={() => setGender(g)} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${gender === g ? C.teal : C.sep}`, background: gender === g ? C.tealSoft : "transparent", color: gender === g ? C.teal : C.text, fontSize: 15, fontWeight: 500, cursor: "pointer" }}>{g === "female" ? "Female" : "Male"}</button>
            ))}
          </div>
          {ttsKey ? vlist.map(v => (
            <div key={v.id} onClick={() => setTtsVoiceId(v.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, border: `1.5px solid ${ttsVoiceId === v.id ? C.teal : C.sep}`, background: ttsVoiceId === v.id ? C.tealSoft : "transparent", cursor: "pointer", marginBottom: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${ttsVoiceId === v.id ? C.teal : C.text3}`, background: ttsVoiceId === v.id ? C.teal : "transparent" }} />
              <span style={{ fontSize: 15, fontWeight: 500 }}>{v.name}</span>
              <span style={{ fontSize: 13, color: C.text2 }}>{v.desc}</span>
              <button onClick={e => { e.stopPropagation(); playEL("Hello! I'm Harmony. I'm so happy to meet you.", ttsKey, v.id); }} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 10, border: `1px solid ${C.teal}`, background: "transparent", color: C.teal, fontSize: 13, cursor: "pointer" }}>▶</button>
            </div>
          )) : (
            <button onClick={() => playBrowser("Hello! I'm Harmony, your caring companion.")} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${C.sep}`, background: "transparent", color: C.text2, fontSize: 14, cursor: "pointer" }}>▶ Preview built-in voice</button>
          )}
        </div>
        <button onClick={() => { store.set("hm_anthropic", anthropicKey); store.set("hm_tts_provider", ttsKey ? "elevenlabs" : "browser"); store.set("hm_tts_key", ttsKey); store.set("hm_tts_voice", ttsVoiceId); store.set("hm_gender", gender); setScreen("onboarding"); }} style={{ ...bigBtn }}>{anthropicKey ? "Continue →" : "Continue without a key →"}</button>
        {!anthropicKey && <p style={{ fontSize: 12, color: C.text3, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>You can explore the whole app now. Add your Anthropic key anytime in Settings to turn on the conversation.</p>}
      </Page>
    );
  }

  // ─── ONBOARDING CHAT ───
  if (screen === "onboarding") return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.sep}` }}>
        <Avatar sz={44} active={speaking} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 17, fontWeight: 600 }}>Harmony</p>
          <p style={{ fontSize: 13, color: C.text2 }}>{speaking ? "Speaking…" : busy ? "Thinking…" : "Getting to know you"}</p>
        </div>
        <span style={{ fontSize: 12, color: C.teal, background: C.tealSoft, padding: "5px 12px", borderRadius: 20 }}>Setup</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {msgs.map((m, i) => <Bubble key={i} m={m} speak={speakFn} />)}
        {busy && <Typing />}
        <div ref={bottomRef} />
      </div>
      {noKey ? (
        <div style={{ padding: 16, borderTop: `1px solid ${C.sep}` }}>
          <button onClick={() => { const demo = { name: "Friend", preferredName: "Friend" }; store.set("hm_profile", demo); setProfile(demo); setScreen("faceOffer"); setMsgs([]); }} style={{ ...bigBtn }}>Skip into the app & explore →</button>
        </div>
      ) : (
        <ChatBar value={input} setValue={setInput} onSend={sendOnboarding} listen={listen} listening={listening} busy={busy} />
      )}
    </div>
  );

  // ─── FACE ID OFFER (optional, after onboarding) ───
  if (screen === "faceOffer") return (
    <div style={{ padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 18, paddingTop: 40 }}>
        <div style={{ width: 96, height: 96, borderRadius: 28, background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>👤</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>Unlock with your face?</h1>
        <p style={{ fontSize: 17, color: C.text2, lineHeight: 1.5, maxWidth: 320 }}>
          {biometricSupported
            ? "Open Harmony just by looking at it — no password to remember. It uses the same Face ID or fingerprint you already use on this device."
            : "Face unlock isn't available on this device, but that's completely fine — Harmony works simply without it."}
        </p>
        <p style={{ fontSize: 14, color: C.text3, maxWidth: 300 }}>This is optional. You can change it anytime in Settings.</p>
      </div>
      <div style={{ paddingBottom: 40, display: "flex", flexDirection: "column", gap: 12 }}>
        {biometricSupported && (
          <button onClick={async () => { const ok = await registerBiometric(); setScreen("app"); setTab("talk"); }} style={{ ...bigBtn }}>👤 Enable Face Unlock</button>
        )}
        <button onClick={() => { setScreen("app"); setTab("talk"); }} style={{ ...grayBtn, fontSize: 16 }}>No thanks, keep it simple</button>
      </div>
    </div>
  );

  // ─── LOCK SCREEN (when Face ID enabled) ───
  if (screen === "app" && locked) return (
    <div style={{ padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 20 }}>
      <Avatar sz={88} active />
      <div>
        <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 6 }}>Welcome back{profile?.preferredName ? ", " + profile.preferredName : ""}</h1>
        <p style={{ fontSize: 16, color: C.text2 }}>Harmony is locked for your privacy</p>
      </div>
      <div style={{ width: 76, height: 76, borderRadius: 24, background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginTop: 8 }}>👤</div>
      {unlockError && <p style={{ fontSize: 14, color: C.red }}>{unlockError}</p>}
      <button onClick={authenticateBiometric} style={{ ...bigBtn, maxWidth: 320 }}>👤 Unlock with Face ID</button>
      {unlockTries >= 2 && (
        <button onClick={() => { setLocked(false); }} style={{ ...grayBtn, maxWidth: 320, fontSize: 15, color: C.text2 }}>Having trouble? Continue without</button>
      )}
    </div>
  );

  // ─── PAYWALL (trial expired) ───
  if (screen === "app" && !locked && trialExpired) return (
    <div style={{ padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 16, paddingTop: 30 }}>
        <Avatar sz={84} />
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{t.trialEndedTitle}</h1>
        <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.5, maxWidth: 330 }}>{t.trialEndedBody1} {PRICE} {t.trialEndedBody2}</p>
        <div style={{ ...card, width: "100%", maxWidth: 340, textAlign: "left", marginTop: 8 }}>
          {[t.feat1, t.feat2, t.feat3, t.feat4, t.feat5].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
              <span style={{ color: C.green, fontSize: 17 }}>✓</span>
              <span style={{ fontSize: 15 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ paddingBottom: 40, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={subscribeNow} style={{ ...bigBtn }}>{t.subscribeWord} · {PRICE}{t.perMonth}</button>
        <p style={{ fontSize: 12, color: C.text3, textAlign: "center", lineHeight: 1.5 }}>{t.cancelAnytime} {PRICE}{t.perMonth} {t.afterSubscribing}<br/>{t.secureStripe}</p>
      </div>
    </div>
  );

  // ─── MAIN APP (tabbed) ───
  const alertContact = contacts.find(c => c.id === alertContactId);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 0 }}>
      {/* TALK TAB */}
      {tab === "talk" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.sep}` }}>
            <Avatar sz={44} active={speaking} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 17, fontWeight: 600 }}>Harmony</p>
              <p style={{ fontSize: 13, color: speaking ? C.teal : C.text2 }}>{speaking ? (ui === "es" ? "Hablando…" : "Speaking…") : listening ? (ui === "es" ? "Escuchando…" : "Listening…") : busy ? (ui === "es" ? "Pensando…" : "Thinking…") : (t.hereForYou + " ♡")}</p>
            </div>
            {speaking && <button onClick={stopAudio} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${C.sep}`, background: "transparent", color: C.text2, fontSize: 13, cursor: "pointer" }}>{ui === "es" ? "Detener" : "Stop"}</button>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {msgs.map((m, i) => <Bubble key={i} m={m} speak={speakFn} />)}
            {busy && <Typing />}
            <div ref={bottomRef} />
          </div>
          <div style={{ paddingBottom: 76 }}>
            <ChatBar value={input} setValue={setInput} onSend={sendChat} listen={listen} listening={listening} busy={busy} />
          </div>
        </div>
      )}

      {/* TODAY TAB */}
      {tab === "today" && (
        <Page title={t.todayTitle} sub={new Date().toLocaleDateString(loc, { weekday: "long", month: "long", day: "numeric" })}>
          {!subscribed && daysLeft <= 2 && daysLeft > 0 && (
            <div onClick={() => setTab("settings")} style={{ ...card, marginBottom: 14, background: C.amberSoft, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.amber }}>{ui === "es" ? `${daysLeft} ${daysLeft === 1 ? "día" : "días"} restantes de su prueba` : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in your trial`}</p>
                <p style={{ fontSize: 13, color: C.text2 }}>{cardOnFile ? (ui === "es" ? `Se cobra el ${fmtDate(chargeDate)}` : `Charges ${fmtDate(chargeDate)}`) : (ui === "es" ? "Toque para conservar Harmony" : "Tap to keep Harmony")} ›</p>
              </div>
            </div>
          )}
          {/* Check-in card */}
          <div style={{ ...card, marginBottom: 14, background: checkedInToday ? C.greenSoft : C.card }}>
            {checkedInToday ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✓</div>
                <div><p style={{ fontSize: 18, fontWeight: 600 }}>{t.checkedInTitle}</p><p style={{ fontSize: 14, color: C.text2 }}>{t.checkedInSub}</p></div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{t.howAreYou}</p>
                <p style={{ fontSize: 14, color: C.text2, marginBottom: 16 }}>{t.howAreYouSub}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[{ e: "😊", m: "Great", c: C.green }, { e: "🙂", m: "Okay", c: C.teal }, { e: "😟", m: "Not great", c: C.amber }].map(o => (
                    <button key={o.m} onClick={() => doCheckIn(o.m)} style={{ padding: "16px 8px", borderRadius: 14, border: `1.5px solid ${C.sep}`, background: C.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 32 }}>{o.e}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: o.c }}>{moodLabel(o.m)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Medications */}
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: meds.length ? 14 : 0 }}>
              <p style={{ fontSize: 18, fontWeight: 600 }}>💊 {t.meds}</p>
              <button onClick={() => setScreen("manageMeds")} style={{ fontSize: 14, color: C.teal, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>{meds.length ? t.edit : t.add}</button>
            </div>
            {meds.length === 0 ? (
              <p style={{ fontSize: 14, color: C.text2 }}>{ui === "es" ? "Aún no hay medicamentos" : "No medications added yet"}</p>
            ) : meds.sort((a, b) => a.time - b.time).map(med => {
              const taken = medTakenToday(med.id);
              return (
                <div key={med.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${C.sep}` }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 500, textDecoration: taken ? "line-through" : "none", color: taken ? C.text2 : C.text }}>{med.name}</p>
                    <p style={{ fontSize: 13, color: C.text2 }}>{fmtTime(med.time)}</p>
                  </div>
                  {taken ? (
                    <span style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>✓ {t.takenWord}</span>
                  ) : (
                    <button onClick={() => logMed(med, true)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: C.teal, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{t.markTaken}</button>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={() => setTab("talk")} style={{ ...bigBtn, background: C.tealSoft, color: C.teal }}>💬 Talk to Harmony</button>
        </Page>
      )}

      {/* HELP TAB */}
      {tab === "help" && (
        <Page title="Help" sub="Reach your loved ones anytime">
          <a href="tel:911" style={{ ...bigBtn, background: C.red, display: "block", textAlign: "center", textDecoration: "none", marginBottom: 14, fontSize: 20 }}>🆘 Call 911</a>
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: contacts.length ? 14 : 0 }}>
              <p style={{ fontSize: 18, fontWeight: 600 }}>Trusted contacts</p>
              <button onClick={() => setScreen("manageContacts")} style={{ fontSize: 14, color: C.teal, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>{contacts.length ? "Edit" : "Add"}</button>
            </div>
            {contacts.length === 0 ? <p style={{ fontSize: 14, color: C.text2 }}>No contacts added yet</p> : contacts.map(c => (
              <a key={c.id} href={`tel:${c.phone}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: `1px solid ${C.sep}`, textDecoration: "none", color: C.text }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: C.teal }}>{c.name[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}><p style={{ fontSize: 16, fontWeight: 500 }}>{c.name}</p><p style={{ fontSize: 13, color: C.text2 }}>{c.relation}</p></div>
                <span style={{ fontSize: 22 }}>📞</span>
              </a>
            ))}
          </div>
        </Page>
      )}

      {/* FAMILY TAB */}
      {tab === "family" && (
        familyUnlocked ? (
          <Page title={t.familyDashTitle} sub={ui === "es" ? `Cómo está ${profile?.preferredName || profile?.name || "su ser querido"}` : `How ${profile?.preferredName || profile?.name || "your loved one"} is doing`}>
            {/* Today status */}
            <div style={{ ...card, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>{t.todayTitle}</p>
              <Row label={t.dailyCheckin} value={checkedInToday ? `✓ ${moodLabel(checkins.filter(c => new Date(c.ts).toISOString().slice(0,10)===todayKey()).slice(-1)[0]?.mood) || t.doneWord}` : t.notYet} good={checkedInToday} />
              <Row label={t.meds} value={meds.length ? `${meds.filter(m => medTakenToday(m.id)).length}/${meds.length} ${t.takenOf}` : t.noneSet} good={meds.length > 0 && meds.every(m => medTakenToday(m.id))} />
              <Row label={t.talkedToHarmony} value={activity.some(a => a.type === "mood" && new Date(a.ts).toISOString().slice(0,10)===todayKey()) ? `${t.yesWord} ✓` : t.notYet} good={activity.some(a => (a.type==="mood"||a.type==="checkin") && new Date(a.ts).toISOString().slice(0,10)===todayKey())} last />
            </div>

            {/* 7-day check-in calendar */}
            <div style={{ ...card, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>{t.last7days}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {[6,5,4,3,2,1,0].map(d => {
                  const date = new Date(); date.setDate(date.getDate() - d);
                  const key = date.toISOString().slice(0, 10);
                  const did = checkins.some(c => new Date(c.ts).toISOString().slice(0,10) === key);
                  return (
                    <div key={d} style={{ textAlign: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: did ? C.green : C.bg, color: did ? "#fff" : C.text3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 4, border: did ? "none" : `1.5px solid ${C.sep}` }}>{did ? "✓" : "·"}</div>
                      <span style={{ fontSize: 11, color: C.text2 }}>{date.toLocaleDateString(undefined, { weekday: "short" }).slice(0,1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly AI summary */}
            <div style={{ ...card, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.weeklyTitle}</p>
                <button onClick={genWeeklySummary} style={{ fontSize: 13, color: C.teal, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>↻ {t.generateWord}</button>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: weeklySummary ? C.text : C.text2 }}>{weeklySummary || t.weeklyPlaceholder}</p>
            </div>

            {/* Recent activity */}
            <div style={{ ...card, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14 }}>{t.recentActivity}</p>
              {activity.slice(-8).reverse().map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i ? `1px solid ${C.sep}` : "none" }}>
                  <span style={{ fontSize: 18 }}>{a.type === "checkin" ? "✓" : a.type === "medication" ? "💊" : a.type === "mood" ? "💬" : a.type === "alert" ? "⚠️" : "•"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: a.type === "alert" ? C.red : C.text }}>{a.detail}{a.mood ? ` · ${a.mood}` : ""}</p>
                    <p style={{ fontSize: 12, color: C.text2 }}>{new Date(a.ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <p style={{ fontSize: 14, color: C.text2 }}>{t.noActivity}</p>}
            </div>

            <button onClick={() => { setFamilyUnlocked(false); setTab("talk"); }} style={{ ...grayBtn, fontSize: 15 }}>{t.backToHarmony}</button>
          </Page>
        ) : (
          <Page title={t.familyAccessTitle} sub={t.familyAccessSub}>
            <div style={{ ...card, textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>👨‍👩‍👧</div>
              <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{t.viewDashTitle}</p>
              <p style={{ fontSize: 14, color: C.text2, marginBottom: 20, lineHeight: 1.5 }}>{t.viewDashSub}</p>
              <button onClick={() => setFamilyUnlocked(true)} style={{ ...bigBtn }}>{t.openDashBtn}</button>
              <p style={{ fontSize: 12, color: C.text3, marginTop: 14 }}>{t.familyPinNote}</p>
            </div>
          </Page>
        )
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && (
        <Page title={t.settings}>
          {/* Language */}
          <div style={{ ...card, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>🌐 {t.language}</span>
            <LangToggle ui={ui} onToggle={toggleLang} />
          </div>
          {/* Subscription status */}
          <div style={{ ...card, marginBottom: 14, background: subscribed ? C.greenSoft : (daysLeft <= 2 ? C.amberSoft : C.tealSoft) }}>
            {subscribed ? (
              <>
                <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>{ui === "es" ? "✓ Suscrito" : "✓ Subscribed"}</p>
                <p style={{ fontSize: 14, color: C.text2 }}>{ui === "es" ? `${PRICE}/mes · se renueva el ${fmtDate(chargeDate)}. Gracias por confiar en Harmony.` : `${PRICE}/month · renews ${fmtDate(chargeDate)}. Thank you for trusting Harmony.`}</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>{ui === "es" ? `${daysLeft} ${daysLeft === 1 ? "día" : "días"} restantes de su prueba gratis` : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in your free trial`}</p>
                <p style={{ fontSize: 14, color: C.text2, marginBottom: 12, lineHeight: 1.5 }}>
                  {cardOnFile
                    ? (ui === "es" ? `Se cobrará ${PRICE} a su tarjeta el ${fmtDate(chargeDate)}. Le avisaremos 2 días antes, el ${fmtDate(reminderDate)}. Cancele antes sin costo.` : `Your card will be charged ${PRICE} on ${fmtDate(chargeDate)}. We'll remind you 2 days before, on ${fmtDate(reminderDate)}. Cancel anytime before then for free.`)
                    : (ui === "es" ? `Agregue una tarjeta para conservar Harmony después de su prueba. No se le cobrará hasta el ${fmtDate(chargeDate)}, y le avisaremos 2 días antes.` : `Add a card now to keep Harmony after your trial. You won't be charged until ${fmtDate(chargeDate)}, and we'll remind you 2 days before.`)}
                </p>
                {!cardOnFile
                  ? <button onClick={addCardForTrial} style={{ ...bigBtn }}>{ui === "es" ? `Agregar tarjeta · se cobra ${fmtDate(chargeDate)}` : `Add card · charged ${fmtDate(chargeDate)}`}</button>
                  : <button onClick={subscribeNow} style={{ ...bigBtn }}>{t.orSubscribe.replace(/^Or s/, "S").replace(/^O s/, "S")} · {PRICE}{t.perMonth}</button>}
              </>
            )}
          </div>
          <div style={{ ...card, marginBottom: 14, padding: 0, overflow: "hidden" }}>
            <SettingRow icon="🎙" label={t.rowVoice} onClick={() => setScreen("setupVoice")} />
            <SettingRow icon="💊" label={t.rowMeds} onClick={() => setScreen("manageMeds")} />
            <SettingRow icon="📞" label={t.rowContacts} onClick={() => setScreen("manageContacts")} />
            <SettingRow icon="⏰" label={`${t.rowCheckinTime} · ${fmtTime(checkInTime)}`} onClick={() => setScreen("checkinTime")} last />
          </div>
          <div style={{ ...card, marginBottom: 14, padding: 0, overflow: "hidden" }}>
            <SettingRow icon="🔄" label={t.rowSwitchRole} onClick={switchRole} last />
          </div>
          {/* Family code to share */}
          <div style={{ ...card, marginBottom: 14, textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>👨‍👩‍👧 {ui === "es" ? "Código de familia" : "Family Code"}</p>
            <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.15em", color: C.teal, marginBottom: 8 }}>{store.get("hm_family_code") || "------"}</p>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{ui === "es" ? "Comparta esto con su familia. Lo escriben en su app de Harmony para ver cómo está usted y recibir avisos si no se registra." : "Share this with family. They enter it in their Harmony app to see how you're doing and get alerts if you miss a check-in."}</p>
          </div>
          {/* What the senior shares */}
          <div style={{ ...card, marginBottom: 14, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px 4px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.whatYouShare}</p>
              <p style={{ fontSize: 13, color: C.text2, marginTop: 4, lineHeight: 1.5 }}>{t.whatYouShareSub}</p>
            </div>
            <ToggleRow icon="✅" label={t.dailyCheckin} sub={t.shareCheckinsSub} on={share.checkins} onToggle={(v) => setShareKey("checkins", v)} />
            <ToggleRow icon="💊" label={t.meds} sub={t.shareMedsSub} on={share.meds} onToggle={(v) => setShareKey("meds", v)} />
            <ToggleRow icon="💬" label={t.activityChats} sub={t.shareActivitySub} on={share.activity} onToggle={(v) => setShareKey("activity", v)} last />
          </div>
          {/* Face ID toggle */}
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>👤</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 500 }}>{ui === "es" ? "Desbloqueo facial" : "Face Unlock"}</p>
                <p style={{ fontSize: 13, color: C.text2 }}>{!biometricSupported ? (ui === "es" ? "No disponible en este dispositivo" : "Not available on this device") : faceIdEnabled ? (ui === "es" ? "Activado — Harmony se bloquea al cerrar" : "On — Harmony locks when closed") : (ui === "es" ? "Desactivado — abre sin bloqueo" : "Off — open without unlocking")}</p>
              </div>
              <button
                onClick={async () => { if (faceIdEnabled) { disableFaceId(); } else { await registerBiometric(); } }}
                disabled={!biometricSupported}
                style={{ width: 52, height: 31, borderRadius: 16, border: "none", background: faceIdEnabled ? C.green : C.sep, position: "relative", cursor: biometricSupported ? "pointer" : "not-allowed", opacity: biometricSupported ? 1 : 0.4, transition: "background .2s" }}
              >
                <span style={{ position: "absolute", top: 2, left: faceIdEnabled ? 23 : 2, width: 27, height: 27, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </button>
            </div>
          </div>
          <div style={{ ...card, marginBottom: 14 }}>
            <p style={{ fontSize: 14, color: C.text2, marginBottom: 6 }}>{ui === "es" ? "Estado de la voz" : "Voice status"}</p>
            <p style={{ fontSize: 15, fontWeight: 500 }}>{ttsProvider === "elevenlabs" && ttsKey ? (ui === "es" ? "✨ ElevenLabs — voz humana" : "✨ ElevenLabs — human voice") : (ui === "es" ? "Voz integrada del navegador" : "Built-in browser voice")}</p>
          </div>
          <button onClick={reset} style={{ ...grayBtn, color: C.red, fontSize: 15 }}>{t.resetAll}</button>
        </Page>
      )}

      {/* BOTTOM TAB BAR */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.card, borderTop: `1px solid ${C.sep}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom, 8px)", paddingTop: 8, zIndex: 100 }}>
        {[
          { id: "talk", icon: "💬", label: t.tabTalk },
          { id: "today", icon: "☀️", label: t.tabToday },
          { id: "help", icon: "🆘", label: t.tabHelp },
          { id: "family", icon: "👨‍👩‍👧", label: t.tabFamily },
          { id: "settings", icon: "⚙️", label: t.tabSettings },
        ].map(tb => (
          <button key={tb.id} onClick={() => { stopAudio(); setTab(tb.id); if (tb.id !== "talk") setMsgs(m => m); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", opacity: tab === tb.id ? 1 : 0.45 }}>
            <span style={{ fontSize: 22 }}>{tb.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: tab === tb.id ? C.teal : C.text2 }}>{tb.label}</span>
          </button>
        ))}
      </div>

      {/* ─── SUB-SCREENS (modals) ─── */}
      {screen === "manageMeds" && <ManageMeds meds={meds} setMeds={setMeds} onClose={() => setScreen("app")} />}
      {screen === "manageContacts" && <ManageContacts contacts={contacts} setContacts={setContacts} alertContactId={alertContactId} setAlertContactId={setAlertContactId} onClose={() => setScreen("app")} />}
      {screen === "checkinTime" && <CheckinTime value={checkInTime} setValue={setCheckInTime} onClose={() => setScreen("app")} />}
      {screen === "setupVoice" && profile && <VoiceModal {...{ anthropicKey, setAnthropicKey, ttsKey, setTtsKey, ttsProvider, setTtsProvider, ttsVoiceId, setTtsVoiceId, gender, setGender, playEL, playBrowser }} onClose={() => setScreen("app")} />}
    </div>
  );
}

/* ─── Reusable components ─── */
function Bubble({ m, speak }) {
  return (
    <div style={{ marginBottom: 12, display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
      <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: m.role === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px", background: m.role === "user" ? C.teal : C.card, color: m.role === "user" ? "#fff" : C.text, fontSize: 16, lineHeight: 1.5 }}>{m.content}</div>
      {m.role === "assistant" && <button onClick={() => speak.current?.(m.content)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 4, color: C.text2 }}>🔊</button>}
    </div>
  );
}
function Typing() {
  return <div style={{ display: "flex", alignItems: "flex-end" }}><div style={{ padding: "14px 18px", background: C.card, borderRadius: "20px 20px 20px 5px", fontSize: 20, letterSpacing: 3, color: C.text3 }}>•••</div></div>;
}
function ChatBar({ value, setValue, onSend, listen, listening, busy }) {
  return (
    <div style={{ padding: 12, borderTop: `1px solid ${C.sep}`, display: "flex", gap: 8, background: C.bg }}>
      <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && onSend(value)} placeholder="Talk to Harmony…" style={{ flex: 1, padding: "14px 18px", borderRadius: 24, border: `1px solid ${C.sep}`, background: C.card, color: C.text, fontSize: 16, outline: "none" }} />
      <button onClick={listen} style={{ width: 48, height: 48, borderRadius: "50%", border: `1px solid ${listening ? C.red : C.sep}`, background: C.card, color: listening ? C.red : C.text2, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>{listening ? "🔴" : "🎤"}</button>
      <button onClick={() => onSend(value)} disabled={busy || !value.trim()} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: C.teal, color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0, opacity: busy || !value.trim() ? 0.4 : 1 }}>↑</button>
    </div>
  );
}
function Row({ label, value, good, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${C.sep}` }}>
      <span style={{ fontSize: 15, color: C.text2 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: good ? C.green : C.text }}>{value}</span>
    </div>
  );
}
function LangToggle({ ui, onToggle }) {
  return (
    <button onClick={onToggle} aria-label="Language" style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${C.sep}`, borderRadius: 20, overflow: "hidden", background: C.card, cursor: "pointer", padding: 0 }}>
      <span style={{ padding: "6px 13px", fontSize: 13, fontWeight: 600, background: ui === "en" ? C.teal : "transparent", color: ui === "en" ? "#fff" : C.text2 }}>EN</span>
      <span style={{ padding: "6px 13px", fontSize: 13, fontWeight: 600, background: ui === "es" ? C.teal : "transparent", color: ui === "es" ? "#fff" : C.text2 }}>ES</span>
    </button>
  );
}

function ToggleRow({ icon, label, sub, on, onToggle, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: last ? "none" : `1px solid ${C.sep}` }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 16, fontWeight: 500, color: C.text }}>{label}</p>
        {sub && <p style={{ fontSize: 13, color: C.text2, marginTop: 1, lineHeight: 1.4 }}>{sub}</p>}
      </div>
      <button onClick={() => onToggle(!on)} aria-label={label} style={{ width: 52, height: 31, borderRadius: 16, border: "none", background: on ? C.green : C.sep, position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 2, left: on ? 23 : 2, width: 27, height: 27, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </button>
    </div>
  );
}

function SettingRow({ icon, label, onClick, last }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", border: "none", borderBottom: last ? "none" : `1px solid ${C.sep}`, background: "none", cursor: "pointer", color: C.text }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 16, flex: 1, textAlign: "left" }}>{label}</span>
      <span style={{ fontSize: 18, color: C.text3 }}>›</span>
    </button>
  );
}

/* ─── Modal: Manage Medications ─── */
function ManageMeds({ meds, setMeds, onClose }) {
  const [name, setName] = useState("");
  const [hour, setHour] = useState(9);
  const [min, setMin] = useState(0);
  const [ampm, setAmpm] = useState("AM");
  const add = () => {
    if (!name.trim()) return;
    let h = hour % 12; if (ampm === "PM") h += 12;
    const time = h * 60 + min;
    const next = [...meds, { id: Date.now(), name: name.trim(), time }];
    setMeds(next); store.set("hm_meds", next); setName("");
  };
  const remove = (id) => { const next = meds.filter(m => m.id !== id); setMeds(next); store.set("hm_meds", next); };
  return (
    <Modal title="Medications" onClose={onClose}>
      <div style={{ ...card, marginBottom: 14 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Medication name" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 16, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select value={hour} onChange={e => setHour(+e.target.value)} style={selStyle}>{[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
          <select value={min} onChange={e => setMin(+e.target.value)} style={selStyle}>{[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}</select>
          <select value={ampm} onChange={e => setAmpm(e.target.value)} style={selStyle}><option>AM</option><option>PM</option></select>
        </div>
        <button onClick={add} style={{ ...bigBtn }}>+ Add medication</button>
      </div>
      {meds.sort((a, b) => a.time - b.time).map(m => (
        <div key={m.id} style={{ ...card, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}><p style={{ fontSize: 16, fontWeight: 500 }}>{m.name}</p><p style={{ fontSize: 13, color: C.text2 }}>{fmtTime(m.time)}</p></div>
          <button onClick={() => remove(m.id)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.redSoft}`, background: C.redSoft, color: C.red, fontSize: 14, cursor: "pointer" }}>Remove</button>
        </div>
      ))}
    </Modal>
  );
}

/* ─── Modal: Manage Contacts ─── */
function ManageContacts({ contacts, setContacts, alertContactId, setAlertContactId, onClose }) {
  const [n, setN] = useState({ name: "", phone: "", relation: "Family" });
  const add = () => {
    if (!n.name || !n.phone) return;
    const next = [...contacts, { ...n, id: Date.now() }];
    setContacts(next); store.set("hm_contacts", next); setN({ name: "", phone: "", relation: "Family" });
  };
  const remove = (id) => { const next = contacts.filter(c => c.id !== id); setContacts(next); store.set("hm_contacts", next); };
  const setAlert = (id) => { setAlertContactId(id); store.set("hm_alert_contact", id); };
  return (
    <Modal title="Trusted Contacts" onClose={onClose}>
      <div style={{ ...card, marginBottom: 14 }}>
        <input value={n.name} onChange={e => setN(p => ({ ...p, name: e.target.value }))} placeholder="Full name" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 16, marginBottom: 10 }} />
        <input value={n.phone} onChange={e => setN(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" type="tel" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 16, marginBottom: 10 }} />
        <select value={n.relation} onChange={e => setN(p => ({ ...p, relation: e.target.value }))} style={{ ...selStyle, width: "100%", marginBottom: 12 }}>{["Family", "Spouse", "Son", "Daughter", "Grandchild", "Friend", "Neighbor", "Caregiver", "Doctor"].map(r => <option key={r}>{r}</option>)}</select>
        <button onClick={add} style={{ ...bigBtn }}>+ Add contact</button>
      </div>
      {contacts.map(c => (
        <div key={c.id} style={{ ...card, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: C.teal }}>{c.name[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}><p style={{ fontSize: 16, fontWeight: 500 }}>{c.name}</p><p style={{ fontSize: 13, color: C.text2 }}>{c.relation} · {c.phone}</p></div>
            <button onClick={() => remove(c.id)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.redSoft}`, background: C.redSoft, color: C.red, fontSize: 14, cursor: "pointer" }}>✕</button>
          </div>
          <button onClick={() => setAlert(c.id)} style={{ width: "100%", padding: 10, borderRadius: 10, border: `1.5px solid ${alertContactId === c.id ? C.teal : C.sep}`, background: alertContactId === c.id ? C.tealSoft : "transparent", color: alertContactId === c.id ? C.teal : C.text2, fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
            {alertContactId === c.id ? "✓ Receives missed check-in alerts" : "Set as alert contact"}
          </button>
        </div>
      ))}
    </Modal>
  );
}

/* ─── Modal: Check-in time ─── */
function CheckinTime({ value, setValue, onClose }) {
  const h = Math.floor(value / 60), m = value % 60;
  const [hour, setHour] = useState(h % 12 || 12);
  const [min, setMin] = useState(m);
  const [ampm, setAmpm] = useState(h < 12 ? "AM" : "PM");
  const save = () => { let hh = hour % 12; if (ampm === "PM") hh += 12; const t = hh * 60 + min; setValue(t); store.set("hm_checkin_time", t); onClose(); };
  return (
    <Modal title="Daily Check-in Time" onClose={onClose}>
      <div style={{ ...card }}>
        <p style={{ fontSize: 14, color: C.text2, marginBottom: 16, lineHeight: 1.5 }}>Harmony will gently remind your loved one to check in each day at this time. If they don't, the alert contact is notified.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <select value={hour} onChange={e => setHour(+e.target.value)} style={selStyle}>{[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
          <select value={min} onChange={e => setMin(+e.target.value)} style={selStyle}>{[0, 15, 30, 45].map(x => <option key={x} value={x}>{String(x).padStart(2, "0")}</option>)}</select>
          <select value={ampm} onChange={e => setAmpm(e.target.value)} style={selStyle}><option>AM</option><option>PM</option></select>
        </div>
        <button onClick={save} style={{ ...bigBtn }}>Save</button>
      </div>
    </Modal>
  );
}

/* ─── Modal: Voice settings ─── */
function VoiceModal({ anthropicKey, setAnthropicKey, ttsKey, setTtsKey, ttsProvider, setTtsProvider, ttsVoiceId, setTtsVoiceId, gender, setGender, playEL, playBrowser, onClose }) {
  const vlist = EL_VOICES[gender];
  const save = () => { store.set("hm_anthropic", anthropicKey); store.set("hm_tts_provider", ttsKey ? "elevenlabs" : "browser"); store.set("hm_tts_key", ttsKey); store.set("hm_tts_voice", ttsVoiceId); store.set("hm_gender", gender); setTtsProvider(ttsKey ? "elevenlabs" : "browser"); onClose(); };
  return (
    <Modal title="Voice & Keys" onClose={onClose}>
      <div style={{ ...card, marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>🤖 Anthropic Key</p>
        <p style={{ fontSize: 13, color: C.text2, marginBottom: 10 }}>console.anthropic.com → API Keys</p>
        <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-…" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 15 }} />
      </div>
      <div style={{ ...card, marginBottom: 14 }}>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>✨ ElevenLabs Key</p>
        <p style={{ fontSize: 13, color: C.text2, marginBottom: 10 }}>Optional — for a real human voice. Blank = built-in voice.</p>
        <input type="password" value={ttsKey} onChange={e => setTtsKey(e.target.value)} placeholder="sk_…" style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.sep}`, background: C.bg, color: C.text, fontSize: 15, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["female", "male"].map(g => <button key={g} onClick={() => setGender(g)} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1.5px solid ${gender === g ? C.teal : C.sep}`, background: gender === g ? C.tealSoft : "transparent", color: gender === g ? C.teal : C.text, fontSize: 15, fontWeight: 500, cursor: "pointer" }}>{g === "female" ? "Female" : "Male"}</button>)}
        </div>
        {ttsKey ? vlist.map(v => (
          <div key={v.id} onClick={() => setTtsVoiceId(v.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, border: `1.5px solid ${ttsVoiceId === v.id ? C.teal : C.sep}`, background: ttsVoiceId === v.id ? C.tealSoft : "transparent", cursor: "pointer", marginBottom: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${ttsVoiceId === v.id ? C.teal : C.text3}`, background: ttsVoiceId === v.id ? C.teal : "transparent" }} />
            <span style={{ fontSize: 15, fontWeight: 500 }}>{v.name}</span><span style={{ fontSize: 13, color: C.text2 }}>{v.desc}</span>
            <button onClick={e => { e.stopPropagation(); playEL("Hello! I'm Harmony. I'm so happy to see you.", ttsKey, v.id); }} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 10, border: `1px solid ${C.teal}`, background: "transparent", color: C.teal, fontSize: 13, cursor: "pointer" }}>▶</button>
          </div>
        )) : <button onClick={() => playBrowser("Hello! I'm Harmony, your caring companion.")} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${C.sep}`, background: "transparent", color: C.text2, fontSize: 14, cursor: "pointer" }}>▶ Preview built-in voice</button>}
      </div>
      <button onClick={save} style={{ ...bigBtn }}>Save</button>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 200, overflowY: "auto", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ position: "sticky", top: 0, background: C.bg, padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{title}</h1>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: C.card, color: C.text2, fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ padding: "8px 16px 40px" }}>{children}</div>
    </div>
  );
}

const selStyle = { flex: 1, padding: 14, borderRadius: 12, border: `1px solid var(--sep)`, background: "var(--bg)", color: "var(--text)", fontSize: 16, cursor: "pointer" };

const EL_VOICES_REF = EL_VOICES; // keep reference

const selStyle = { flex: 1, padding: 14, borderRadius: 12, border: `1px solid var(--sep)`, background: "var(--bg)", color: "var(--text)", fontSize: 16, cursor: "pointer" };

const EL_VOICES_REF = EL_VOICES; // keep reference
