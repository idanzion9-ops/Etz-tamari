/* ==========================================================================
   store.js — שכבת הנתונים של עץ תמרי
   --------------------------------------------------------------------------
   שני מקורות:
   1. assets/data/content.json  — התוכן המפורסם. זה מה שכל מבקר רואה.
   2. localStorage              — שכבת עריכה מקומית של המנהל + נתוני המבקר.

   המנהל עורך → נשמר מקומית → לוחץ "פרסום" → יורד content.json מעודכן
   שאותו מעלים ל-GitHub. משם זה חי לכולם.
   ========================================================================== */

const Store = (() => {
  const CONTENT_KEY = 'etz_content_draft_v1';   // טיוטת המנהל
  const LOCAL_KEY   = 'etz_visitor_v1';         // עגלה, מועדפים, בקשות של המבקר
  const SESSION_KEY = 'etz_admin_open';

  let content = null;
  let local = null;
  const listeners = new Set();

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const emptyContent = () => ({
    v: 1,
    updatedAt: null,
    site: {
      name: 'עץ תמרי',
      tagline: 'נגרות · יצירה · קהילה',
      heroTitle: 'מרחב לעבוד בו <em>עם הידיים</em>',
      heroText: 'נגריה פתוחה לקהילה: סדנאות חד־פעמיות, חוגים מתמשכים ושעות עבודה חופשיות. בלי ניסיון קודם, עם הרבה נסורת.',
      heroEmoji: '🪵',
      stats: [
        { n: '6', l: 'עמדות עבודה' },
        { n: '12+', l: 'סדנאות בשנה' },
        { n: '8-99', l: 'טווח גילאים' }
      ],
      aboutTitle: 'הסיפור של עץ תמרי',
      aboutImage: '',
      aboutHtml: '<p>עץ תמרי הוא מרחב נגרות שנפתח לקהילה — מקום להיכנס אליו, להרים כלי, ולצאת עם משהו שעשית בעצמך.</p><p>המקום הוקם לזכרה של תמר קדם סימן טוב ז״ל, וממשיך את העשייה, החיבור לקהילה והאור שהיא הביאה.</p>',
      hours: [
        { d: 'ראשון–חמישי', t: '09:00–20:00' },
        { d: 'שישי', t: '09:00–13:00' },
        { d: 'שבת', t: 'סגור' }
      ],
      contact: { phone: '', whatsapp: '', email: '', address: '', instagram: '', facebook: '' },
      bookingSlots: ['09:00', '11:00', '13:00', '16:00', '18:00', '20:00'],
      pin: '2580'
    },
    workshops: [],
    classes: [],
    projects: [],
    moments: [],
    memorial: null,
    products: [],
    events: [],
    participants: [],
    inventory: [],
    finance: [],
    tasks: [],
    registrations: [],
    orders: []
  });

  const emptyLocal = () => ({ cart: [], favs: [], myRequests: [], myOrders: [], progress: {}, me: { name: '', phone: '', email: '' } });

  /* ---------- שמירה וטעינה ---------- */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('קריאת נתונים נכשלה:', key, e);
      return fallback;
    }
  }

  function writeJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.warn('שמירת נתונים נכשלה:', key, e);
      return false;
    }
  }

  /** מיזוג רדוד־עמוק: מה שחסר בטיוטה מושלם מברירת המחדל */
  function merge(base, over) {
    if (!over || typeof over !== 'object') return base;
    const out = Array.isArray(base) ? base.slice() : { ...base };
    for (const k of Object.keys(over)) {
      const b = base?.[k], o = over[k];
      out[k] = (b && o && typeof b === 'object' && typeof o === 'object' && !Array.isArray(o))
        ? merge(b, o) : o;
    }
    return out;
  }

  async function init() {
    const base = emptyContent();
    let published = null;
    try {
      const res = await fetch('assets/data/content.json?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) published = await res.json();
    } catch (e) {
      console.info('אין content.json מפורסם — נטען תוכן ברירת מחדל.');
    }
    const draft = readJSON(CONTENT_KEY, null);
    content = merge(merge(base, published || {}), draft || {});
    local = merge(emptyLocal(), readJSON(LOCAL_KEY, null));
    return content;
  }

  /**
   * שומר ומוודא. חלק מהדפדפנים לא זורקים כשהאחסון מלא — הם פשוט
   * לא כותבים. לכן קוראים את הערך בחזרה ומשווים, ולא סומכים על ההצלחה.
   */
  function saveContent() {
    const stamp = new Date().toISOString();
    content.updatedAt = stamp;

    let wrote = writeJSON(CONTENT_KEY, content);
    if (wrote) {
      try {
        const back = JSON.parse(localStorage.getItem(CONTENT_KEY) || '{}');
        if (back.updatedAt !== stamp) wrote = false;
      } catch (e) { wrote = false; }
    }

    listeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });

    if (!wrote) {
      const kb = Math.round(JSON.stringify(content).length / 1024);
      throw new Error(`השמירה נכשלה — האחסון במכשיר מלא (${kb}KB). מחקו תמונות מהגלריה, או ייצאו גיבוי ואפסו.`);
    }
    return stamp;
  }

  function saveLocal() {
    writeJSON(LOCAL_KEY, local);
    listeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
  }

  const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };

  /* ---------- CRUD גנרי על אוספים ---------- */

  function list(coll) { return content[coll] || (content[coll] = []); }

  function upsert(coll, item) {
    const arr = list(coll);
    if (item.id) {
      const i = arr.findIndex(x => x.id === item.id);
      if (i > -1) { arr[i] = { ...arr[i], ...item }; saveContent(); return arr[i]; }
    }
    const rec = { ...item, id: item.id || uid(), createdAt: item.createdAt || new Date().toISOString() };
    arr.unshift(rec);
    saveContent();
    return rec;
  }

  function remove(coll, id) {
    content[coll] = list(coll).filter(x => x.id !== id);
    saveContent();
  }

  const find = (coll, id) => list(coll).find(x => x.id === id) || null;

  /* ---------- צד המבקר ---------- */

  function cartAdd(product, qty = 1) {
    const line = local.cart.find(l => l.id === product.id);
    if (line) line.qty += qty;
    else local.cart.push({ id: product.id, name: product.name, price: Number(product.price) || 0, qty });
    saveLocal();
  }
  function cartSet(id, qty) {
    if (qty <= 0) local.cart = local.cart.filter(l => l.id !== id);
    else { const l = local.cart.find(x => x.id === id); if (l) l.qty = qty; }
    saveLocal();
  }
  const cartCount = () => local.cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = () => local.cart.reduce((s, l) => s + l.price * l.qty, 0);
  const cartClear = () => { local.cart = []; saveLocal(); };

  function favToggle(id) {
    const i = local.favs.indexOf(id);
    if (i > -1) local.favs.splice(i, 1); else local.favs.push(id);
    saveLocal();
    return local.favs.includes(id);
  }
  const isFav = id => local.favs.includes(id);

  /**
   * בקשת הרשמה. נשמרת על המכשיר של המבקר בלבד — לעולם לא בטיוטת התוכן.
   * (אחרת כל מבקר שנרשם היה מקבע אצלו עותק ישן של האתר.)
   * הבקשה מגיעה למנהל דרך וואטסאפ/מייל, לא דרך הקובץ.
   */
  function addRequest(req) {
    const rec = { ...req, id: uid(), status: 'new', createdAt: new Date().toISOString() };
    local.myRequests.unshift(rec);
    saveLocal();
    return rec;
  }

  /** הזמנה מהחנות — גם היא מקומית בלבד */
  function addOrder(order) {
    const rec = { ...order, id: uid(), status: 'new', createdAt: new Date().toISOString() };
    (local.myOrders || (local.myOrders = [])).unshift(rec);
    saveLocal();
    return rec;
  }

  /* ---------- התקדמות בפרויקטון (מקומית לכל מכשיר) ---------- */

  const progressOf = id => (local.progress && local.progress[id]) || [];

  function toggleStep(projectId, stepIndex) {
    if (!local.progress) local.progress = {};
    const done = new Set(local.progress[projectId] || []);
    done.has(stepIndex) ? done.delete(stepIndex) : done.add(stepIndex);
    local.progress[projectId] = Array.from(done).sort((a, b) => a - b);
    saveLocal();
    return local.progress[projectId];
  }

  function resetProgress(projectId) {
    if (local.progress) delete local.progress[projectId];
    saveLocal();
  }

  /* ---------- ייצוא / ייבוא / פרסום ---------- */

  function download(filename, text) {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** קובץ לפרסום: תוכן ציבורי בלבד — בלי בקשות, כספים, משתתפים ומשימות */
  function publishFile() {
    const pub = {
      v: content.v,
      updatedAt: new Date().toISOString(),
      site: { ...content.site },
      workshops: content.workshops,
      classes: content.classes,
      projects: content.projects,
      moments: content.moments,
      memorial: content.memorial,
      products: content.products,
      events: content.events.map(e => ({ id: e.id, title: e.title, date: e.date, start: e.start, end: e.end, type: e.type, capacity: e.capacity, taken: e.taken }))
    };
    delete pub.site.pin;
    download('content.json', JSON.stringify(pub, null, 2));
  }

  /** גיבוי מלא — כולל נתונים פנימיים */
  function backupFile() {
    const stamp = new Date().toISOString().slice(0, 10);
    download(`etz-tamari-backup-${stamp}.json`, JSON.stringify(content, null, 2));
  }

  function restore(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    content = merge(emptyContent(), data);
    saveContent();
  }

  function resetDraft() {
    localStorage.removeItem(CONTENT_KEY);
    location.reload();
  }

  /* ---------- מצב ניהול ---------- */
  const adminOpen = () => sessionStorage.getItem(SESSION_KEY) === '1';
  const setAdminOpen = v => v ? sessionStorage.setItem(SESSION_KEY, '1') : sessionStorage.removeItem(SESSION_KEY);

  return {
    init, uid, onChange,
    get content() { return content; },
    get local() { return local; },
    site: () => content.site,
    list, upsert, remove, find, saveContent, saveLocal,
    cartAdd, cartSet, cartCount, cartTotal, cartClear,
    favToggle, isFav, addRequest, addOrder,
    progressOf, toggleStep, resetProgress,
    publishFile, backupFile, restore, resetDraft,
    adminOpen, setAdminOpen
  };
})();
