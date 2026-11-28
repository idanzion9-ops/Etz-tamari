/* ==========================================================================
   i18n.js — עברית ואנגלית
   --------------------------------------------------------------------------
   שתי שכבות נפרדות:
   1. מחרוזות הממשק — כאן בקובץ.
   2. התוכן עצמו — ב-content.json, תחת מפתח "en" ולפי מזהה.

   כשחסר תרגום, חוזרים לעברית. עדיף טקסט בעברית מאשר חור בממשק.
   ========================================================================== */

const I18n = (() => {
  const KEY = 'etz_lang';
  let lang = 'he';
  const listeners = new Set();

  const S = {
    he: {
      'nav.home': 'בית', 'nav.open': 'הסדנה', 'nav.shop': 'חנות',
      'nav.cart': 'עגלה', 'nav.favs': 'מועדפים', 'nav.me': 'שלי',
      'nav.exitHint': 'לחצו שוב כדי לצאת',

      'tile.open': 'הסדנה הפתוחה',      'tile.open.note': 'שעות עבודה חופשיות',
      'tile.work': 'סדנאות עץ',          'tile.work.note': 'חד־פעמיות',
      'tile.proj': 'פרויקטונים',         'tile.proj.note': 'משאריות עץ',
      'tile.class': 'קבוצות וחוגים',     'tile.class.note': 'מפגשים מתמשכים',
      'tile.shop': 'חנות ציוד נגרות',    'tile.shop.note': 'כלים וחומרים',
      'tile.moments': 'רגעים מהסדנה',    'tile.moments.note': 'מה קורה אצלנו',
      'tile.about': 'אודות עץ תמרי',     'tile.about.note': 'הסיפור שלנו',
      'tile.memorial': 'לזכרה',          'tile.memorial.note': 'תמר קדם סימן טוב ז״ל',

      'act.title': 'סדנאות וחוגים', 'act.eyebrow': 'לוח פעילויות',
      'act.workshops': 'סדנאות', 'act.classes': 'חוגים', 'act.private': 'פרטי / קבוצה',
      'act.privTitle': 'סדנה פרטית או קבוצתית',
      'act.privText': 'ימי הולדת, גיבוש צוות, משפחה או חברים. אנחנו בונים את התוכן סביב מי שמגיע ומה שרוצים לקחת הביתה.',
      'act.privCta': 'בקשת הצעה',
      'act.emptyW': 'עוד לא נפתחו סדנאות.', 'act.emptyC': 'עוד לא נפתחו חוגים.',
      'act.notify': 'להשאיר פרטים לעדכון',

      'f.price': 'מחיר', 'f.duration': 'משך', 'f.sessions': 'מפגשים',
      'f.schedule': 'מועדים', 'f.ages': 'גילאים', 'f.spots': 'מקומות',
      'f.level': 'רמה', 'f.about': 'על הסדנה', 'f.included': 'מה מקבלים',
      'f.syllabus': 'מהלך המפגשים', 'f.register': 'הרשמה',
      'm.duration': 'משך', 'm.sessions': 'מפגשים', 'm.ages': 'גילאי', 'm.upTo': 'עד',
      'm.participants': 'משתתפים',

      'proj.title': 'משאריות עץ', 'proj.all': 'הכול', 'proj.easy': 'קל', 'proj.mid': 'בינוני',
      'proj.empty': 'אין כרגע פרויקטונים ברמה הזו.',
      'proj.materials': 'חומרים ושאריות', 'proj.tools': 'כלים', 'proj.steps': 'שלב אחר שלב',
      'proj.progress': 'התקדמות', 'proj.of': 'מתוך',
      'proj.reset': 'איפוס הסימונים', 'proj.learn': 'רוצה ללמוד בסדנה',

      'open.plans': 'מסלולים', 'open.best': 'הכי משתלם', 'open.buy': 'בקשת רכישה',
      'open.soon': 'כרטיסיות, ביטוח ושריון מקום ייפתחו כאן בקרוב.',
      'open.askSlot': 'בינתיים — בקשת מועד',

      'shop.title': 'כלים וחומרים',
      'shop.sub': 'מה שאנחנו עובדים איתו בסדנה, זמין גם אליכם הביתה.',
      'shop.search': 'חיפוש כלי או חומר…',
      'shop.empty': 'המדפים עוד מתמלאים.', 'shop.noMatch': 'לא נמצא פריט מתאים. נסו מילה אחרת.',
      'shop.out': 'אזל', 'shop.stock': 'במלאי',
      'shop.addCart': 'הוספה לעגלה', 'shop.fav': '♡ למועדפים', 'shop.faved': '♥ במועדפים',

      'cart.title': 'העגלה שלי', 'cart.each': 'ליחידה', 'cart.remove': 'הסרה',
      'cart.total': 'סה״כ', 'cart.empty': 'העגלה ריקה.', 'cart.toShop': 'למדפים',
      'cart.send': 'שליחת ההזמנה',
      'cart.note': 'התשלום והאיסוף מתואמים איתנו ישירות. שליחת ההזמנה פותחת שיחה.',
      'cart.sent': 'ההזמנה נשלחה', 'cart.copied': 'ההזמנה הועתקה — שלחו לנו אותה',
      'favs.title': 'המועדפים שלי', 'favs.empty': 'עוד לא סימנתם פריטים.', 'favs.toCart': 'לעגלה',

      'me.title': 'ההרשמות שלי', 'me.eyebrow': 'האזור שלי',
      'me.none': 'עוד לא נרשמתם לשום דבר.', 'me.whatsOn': 'מה יש בלוח',
      'me.details': 'הפרטים שלי', 'me.contact': 'יצירת קשר',
      'me.privacy': 'נשמר על המכשיר שלכם בלבד, כדי לא למלא אותו שוב בכל הרשמה.',
      'me.name': 'שם', 'me.phone': 'טלפון', 'me.email': 'אימייל',
      'me.save': 'שמירת פרטים', 'me.saved': 'הפרטים נשמרו',
      'me.contactSoon': 'פרטי הקשר יתעדכנו בקרוב.', 'me.address': 'כתובת',
      'me.whatsapp': 'וואטסאפ', 'me.sendMsg': 'שליחת הודעה',

      'st.new': 'נשלח', 'st.approved': 'מאושר', 'st.waitlist': 'ברשימת המתנה', 'st.declined': 'לא אושר',

      'bk.when': 'מתי נוח לכם', 'bk.date': 'תאריך מבוקש', 'bk.time': 'שעה',
      'bk.howMany': 'כמה אתם', 'bk.next': 'המשך', 'bk.back': 'חזרה',
      'bk.hint': 'זו בקשה, לא אישור. נחזור אליכם לאישור סופי.',
      'bk.reach': 'איך נשיג אתכם', 'bk.fullName': 'שם מלא', 'bk.optional': '(לא חובה)',
      'bk.note': 'משהו שכדאי שנדע',
      'bk.notePh': 'ניסיון קודם, גיל המשתתפים, רגישויות, בקשה מיוחדת…',
      'bk.submit': 'שליחת הבקשה', 'bk.sent': 'הבקשה נשלחה',
      'bk.sentText': 'שמרנו אותה ב״האזור שלי״ שלכם.',
      'bk.sentWa': 'כדי שנראה אותה — שלחו לנו אותה גם בוואטסאפ בלחיצה אחת.',
      'bk.sentNoWa': 'צרו איתנו קשר כדי לתאם את המועד סופית.',
      'bk.viaWa': 'שליחה בוואטסאפ', 'bk.close': 'סגירה',
      'bk.needDate': 'בחרו תאריך כדי להמשיך', 'bk.needName': 'צריך שם כדי לחזור אליכם',
      'bk.badPhone': 'בדקו את מספר הטלפון', 'bk.visit': 'מועד במרחב',

      'home.upcoming': 'קרוב בזמן', 'home.hours': 'שעות פתיחה',
      'home.noDates': 'עוד לא נקבעו מועדים קרובים.', 'home.askDate': 'בקשת מועד',
      'home.full': 'מלא',

      'mom.title': 'מה קורה אצלנו', 'mom.empty': 'התמונות הראשונות בדרך.',
      'mem.closing': 'יהי זכרם ברוך',

      'a11y.title': 'נגישות', 'a11y.saved': 'ההגדרות נשמרות במכשיר שלכם.',
      'a11y.size': 'גודל הטקסט', 'a11y.bigger': 'א+ הגדלה', 'a11y.smaller': 'א− הקטנה',
      'a11y.display': 'תצוגה', 'a11y.contrast': 'ניגודיות גבוהה', 'a11y.gray': 'גווני אפור',
      'a11y.links': 'הדגשת קישורים', 'a11y.font': 'גופן קריא', 'a11y.motion': 'עצירת אנימציות',
      'a11y.reset': 'איפוס הכול', 'a11y.statement': 'הצהרת נגישות',
      'a11y.lang': 'שפה',

      'acct.title': 'האזור האישי',
      'acct.sub': 'התחברו כדי לנהל כרטיסיות, לשריין מקום ולהציג את קוד הכניסה.',
      'acct.register': 'הרשמה', 'acct.login': 'כניסה', 'acct.logout': 'יציאה',
      'acct.myCard': 'הכרטיסייה שלי', 'acct.entriesLeft': 'כניסות שנשארו',
      'acct.unlimited': 'מנוי ללא הגבלה', 'acct.plan': 'המסלול', 'acct.validTo': 'בתוקף עד',
      'acct.insurance': 'ביטוח', 'acct.none': 'אין', 'acct.validToShort': 'בתוקף עד',
      'acct.safety': 'טופס בטיחות', 'acct.signed': 'נחתם', 'acct.toSign': 'לחתימה',
      'acct.visits': 'ביקורים', 'acct.showQr': 'הצגת קוד הכניסה',
      'acct.noCard': 'אין כרטיסייה פעילה.', 'acct.toPlans': 'למסלולים',
      'acct.qrTitle': 'קוד הכניסה שלי', 'acct.qrHint': 'הראו את הקוד בכניסה לסדנה.',
      'acct.demoNote': 'סביבת הדגמה. המשתמשים נשמרים על המכשיר הזה בלבד.',

      'demo.ribbon': '🧪 סביבת הדגמה — הנתונים מקומיים בלבד'
    },

    en: {
      'nav.home': 'Home', 'nav.open': 'Open shop', 'nav.shop': 'Store',
      'nav.cart': 'Cart', 'nav.favs': 'Saved', 'nav.me': 'Me',
      'nav.exitHint': 'Press back again to exit',

      'tile.open': 'The open workshop',  'tile.open.note': 'Free bench hours',
      'tile.work': 'Woodworking classes','tile.work.note': 'One evening each',
      'tile.proj': 'Small projects',     'tile.proj.note': 'From offcuts',
      'tile.class': 'Groups & courses',  'tile.class.note': 'Weekly, over time',
      'tile.shop': 'Tools & materials',  'tile.shop.note': 'What we work with',
      'tile.moments': 'From the bench',  'tile.moments.note': 'What goes on here',
      'tile.about': 'About Etz Tamari',  'tile.about.note': 'Our story',
      'tile.memorial': 'In her memory',  'tile.memorial.note': 'Tamar Kedem Siman Tov',

      'act.title': 'Classes & courses', 'act.eyebrow': "What's on",
      'act.workshops': 'Classes', 'act.classes': 'Courses', 'act.private': 'Private / group',
      'act.privTitle': 'Private or group session',
      'act.privText': 'Birthdays, team days, family or friends. We build the session around who turns up and what they want to take home.',
      'act.privCta': 'Ask for a quote',
      'act.emptyW': 'No classes scheduled yet.', 'act.emptyC': 'No courses open yet.',
      'act.notify': 'Leave your details for updates',

      'f.price': 'Price', 'f.duration': 'Length', 'f.sessions': 'Sessions',
      'f.schedule': 'When', 'f.ages': 'Ages', 'f.spots': 'Places',
      'f.level': 'Level', 'f.about': 'About this class', 'f.included': "What's included",
      'f.syllabus': 'Session by session', 'f.register': 'Sign up',
      'm.duration': 'Length', 'm.sessions': 'sessions', 'm.ages': 'Ages', 'm.upTo': 'Up to',
      'm.participants': 'people',

      'proj.title': 'From offcuts', 'proj.all': 'All', 'proj.easy': 'Easy', 'proj.mid': 'Medium',
      'proj.empty': 'Nothing at that level right now.',
      'proj.materials': 'Materials & offcuts', 'proj.tools': 'Tools', 'proj.steps': 'Step by step',
      'proj.progress': 'Progress', 'proj.of': 'of',
      'proj.reset': 'Clear the ticks', 'proj.learn': "I'd rather learn it here",

      'open.plans': 'Options', 'open.best': 'Best value', 'open.buy': 'Request',
      'open.soon': 'Passes, insurance and bench booking are coming here soon.',
      'open.askSlot': 'For now — ask for a slot',

      'shop.title': 'Tools & materials',
      'shop.sub': 'What we work with at the bench, available to take home.',
      'shop.search': 'Search a tool or material…',
      'shop.empty': 'The shelves are still filling up.', 'shop.noMatch': 'Nothing matched. Try another word.',
      'shop.out': 'Out of stock', 'shop.stock': 'In stock',
      'shop.addCart': 'Add to cart', 'shop.fav': '♡ Save', 'shop.faved': '♥ Saved',

      'cart.title': 'My cart', 'cart.each': 'each', 'cart.remove': 'Remove',
      'cart.total': 'Total', 'cart.empty': 'Your cart is empty.', 'cart.toShop': 'Browse the shelves',
      'cart.send': 'Send the order',
      'cart.note': 'Payment and pickup are arranged directly with us. Sending opens a conversation.',
      'cart.sent': 'Order sent', 'cart.copied': 'Order copied — send it to us',
      'favs.title': 'Saved items', 'favs.empty': "You haven't saved anything yet.", 'favs.toCart': 'To cart',

      'me.title': 'My sign-ups', 'me.eyebrow': 'My area',
      'me.none': "You haven't signed up for anything yet.", 'me.whatsOn': "See what's on",
      'me.details': 'My details', 'me.contact': 'Get in touch',
      'me.privacy': 'Kept on your device only, so you need not retype it each time.',
      'me.name': 'Name', 'me.phone': 'Phone', 'me.email': 'Email',
      'me.save': 'Save details', 'me.saved': 'Details saved',
      'me.contactSoon': 'Contact details coming soon.', 'me.address': 'Address',
      'me.whatsapp': 'WhatsApp', 'me.sendMsg': 'Send a message',

      'st.new': 'Sent', 'st.approved': 'Confirmed', 'st.waitlist': 'On the waiting list', 'st.declined': 'Not confirmed',

      'bk.when': 'When suits you', 'bk.date': 'Preferred date', 'bk.time': 'Time',
      'bk.howMany': 'How many of you', 'bk.next': 'Continue', 'bk.back': 'Back',
      'bk.hint': "This is a request, not a confirmation. We'll come back to you.",
      'bk.reach': 'How we reach you', 'bk.fullName': 'Full name', 'bk.optional': '(optional)',
      'bk.note': 'Anything we should know',
      'bk.notePh': 'Previous experience, ages, allergies, special requests…',
      'bk.submit': 'Send the request', 'bk.sent': 'Request sent',
      'bk.sentText': "We've saved it under My area.",
      'bk.sentWa': 'To make sure we see it — send it over on WhatsApp too.',
      'bk.sentNoWa': 'Get in touch to confirm the slot.',
      'bk.viaWa': 'Send on WhatsApp', 'bk.close': 'Close',
      'bk.needDate': 'Pick a date to continue', 'bk.needName': 'We need a name to reply to',
      'bk.badPhone': 'Check the phone number', 'bk.visit': 'A slot at the bench',

      'home.upcoming': 'Coming up', 'home.hours': 'Opening hours',
      'home.noDates': 'No dates set yet.', 'home.askDate': 'Ask for a slot',
      'home.full': 'Full',

      'mom.title': 'What goes on here', 'mom.empty': 'First photos on the way.',
      'mem.closing': 'May their memory be a blessing',

      'a11y.title': 'Accessibility', 'a11y.saved': 'Settings are kept on your device.',
      'a11y.size': 'Text size', 'a11y.bigger': 'A+ Larger', 'a11y.smaller': 'A− Smaller',
      'a11y.display': 'Display', 'a11y.contrast': 'High contrast', 'a11y.gray': 'Greyscale',
      'a11y.links': 'Highlight links', 'a11y.font': 'Readable font', 'a11y.motion': 'Stop animation',
      'a11y.reset': 'Reset all', 'a11y.statement': 'Accessibility statement',
      'a11y.lang': 'Language',

      'acct.title': 'My account',
      'acct.sub': 'Sign in to manage passes, book a bench and show your entry code.',
      'acct.register': 'Sign up', 'acct.login': 'Sign in', 'acct.logout': 'Sign out',
      'acct.myCard': 'My pass', 'acct.entriesLeft': 'entries left',
      'acct.unlimited': 'Unlimited membership', 'acct.plan': 'Plan', 'acct.validTo': 'Valid until',
      'acct.insurance': 'Insurance', 'acct.none': 'None', 'acct.validToShort': 'until',
      'acct.safety': 'Safety form', 'acct.signed': 'Signed', 'acct.toSign': 'Sign now',
      'acct.visits': 'Visits', 'acct.showQr': 'Show entry code',
      'acct.noCard': 'No active pass.', 'acct.toPlans': 'See the options',
      'acct.qrTitle': 'My entry code', 'acct.qrHint': 'Show this code when you arrive.',
      'acct.demoNote': 'Demo mode. Accounts stay on this device only.',

      'demo.ribbon': '🧪 Demo mode — data stays on this device'
    }
  };

  /* ---------- שפה ---------- */
  function load() {
    try { lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'he'; } catch (e) { lang = 'he'; }
    applyDir();
    return lang;
  }

  function set(l) {
    lang = l === 'en' ? 'en' : 'he';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    applyDir();
    listeners.forEach(fn => { try { fn(lang); } catch (e) {} });
  }

  function applyDir() {
    const h = document.documentElement;
    h.lang = lang;
    h.dir = lang === 'en' ? 'ltr' : 'rtl';
  }

  const get = () => lang;
  const isEn = () => lang === 'en';
  const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };

  /** מחרוזת ממשק. חסר באנגלית — נופלים לעברית. */
  const t = k => (S[lang] && S[lang][k]) || S.he[k] || k;

  /* ---------- תוכן ---------- */

  /**
   * שדה מתוך רשומת תוכן, לפי השפה הפעילה.
   * התרגומים יושבים ב-content.en[collection][id] ומוזגים על המקור.
   */
  function f(coll, rec, field) {
    if (lang === 'he' || !rec) return rec ? rec[field] : '';
    const tr = pick(coll, rec.id);
    const v = tr && tr[field];
    return (v === undefined || v === null || v === '') ? rec[field] : v;
  }

  /** רשומה שלמה עם התרגום ממוזג — נוח כשצריך הרבה שדות */
  function rec(coll, r) {
    if (lang === 'he' || !r) return r;
    const tr = pick(coll, r.id);
    if (!tr) return r;
    const out = { ...r };
    for (const k of Object.keys(tr)) {
      const v = tr[k];
      if (v === undefined || v === null || v === '') continue;

      // מערך של אובייקטים (שלבי פרויקטון) — ממזגים לפי מיקום,
      // אחרת שדות שאינם טקסט, כמו מפתח האיור, נעלמים בתרגום.
      if (Array.isArray(v) && Array.isArray(r[k]) && v.length === r[k].length
          && v.every(x => x && typeof x === 'object' && !Array.isArray(x))) {
        out[k] = r[k].map((base, i) => ({ ...base, ...v[i] }));
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  function pick(coll, id) {
    const en = Store.content && Store.content.en;
    return (en && en[coll] && en[coll][id]) || null;
  }

  /** ענף כללי באובייקט site או memorial */
  function site(field) {
    const s = Store.site();
    if (lang === 'he') return s[field];
    const en = Store.content.en && Store.content.en.site;
    const v = en && en[field];
    return (v === undefined || v === null || v === '') ? s[field] : v;
  }

  function memorial() {
    const m = Store.content.memorial || {};
    if (lang === 'he') return m;
    const en = Store.content.en && Store.content.en.memorial;
    return en ? { ...m, ...en } : m;
  }

  function openWorkshop() {
    const o = Store.site().openWorkshop || {};
    if (lang === 'he') return o;
    const en = Store.content.en && Store.content.en.openWorkshop;
    if (!en) return o;
    const out = { ...o, ...en };
    // המסלולים מתורגמים לפי מיקום, המחיר תמיד מהמקור
    if (en.plans) out.plans = (o.plans || []).map((p, i) => ({ ...p, ...(en.plans[i] || {}), price: p.price }));
    if (en.hours) out.hours = en.hours;
    return out;
  }

  return { load, set, get, isEn, onChange, t, f, rec, site, memorial, openWorkshop };
})();
