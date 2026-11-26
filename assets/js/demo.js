/* ==========================================================================
   demo.js — סביבת הדגמה
   --------------------------------------------------------------------------
   מאפשרת להתנסות בזרימה המלאה לפני חיבור מסד נתונים אמיתי:
   משתמש נרשם → מבקש כרטיסייה → המנהל מאשר → ניקוב כניסות.

   הכול נשמר מקומית במפתח נפרד, לא נכנס לקובץ הפרסום ולא עולה לאינטרנט.
   מבנה הנתונים כאן מתוכנן כך שיעבור כמעט כמו שהוא לטבלאות ב-Supabase.

   הסיסמאות כאן נשמרות כטקסט גלוי. זה מקובל לסביבת הדגמה בלבד —
   באמת־אמת האימות ייעשה בצד השרת.
   ========================================================================== */

const Demo = (() => {
  const KEY = 'etz_demo_v1';
  const SESSION = 'etz_demo_user';

  let db = null;
  const listeners = new Set();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const empty = () => ({ on: false, users: [], cards: [], visits: [], purchases: [] });

  /* ---------- אחסון ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? { ...empty(), ...JSON.parse(raw) } : empty();
    } catch (e) { db = empty(); }
    return db;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { throw new Error('האחסון במכשיר מלא.'); }
    listeners.forEach(fn => { try { fn(); } catch (e) {} });
  }
  const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };

  const isOn = () => !!(db && db.on);
  function setOn(v) { db.on = !!v; save(); }

  /* ---------- משתמשים ---------- */
  const users = () => db.users;
  const findUser = id => db.users.find(u => u.id === id) || null;
  const byEmail = em => db.users.find(u => u.email.toLowerCase() === String(em).toLowerCase()) || null;

  function register({ name, email, password, phone, isMinor, guardianName }) {
    if (!name || !name.trim()) throw new Error('צריך שם מלא');
    if (!/^\S+@\S+\.\S+$/.test(email || '')) throw new Error('כתובת אימייל לא תקינה');
    if (!password || password.length < 6) throw new Error('הסיסמה צריכה להיות באורך 6 תווים לפחות');
    if (byEmail(email)) throw new Error('כבר קיים משתמש עם האימייל הזה');
    if (isMinor && !(guardianName || '').trim()) throw new Error('למשתמש מתחת לגיל 18 צריך שם של הורה או אפוטרופוס');

    const u = {
      id: uid(), name: name.trim(), email: email.trim(), password,
      phone: (phone || '').trim(),
      isMinor: !!isMinor, guardianName: (guardianName || '').trim(),
      safetySignedAt: null, safetySignature: null, safetySignedBy: null,
      createdAt: new Date().toISOString()
    };
    db.users.unshift(u);
    save();
    setCurrent(u.id);
    return u;
  }

  function login(email, password) {
    const u = byEmail(email);
    if (!u || u.password !== password) throw new Error('אימייל או סיסמה שגויים');
    setCurrent(u.id);
    return u;
  }

  /** התחברות מהירה — מדמה את הכפתור של גוגל, בלי OAuth אמיתי */
  function quickLogin(id) { setCurrent(id); return findUser(id); }

  const setCurrent = id => { try { sessionStorage.setItem(SESSION, id); } catch (e) {} };
  const logout = () => { try { sessionStorage.removeItem(SESSION); } catch (e) {} listeners.forEach(f => f()); };
  function current() {
    try { return findUser(sessionStorage.getItem(SESSION)); } catch (e) { return null; }
  }

  function signSafety(userId, signatureDataUrl, signedBy) {
    const u = findUser(userId);
    if (!u) throw new Error('משתמש לא נמצא');
    u.safetySignature = signatureDataUrl;
    u.safetySignedAt = new Date().toISOString();
    u.safetySignedBy = signedBy || u.name;
    save();
    return u;
  }

  /* ---------- בקשות רכישה ---------- */

  function requestPurchase(userId, plan) {
    const p = {
      id: uid(), userId,
      planName: plan.name, price: Number(plan.price) || 0,
      kind: plan.kind || kindOf(plan.name),
      entries: plan.entries ?? entriesOf(plan.name),
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    db.purchases.unshift(p);
    save();
    return p;
  }

  /** מנחש את סוג המסלול מהשם, כדי שהמנהל לא יצטרך להגדיר שדה נוסף */
  function kindOf(name) {
    const n = String(name);
    if (n.includes('ביטוח')) return 'insurance';
    if (n.includes('מנוי')) return 'unlimited';
    return 'punch';
  }
  function entriesOf(name) {
    const m = String(name).match(/(\d+)\s*כניסות/);
    if (m) return Number(m[1]);
    return String(name).includes('בודדת') ? 1 : 0;
  }

  const pendingPurchases = () => db.purchases.filter(p => p.status === 'pending');

  /** אישור הבקשה הופך אותה לכרטיסייה פעילה */
  function approvePurchase(id) {
    const p = db.purchases.find(x => x.id === id);
    if (!p || p.status !== 'pending') return null;
    p.status = 'approved';
    p.approvedAt = new Date().toISOString();

    const until = new Date();
    if (p.kind === 'unlimited')      until.setMonth(until.getMonth() + 1);
    else if (p.kind === 'insurance') until.setFullYear(until.getFullYear() + 1);
    else                             until.setFullYear(until.getFullYear() + 1);

    const card = {
      id: uid(), userId: p.userId, purchaseId: p.id,
      name: p.planName, kind: p.kind,
      total: p.kind === 'punch' ? p.entries : null,
      used: 0,
      validUntil: until.toISOString().slice(0, 10),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    db.cards.unshift(card);
    save();
    return card;
  }

  function declinePurchase(id) {
    const p = db.purchases.find(x => x.id === id);
    if (p) { p.status = 'declined'; save(); }
  }

  /* ---------- כרטיסיות וכניסות ---------- */

  const cardsOf = userId => db.cards.filter(c => c.userId === userId);
  const today = () => new Date().toISOString().slice(0, 10);

  function isValid(c) {
    if (c.status !== 'active') return false;
    if (c.validUntil && c.validUntil < today()) return false;
    if (c.kind === 'punch') return (c.total - c.used) > 0;
    return true;
  }

  /** הכרטיסייה שתנוקב בכניסה הבאה. מנוי קודם לכרטיסייה. */
  function activeCard(userId) {
    const all = cardsOf(userId).filter(isValid);
    return all.find(c => c.kind === 'unlimited') || all.find(c => c.kind === 'punch') || null;
  }

  const insurance = userId => cardsOf(userId).find(c => c.kind === 'insurance' && isValid(c)) || null;
  const entriesLeft = userId => cardsOf(userId)
    .filter(c => c.kind === 'punch' && isValid(c))
    .reduce((s, c) => s + (c.total - c.used), 0);

  /** ניקוב כניסה. מחזיר מה קרה ואילו התראות להציג. */
  function punch(userId) {
    const u = findUser(userId);
    if (!u) return { ok: false, msg: 'משתמש לא נמצא' };

    const card = activeCard(userId);
    if (!card) return { ok: false, msg: 'אין כרטיסייה או מנוי בתוקף', alerts: alertsFor(userId) };

    if (card.kind === 'punch') {
      card.used += 1;
      if (card.used >= card.total) card.status = 'used-up';
    }
    db.visits.unshift({ id: uid(), userId, cardId: card.id, at: new Date().toISOString() });
    save();

    return {
      ok: true,
      card,
      msg: card.kind === 'unlimited'
        ? 'מנוי בתוקף — הכניסה נרשמה'
        : `נוקבה כניסה. נשארו ${card.total - card.used}`,
      alerts: alertsFor(userId)
    };
  }

  /** ההתראות שמוצגות גם למשתמש וגם במסך הסריקה */
  function alertsFor(userId) {
    const out = [];
    const u = findUser(userId);
    if (!u) return out;

    if (!u.safetySignedAt) out.push({ level: 'stop', text: 'חסרה חתימה על טופס הבטיחות' });

    const ins = insurance(userId);
    if (!ins) out.push({ level: 'warn', text: 'אין ביטוח בתוקף' });
    else {
      const days = Math.round((new Date(ins.validUntil) - new Date()) / 86400000);
      if (days <= 30) out.push({ level: 'warn', text: `הביטוח פג בעוד ${days} ימים` });
    }

    const sub = cardsOf(userId).find(c => c.kind === 'unlimited' && isValid(c));
    if (sub) {
      const days = Math.round((new Date(sub.validUntil) - new Date()) / 86400000);
      if (days <= 7) out.push({ level: 'warn', text: `המנוי מסתיים בעוד ${days} ימים` });
    } else {
      const left = entriesLeft(userId);
      if (left === 0) out.push({ level: 'stop', text: 'הכרטיסייה הסתיימה' });
      else if (left === 1) out.push({ level: 'warn', text: 'נשארה כניסה אחת אחרונה' });
    }
    return out;
  }

  const visitsOf = userId => db.visits.filter(v => v.userId === userId);

  /* ---------- זרעים ואיפוס ---------- */

  const SEED = [
    { name: 'רונית אבידן',  email: 'ronit@demo.test',  phone: '050-1112233', plan: 'כרטיסיית 10 כניסות', used: 8, signed: true,  insured: true  },
    { name: 'יואב פרץ',     email: 'yoav@demo.test',   phone: '052-4445566', plan: 'מנוי ללא הגבלה',     used: 0, signed: true,  insured: true  },
    { name: 'מיכל ברנע',    email: 'michal@demo.test', phone: '054-7778899', plan: 'כרטיסיית 5 כניסות',  used: 4, signed: true,  insured: false },
    { name: 'דניאל שגב',    email: 'daniel@demo.test', phone: '053-2223344', plan: null,                 used: 0, signed: false, insured: false },
    { name: 'נועה כץ',      email: 'noa@demo.test',    phone: '058-6667788', plan: 'כרטיסיית 10 כניסות', used: 9, signed: true,  insured: true, minor: true, guardian: 'אורית כץ' }
  ];

  /** בונה חמישה משתמשים במצבים שונים, כדי לראות את כל ההתראות */
  function seed() {
    SEED.forEach(s => {
      if (byEmail(s.email)) return;
      const u = {
        id: uid(), name: s.name, email: s.email, password: 'demo123',
        phone: s.phone, isMinor: !!s.minor, guardianName: s.guardian || '',
        safetySignedAt: s.signed ? new Date(Date.now() - 86400000 * 20).toISOString() : null,
        safetySignature: null,
        safetySignedBy: s.signed ? (s.minor ? s.guardian : s.name) : null,
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
      };
      db.users.push(u);

      if (s.plan) {
        const until = new Date();
        until.setMonth(until.getMonth() + (s.plan.includes('מנוי') ? 1 : 10));
        const kind = kindOf(s.plan), total = entriesOf(s.plan);
        db.cards.push({
          id: uid(), userId: u.id, name: s.plan, kind,
          total: kind === 'punch' ? total : null, used: s.used,
          validUntil: until.toISOString().slice(0, 10),
          status: 'active', createdAt: u.createdAt
        });
        for (let i = 0; i < s.used; i++) {
          db.visits.push({ id: uid(), userId: u.id, at: new Date(Date.now() - 86400000 * (i + 2)).toISOString() });
        }
      }

      if (s.insured) {
        const until = new Date();
        until.setDate(until.getDate() + (s.name === 'רונית אבידן' ? 20 : 300));
        db.cards.push({
          id: uid(), userId: u.id, name: 'ביטוח תאונות אישיות', kind: 'insurance',
          total: null, used: 0, validUntil: until.toISOString().slice(0, 10),
          status: 'active', createdAt: u.createdAt
        });
      }
    });

    // בקשה ממתינה אחת, כדי שיהיה מה לאשר
    const d = byEmail('daniel@demo.test');
    if (d && !db.purchases.some(p => p.userId === d.id)) {
      db.purchases.unshift({
        id: uid(), userId: d.id, planName: 'כרטיסיית 5 כניסות',
        price: 400, kind: 'punch', entries: 5, status: 'pending',
        requestedAt: new Date().toISOString()
      });
    }
    save();
    return db.users.length;
  }

  function reset() {
    const on = db.on;
    db = empty();
    db.on = on;
    try { sessionStorage.removeItem(SESSION); } catch (e) {}
    save();
  }

  /* ---------- קוד QR ----------
     מטריצה פשוטה שמקודדת את מזהה המשתמש. לא תקן QR מלא —
     מספיק כדי לראות את הזרימה. בגרסה האמיתית תהיה ספריית QR.
     ------------------------------------------------------------------ */

  function codeMatrix(text, size = 21) {
    // גיבוב יציב, כדי שאותו משתמש יקבל תמיד אותה תבנית
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    const cells = [];
    let x = h >>> 0;
    for (let i = 0; i < size * size; i++) {
      x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
      cells.push(x & 1);
    }
    // ריבועי עיגון בשלוש פינות, כמו ב-QR אמיתי
    const anchor = (r0, c0) => {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[(r0 + r) * size + (c0 + c)] = (edge || core) ? 1 : 0;
      }
    };
    anchor(0, 0); anchor(0, size - 7); anchor(size - 7, 0);
    return { size, cells };
  }

  function codeSvg(text, px = 220) {
    const { size, cells } = codeMatrix(text);
    const s = px / size;
    let rects = '';
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (cells[r * size + c]) rects += `<rect x="${(c * s).toFixed(2)}" y="${(r * s).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" role="img" aria-label="קוד הזיהוי שלי">
      <rect width="${px}" height="${px}" fill="#fff"/><g fill="#21241F">${rects}</g></svg>`;
  }

  return {
    load, save, onChange, isOn, setOn,
    users, findUser, byEmail, register, login, quickLogin, logout, current, signSafety,
    requestPurchase, pendingPurchases, approvePurchase, declinePurchase,
    cardsOf, activeCard, insurance, entriesLeft, isValid, punch, alertsFor, visitsOf,
    purchases: () => db.purchases,
    seed, reset, codeSvg,
    get db() { return db; }
  };
})();
