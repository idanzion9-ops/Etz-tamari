/* ==========================================================================
   admin.js — מרכז הניהול. נסתר לחלוטין מהמבקר.
   כניסה: חמש לחיצות על הלוגו, לחיצה ארוכה בכותרת התחתונה, או #admin בכתובת.
   ========================================================================== */

const Admin = (() => {
  const { $, $$, esc, money, dateHe, todayISO, HE_DOW, toast, sheet, sheetBody, sheetFoot, closeSheet, readImage } = UI;

  let refreshPublic = () => {};
  let view = 'dash';

  /* ======================================================================
     כניסה
     ====================================================================== */
  function knock() {
    if (Store.adminOpen()) return open();
    sheet({
      title: 'כניסה',
      admin: true,
      body: `<div style="text-align:center;padding:14px 0 22px"><div style="font-size:40px">🔑</div></div>
        <div class="field"><label for="pin">קוד ניהול</label>
          <input type="password" id="pin" inputmode="numeric" autocomplete="off" placeholder="••••"></div>
        <p class="hint">אזור פנימי. אם הגעתם לכאן בטעות, סגרו את החלון.</p>`,
      foot: `<button class="btn btn-primary btn-block" id="pin-go">כניסה</button>`
    });
    setTimeout(() => $('#pin')?.focus(), 120);
    $('#pin').addEventListener('keydown', e => { if (e.key === 'Enter') tryPin(); });
    $('#pin-go').addEventListener('click', tryPin);
  }

  function tryPin() {
    const val = $('#pin').value.trim();
    if (val && val === String(Store.site().pin || '2580')) {
      Store.setAdminOpen(true);
      view = 'dash';
      open();
    } else {
      toast('קוד שגוי');
      $('#pin').value = '';
    }
  }

  /* ======================================================================
     מסגרת
     ====================================================================== */
  const SECTIONS = [
    { k: 'demo',      i: '🧪', t: 'סביבת הדגמה' },
    { k: 'members',   i: '🎟️', t: 'מנויים וכרטיסיות' },
    { k: 'registrations', i: '📥', t: 'הרשמות' },
    { k: 'calendar',  i: '📅', t: 'יומן ומועדים' },
    { k: 'workshops', i: '🪵', t: 'סדנאות' },
    { k: 'classes',   i: '👥', t: 'חוגים' },
    { k: 'projects',  i: '♻️', t: 'פרויקטונים' },
    { k: 'moments',   i: '📷', t: 'רגעים מהסדנה' },
    { k: 'memorial',  i: '🕯️', t: 'לזכרה' },
    { k: 'openws',    i: '🪚', t: 'הסדנה הפתוחה' },
    { k: 'products',  i: '🛒', t: 'חנות' },
    { k: 'orders',    i: '📦', t: 'הזמנות' },
    { k: 'people',    i: '📇', t: 'משתתפים' },
    { k: 'inventory', i: '🧰', t: 'מלאי סדנה' },
    { k: 'finance',   i: '📊', t: 'כספים' },
    { k: 'tasks',     i: '✅', t: 'משימות' },
    { k: 'content',   i: '✏️', t: 'תוכן ומיתוג' },
    { k: 'publish',   i: '📤', t: 'פרסום וגיבוי' }
  ];

  function open() {
    if (!UI.sheetOpen() || !$('#sheet').classList.contains('admin')) {
      sheet({ title: 'מרכז ניהול', body: '', admin: true, onClose: () => { view = 'dash'; } });
    }
    render();
  }

  function render() {
    const sec = SECTIONS.find(s => s.k === view);
    $('#sheet-title').textContent = sec ? sec.t : 'מרכז ניהול';
    const back = view === 'dash' ? '' :
      `<button class="mini" data-adm="dash" style="margin-bottom:16px">→ חזרה לתפריט</button>`;
    sheetBody(back + (VIEWS[view] || VIEWS.dash)());
    const FOOT = {
      dash:     `<button class="btn btn-quiet btn-block btn-sm" data-adm="lock">נעילת מרכז הניהול</button>`,
      openws:   `<button class="btn btn-primary btn-block" data-save-ow="1">שמירת הסדנה הפתוחה</button>`,
      memorial: `<button class="btn btn-primary btn-block" data-save-mem="1">שמירה</button>`,
      content:  `<button class="btn btn-primary btn-block" data-save-site="1">שמירת התוכן</button>`
    };
    sheetFoot(FOOT[view] || '');
  }

  /* ======================================================================
     עזרי טפסים
     ====================================================================== */
  /** מייצר שדות. סוגים: text | num | date | time | area | select | img | check */
  function form(fields, v = {}) {
    return fields.map(f => {
      const val = v[f.k] ?? f.def ?? '';
      const id = 'f_' + f.k;
      if (f.type === 'area')
        return `<div class="field"><label for="${id}">${esc(f.t)}</label><textarea id="${id}" data-f="${f.k}" placeholder="${esc(f.ph || '')}">${esc(val)}</textarea></div>`;
      if (f.type === 'select')
        return `<div class="field"><label for="${id}">${esc(f.t)}</label><select id="${id}" data-f="${f.k}">${
          f.opts.map(o => `<option value="${esc(o[0])}" ${String(val) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></div>`;
      if (f.type === 'check')
        return `<div class="switchrow"><label for="${id}" style="margin:0">${esc(f.t)}</label>
          <input type="checkbox" id="${id}" data-f="${f.k}" data-type="check" style="width:auto" ${val ? 'checked' : ''}></div>`;
      if (f.type === 'img')
        return `<div class="field"><label for="${id}">${esc(f.t)}</label>
          <input type="file" id="${id}" accept="image/*" data-img="${f.k}">
          <div id="prev_${f.k}" style="margin-top:10px">${val ? `<img src="${esc(val)}" alt="" style="height:88px;border-radius:var(--r-sm);border:1px solid var(--line)">` : ''}</div>
          <input type="hidden" data-f="${f.k}" value="${esc(val)}"></div>`;
      const it = { num: 'number', date: 'date', time: 'time' }[f.type] || 'text';
      return `<div class="field"><label for="${id}">${esc(f.t)}</label>
        <input type="${it}" id="${id}" data-f="${f.k}" value="${esc(val)}" placeholder="${esc(f.ph || '')}"></div>`;
    }).join('');
  }

  /** מוסיף מקרא איורים מתחת לטופס הפרויקטון, להעתקה לשורת השלב */
  function appendIllusKey() {
    const box = document.createElement('div');
    box.innerHTML = `
      <div class="eyebrow" style="margin-top:22px">איורי השלבים</div>
      <p class="hint" style="margin-top:0">כל שלב נכתב <code>כותרת | פירוט</code>. להוספת איור מסוים — מוסיפים קו נוסף ואת שם האיור:
        <code>מנסרים | לאורך הקו | saw</code>. בלי זה האיור נבחר אוטומטית לפי הטקסט.</p>
      <div class="il-grid">
        ${Illus.keys().map(k => `<div class="il-pick">${Illus.byKey(k)}
          <span>${esc(Illus.LABELS[k])}</span><code style="font-size:10px">${k}</code></div>`).join('')}
      </div>`;
    $('#sheet-body').appendChild(box);
  }

  /** עיבוד תמונה שעדיין רץ. השמירה ממתינה לו במקום להיחסם. */
  let pending = null;

  async function settle() {
    if (!pending) return;
    toast('ממתין לסיום עיבוד התמונה…');
    try { await pending; } catch (e) {}
  }

  function collect(scope = document) {
    // מקלדות מובייל מחזיקות את הערך עד לאיבוד המיקוד. מסיימים קודם.
    try { document.activeElement && document.activeElement.blur(); } catch (e) {}
    const out = {};
    $$('[data-f]', scope).forEach(el => {
      out[el.dataset.f] = el.dataset.type === 'check' ? el.checked : el.value;
    });
    return out;
  }

  /* ---- פרויקטון: המערכים נערכים כטקסט, שורה לכל פריט ---- */

  function pjToForm(x) {
    if (!x) return {};
    return {
      ...x,
      materials: (x.materials || []).join('\n'),
      tools: (x.tools || []).join('\n'),
      steps: (x.steps || []).map(st => `${st.t} | ${st.d}${st.il ? ' | ' + st.il : ''}`).join('\n')
    };
  }

  function pjFromForm(d) {
    const lines = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
    return {
      ...d,
      materials: lines(d.materials),
      tools: lines(d.tools),
      steps: lines(d.steps).map(line => {
        // כותרת | פירוט | איור   — החלק השלישי אינו חובה
        const parts = line.split('|').map(x => x.trim());
        const st = { t: parts[0] || '', d: parts[1] || '' };
        const key = parts[2];
        if (key && Illus.keys().includes(key)) st.il = key;
        return st;
      })
    };
  }

  /** עורך פריט באוסף — פותח מגירה משנית בתוך אותה מגירה */
  function editor(coll, fields, item, title) {
    const enMode = I18n.isEn() && bilingual(coll);
    sheetBody(`<button class="mini" data-adm="${view}" style="margin-bottom:16px">→ ביטול</button>
      ${enMode ? `<div class="alert ok" style="margin-bottom:14px"><span>🌐</span><span>עריכה באנגלית. המחירים, התמונות והמספרים משותפים לשתי השפות ונערכים בעברית.</span></div>` : ''}
      <h3 style="font-size:22px;margin-bottom:16px">${esc(title)}</h3>
      ${form(fields, item || {})}
      <input type="hidden" data-f="id" value="${esc(item?.id || '')}">`);
    sheetFoot(`<button class="btn btn-primary btn-block" data-save="${coll}">שמירה</button>`);
  }

  const listBlock = (coll, rows, emptyMsg, addLabel) =>
    `<button class="btn btn-sage btn-block btn-sm" data-new="${coll}" style="margin-bottom:16px">+ ${esc(addLabel)}</button>`
    + (rows.length ? rows.join('') : `<div class="empty"><p>${esc(emptyMsg)}</p></div>`);

  const itemRow = (coll, x, title, sub, extra = '') =>
    `<div class="adm-list-item">
      <div class="head">
        <div style="min-width:0">
          <div style="font-weight:600">${esc(title)}</div>
          <div class="tiny muted">${esc(sub)}</div>
          ${extra}
        </div>
        <div class="acts">
          <button class="mini" data-edit="${coll}" data-id="${esc(x.id)}">עריכה</button>
          <button class="mini mini--stop" data-del="${coll}" data-id="${esc(x.id)}">מחיקה</button>
        </div>
      </div></div>`;

  /* ======================================================================
     שדות לכל אוסף
     ====================================================================== */
  const FIELDS = {
    workshops: [
      { k: 'title', t: 'שם הסדנה' },
      { k: 'summary', t: 'משפט פתיחה', ph: 'מה עושים ומה לוקחים הביתה' },
      { k: 'description', type: 'area', t: 'תיאור מלא' },
      { k: 'duration', t: 'משך', ph: 'לדוגמה: 3 שעות' },
      { k: 'price', type: 'num', t: 'מחיר למשתתף (₪)' },
      { k: 'capacity', type: 'num', t: 'מספר מקומות' },
      { k: 'level', type: 'select', t: 'רמה', opts: [['מתחילים', 'מתחילים'], ['כל הרמות', 'כל הרמות'], ['מתקדמים', 'מתקדמים']] },
      { k: 'materials', t: 'מה כלול', ph: 'עץ, כלים, גימור, קפה' },
      { k: 'image', type: 'img', t: 'תמונה' },
      { k: 'private', type: 'check', t: 'זמין גם כסדנה פרטית / קבוצתית' },
      { k: 'active', type: 'check', t: 'מוצג לקהל', def: true }
    ],
    classes: [
      { k: 'title', t: 'שם החוג' },
      { k: 'summary', t: 'משפט פתיחה' },
      { k: 'description', type: 'area', t: 'תיאור מלא' },
      { k: 'sessions', type: 'num', t: 'מספר מפגשים' },
      { k: 'schedule', t: 'מועדים', ph: 'ימי שני 17:00–19:00' },
      { k: 'ageRange', t: 'טווח גילאים', ph: '8–14' },
      { k: 'price', type: 'num', t: 'מחיר לסבב (₪)' },
      { k: 'capacity', type: 'num', t: 'מספר מקומות' },
      { k: 'image', type: 'img', t: 'תמונה' },
      { k: 'active', type: 'check', t: 'מוצג לקהל', def: true }
    ],
    projects: [
      { k: 'title', t: 'שם הפרויקטון' },
      { k: 'emoji', t: 'סמל', ph: '🪚' },
      { k: 'summary', t: 'משפט פתיחה' },
      { k: 'level', type: 'select', t: 'רמת קושי', opts: [['קל מאוד', 'קל מאוד'], ['קל', 'קל'], ['קל-בינוני', 'קל-בינוני'], ['בינוני', 'בינוני']] },
      { k: 'time', t: 'זמן עבודה משוער', ph: 'שעה וחצי' },
      { k: 'materials', type: 'area', t: 'חומרים — שורה לכל פריט' },
      { k: 'tools', type: 'area', t: 'כלים — שורה לכל כלי' },
      { k: 'steps', type: 'area', t: 'שלבים — כותרת | פירוט | איור' },
      { k: 'tip', type: 'area', t: 'טיפ לסיום' }
    ],
    moments: [
      { k: 'image', type: 'img', t: 'התמונה' },
      { k: 'caption', t: 'כיתוב קצר' }
    ],
    products: [
      { k: 'name', t: 'שם הפריט' },
      { k: 'price', type: 'num', t: 'מחיר (₪)' },
      { k: 'category', t: 'קטגוריה', ph: 'כלי יד / פרזול / גימור' },
      { k: 'desc', type: 'area', t: 'תיאור' },
      { k: 'stock', type: 'num', t: 'כמות במלאי' },
      { k: 'image', type: 'img', t: 'תמונה' },
      { k: 'active', type: 'check', t: 'מוצג בחנות', def: true }
    ],
    events: [
      { k: 'title', t: 'שם המועד' },
      { k: 'date', type: 'date', t: 'תאריך' },
      { k: 'start', type: 'time', t: 'שעת התחלה' },
      { k: 'end', type: 'time', t: 'שעת סיום' },
      { k: 'type', type: 'select', t: 'סוג', opts: [['workshop', 'סדנה'], ['class', 'חוג'], ['private', 'פרטי'], ['internal', 'פנימי — לא מוצג לקהל']] },
      { k: 'capacity', type: 'num', t: 'מקומות' },
      { k: 'taken', type: 'num', t: 'נרשמו' },
      { k: 'notes', type: 'area', t: 'הערות והכנות' }
    ],
    participants: [
      { k: 'name', t: 'שם' },
      { k: 'phone', t: 'טלפון' },
      { k: 'email', t: 'אימייל' },
      { k: 'notes', type: 'area', t: 'הערות' }
    ],
    inventory: [
      { k: 'name', t: 'שם הפריט' },
      { k: 'category', type: 'select', t: 'קטגוריה', opts: [['כלי עבודה', 'כלי עבודה'], ['פרזול', 'פרזול'], ['מתכלים', 'מתכלים'], ['עץ וגימור', 'עץ וגימור']] },
      { k: 'qty', type: 'num', t: 'כמות' },
      { k: 'note', t: 'הערה' }
    ],
    finance: [
      { k: 'type', type: 'select', t: 'סוג תנועה', opts: [['in', 'הכנסה'], ['out', 'הוצאה']] },
      { k: 'date', type: 'date', t: 'תאריך' },
      { k: 'amount', type: 'num', t: 'סכום (₪)' },
      { k: 'desc', t: 'פירוט' }
    ],
    registrations: [
      { k: 'name', t: 'שם הנרשם' },
      { k: 'phone', t: 'טלפון' },
      { k: 'activity', t: 'לאיזו פעילות' },
      { k: 'date', type: 'date', t: 'תאריך' },
      { k: 'people', type: 'num', t: 'מספר משתתפים' },
      { k: 'status', type: 'select', t: 'סטטוס', opts: [['new', 'ממתין'], ['approved', 'אושר'], ['waitlist', 'רשימת המתנה'], ['declined', 'נדחה']] },
      { k: 'note', type: 'area', t: 'הערות' }
    ],
    orders: [
      { k: 'name', t: 'שם הלקוח' },
      { k: 'phone', t: 'טלפון' },
      { k: 'summary', t: 'מה הוזמן' },
      { k: 'total', type: 'num', t: 'סכום (₪)' },
      { k: 'date', type: 'date', t: 'תאריך' },
      { k: 'status', type: 'select', t: 'סטטוס', opts: [['ממתין', 'ממתין'], ['נאסף', 'נאסף'], ['שולם', 'שולם']] }
    ],
    tasks: [
      { k: 'name', t: 'המשימה' },
      { k: 'notes', type: 'area', t: 'הערות' },
      { k: 'done', type: 'check', t: 'הושלמה' }
    ]
  };

  const TITLES = {
    workshops: ['סדנה', 'סדנה חדשה'], classes: ['חוג', 'חוג חדש'],
    products: ['פריט', 'פריט לחנות'], events: ['מועד', 'מועד ביומן'],
    participants: ['משתתף', 'משתתף חדש'], inventory: ['פריט מלאי', 'פריט מלאי'],
    finance: ['תנועה', 'תנועה כספית'], tasks: ['משימה', 'משימה חדשה'],
    registrations: ['הרשמה', 'הרשמה חדשה'], orders: ['הזמנה', 'הזמנה חדשה'],
    projects: ['פרויקטון', 'פרויקטון חדש'], moments: ['תמונה', 'תמונה חדשה']
  };

  /* ======================================================================
     מסכים
     ====================================================================== */
  const VIEWS = {
    dash() {
      const c = Store.content;
      const pend = c.registrations.filter(r => r.status === 'new').length;
      const inbox = (Store.local.myRequests || []).length;
      const today = todayISO();
      const upcoming = c.events.filter(e => e.date >= today).length;
      const counts = { registrations: pend + inbox };

      return `<div class="stat-strip">
          <div class="stat"><b>${pend + inbox}</b><span>הרשמות ממתינות</span></div>
          <div class="stat"><b>${upcoming}</b><span>מועדים קרובים</span></div>
          <div class="stat"><b>${c.tasks.filter(t => !t.done).length}</b><span>משימות פתוחות</span></div>
        </div>
        <div class="adm-grid">
          ${SECTIONS.map(s => `<button class="adm-tile" data-adm="${s.k}">
            ${counts[s.k] ? `<span class="dot">${counts[s.k]}</span>` : ''}
            <span class="ico">${s.i}</span><span>${esc(s.t)}</span></button>`).join('')}
        </div>
        ${storageBar()}
        ${Store.content.updatedAt ? `<p class="hint" style="text-align:center;margin-top:16px">שינוי אחרון נשמר: ${new Date(Store.content.updatedAt).toLocaleString('he-IL')}</p>` : ''}
        <p class="hint" style="text-align:center">שינויים נשמרים על המכשיר הזה. כדי שיופיעו לכולם — ״פרסום וגיבוי״.</p>`;
    },

    demo() {
      const on = Demo.isOn();
      const d = Demo.db;
      return `<div class="card">
          <h3 style="font-size:20px;margin-bottom:8px">מה זה</h3>
          <p class="lead" style="font-size:15px">סביבה להתנסות בזרימה המלאה לפני חיבור מסד נתונים אמיתי: משתמש נרשם, חותם על טופס בטיחות, מבקש כרטיסייה, אתם מאשרים, ואז מנקבים כניסות.</p>
          <p class="hint">הכול נשמר על המכשיר הזה בלבד. לא נכנס לקובץ הפרסום ולא עולה לאינטרנט.</p>
          <div class="switchrow">
            <label for="demo-on" style="margin:0;font-size:16px">סביבת ההדגמה פעילה</label>
            <input type="checkbox" id="demo-on" style="width:auto" ${on ? 'checked' : ''}>
          </div>
        </div>

        <div class="stat-strip">
          <div class="stat"><b>${d.users.length}</b><span>משתמשים</span></div>
          <div class="stat"><b>${d.cards.filter(c => c.kind !== 'insurance').length}</b><span>כרטיסיות</span></div>
          <div class="stat"><b>${d.visits.length}</b><span>ביקורים</span></div>
        </div>

        <div class="card">
          <h3 style="font-size:19px;margin-bottom:8px">משתמשים לדוגמה</h3>
          <p class="lead" style="font-size:15px">יוצר חמישה משתמשים במצבים שונים — אחד בלי חתימה, אחת עם כניסה אחרונה, אחד קטין עם הורה חותם, וביטוח שעומד לפוג. ככה רואים את כל ההתראות.</p>
          <button class="btn btn-sage btn-block" data-demo="seed">יצירת משתמשים לדוגמה</button>
        </div>

        <div class="card">
          <h3 style="font-size:19px;margin-bottom:8px">איפוס</h3>
          <p class="lead" style="font-size:15px">מוחק את כל משתמשי ההדגמה, הכרטיסיות והביקורים. התוכן של האפליקציה לא נוגע.</p>
          <button class="btn btn-danger btn-block" data-demo="reset">מחיקת נתוני ההדגמה</button>
        </div>`;
    },

    members() {
      if (!Demo.isOn()) {
        return `<div class="empty"><div class="em">🧪</div>
          <p>סביבת ההדגמה כבויה.</p>
          <button class="btn btn-quiet btn-sm" data-adm="demo">להפעלה</button></div>`;
      }

      const pend = Demo.pendingPurchases();
      const us = Demo.users();

      const pendHtml = pend.length ? `
        <div class="eyebrow">בקשות רכישה ממתינות</div>
        ${pend.map(p => {
          const u = Demo.findUser(p.userId);
          return `<div class="user-row" style="border-color:var(--warn)">
            <div class="top">
              <div><div class="nm">${esc(u ? u.name : '—')}</div>
                <div class="sub">${esc(p.planName)} · ${money(p.price)}</div></div>
              <span class="chip chip--warn">ממתין</span>
            </div>
            <div class="acts">
              <button class="mini mini--go" data-demo="approve" data-id="${esc(p.id)}">אישור והפעלה</button>
              <button class="mini mini--stop" data-demo="decline" data-id="${esc(p.id)}">דחייה</button>
            </div></div>`;
        }).join('')}
        <div class="eyebrow" style="margin-top:26px">כל המשתמשים</div>` : '';

      const list = us.length ? us.map(u => {
        const card = Demo.activeCard(u.id);
        const left = Demo.entriesLeft(u.id);
        const alerts = Demo.alertsFor(u.id);
        const unl = card && card.kind === 'unlimited';
        return `<div class="user-row">
          <div class="top">
            <div style="min-width:0">
              <div class="nm">${esc(u.name)}${u.isMinor ? ' <span class="chip chip--flat">קטין</span>' : ''}</div>
              <div class="sub">${esc(u.email)}${u.phone ? ' · ' + esc(u.phone) : ''}</div>
              <div class="sub">${card ? esc(card.name) + (unl ? '' : ` · נותרו ${left}`) : 'אין כרטיסייה'}</div>
            </div>
            <div style="text-align:center;flex-shrink:0">
              <div class="num" style="font-size:22px">${unl ? '∞' : left}</div>
              <div class="sub">כניסות</div>
            </div>
          </div>
          ${alerts.map(a => `<div class="alert ${a.level}" style="margin:10px 0 0;font-size:13px;padding:8px 10px">${esc(a.text)}</div>`).join('')}
          <div class="acts">
            <button class="mini mini--go" data-demo="punch" data-id="${esc(u.id)}">ניקוב כניסה</button>
            <button class="mini" data-demo="card" data-id="${esc(u.id)}">כרטיס לקוח</button>
            <button class="mini mini--stop" data-demo="del-user" data-id="${esc(u.id)}">מחיקה</button>
          </div></div>`;
      }).join('') : `<div class="empty"><div class="em">🎟️</div><p>אין עדיין משתמשים.</p>
          <button class="btn btn-quiet btn-sm" data-adm="demo">ליצירת משתמשים לדוגמה</button></div>`;

      return pendHtml + list;
    },

    registrations() {
      const mine = Store.local.myRequests || [];
      const inbox = mine.length ? `
        <div class="eyebrow">הגיעו מהמכשיר הזה</div>
        ${mine.map(r => `<div class="adm-list-item">
          <div class="head"><div style="min-width:0">
            <div style="font-weight:600">${esc(r.name)} · ${esc(r.refTitle)}</div>
            <div class="tiny muted">${esc(dateHe(r.date))}${r.slot ? ' · ' + esc(r.slot) : ''} · ${r.people} משתתפים · ${esc(r.phone)}</div>
          </div>
          <button class="mini mini--go" data-pull="${esc(r.id)}">קליטה לרשימה</button></div></div>`).join('')}
        <div class="eyebrow" style="margin-top:22px">רשימת ההרשמות</div>` : '';

      const rows = Store.list('registrations').map(x => itemRow('registrations', x,
        `${x.name || 'ללא שם'} · ${x.activity || ''}`,
        `${dateHe(x.date)}${x.people ? ` · ${x.people} משתתפים` : ''} · ${x.phone || ''}`,
        `<span class="chip ${{ new: 'chip--warn', approved: '', waitlist: 'chip--flat', declined: 'chip--stop' }[x.status] || 'chip--warn'}" style="margin-top:8px">${
          { new: 'ממתין', approved: 'אושר', waitlist: 'המתנה', declined: 'נדחה' }[x.status] || 'ממתין'}</span>`));

      return `<p class="hint" style="margin-top:0">בקשות שמבקרים שולחים מגיעות אליכם בוואטסאפ. כאן רושמים אותן כדי לעקוב.</p>`
        + inbox + listBlock('registrations', rows, 'עוד לא נרשם אף אחד.', 'הרשמה חדשה');
    },

    calendar() {
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth();
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const evs = Store.list('events');
      const colors = { workshop: 'var(--sage-deep)', class: '#7C8BB0', private: 'var(--rust)', internal: 'var(--pencil)' };

      let cells = '';
      for (let i = 0; i < first; i++) cells += '<div class="cal-cell blank"></div>';
      for (let d = 1; d <= days; d++) {
        const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const list = evs.filter(e => e.date === iso);
        cells += `<div class="cal-cell ${iso === todayISO() ? 'today' : ''}">
          <span class="dnum">${d}</span>
          ${list.slice(0, 3).map(e => `<span class="cal-ev" style="background:${colors[e.type] || 'var(--sage)'}">${esc(e.title)}</span>`).join('')}
        </div>`;
      }

      return `<button class="btn btn-sage btn-block btn-sm" data-new="events" style="margin-bottom:16px">+ מועד חדש</button>
        <div class="cal-head"><h3 style="font-size:19px">${now.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</h3></div>
        <div class="cal-grid">${['א','ב','ג','ד','ה','ו','ש'].map(d => `<div class="cal-dow">${d}׳</div>`).join('')}${cells}</div>
        <div class="eyebrow" style="margin-top:24px">כל המועדים</div>
        ${evs.slice().sort((a, b) => b.date.localeCompare(a.date)).map(e =>
          itemRow('events', e, e.title, `${dateHe(e.date)}${e.start ? ' · ' + e.start : ''}${e.capacity ? ` · ${e.taken || 0}/${e.capacity}` : ''}`)).join('')
        || '<div class="empty"><p>היומן ריק.</p></div>'}`;
    },

    workshops() {
      return listBlock('workshops', Store.list('workshops').map(x =>
        itemRow('workshops', x, x.title, `${money(x.price)}${x.duration ? ' · ' + x.duration : ''}${x.active === false ? ' · מוסתר' : ''}`)),
        'עוד לא הוספתם סדנאות.', 'סדנה חדשה');
    },

    classes() {
      return listBlock('classes', Store.list('classes').map(x =>
        itemRow('classes', x, x.title, `${money(x.price)}${x.schedule ? ' · ' + x.schedule : ''}${x.active === false ? ' · מוסתר' : ''}`)),
        'עוד לא הוספתם חוגים.', 'חוג חדש');
    },

    projects() {
      return listBlock('projects', Store.list('projects').map(x =>
        itemRow('projects', x, `${x.emoji || ''} ${x.title}`,
          `${x.level || ''} · ${x.time || ''} · ${(x.steps || []).length} שלבים`)),
        'עוד לא הוספתם פרויקטונים.', 'פרויקטון חדש');
    },

    memorial() {
      const m = Store.content.memorial || {};
      return `<p class="hint" style="margin-top:0">הטקסט מוצג בדיוק כפי שנכתב כאן. שורה ריקה בין פסקאות מפרידה ביניהן.</p>
        ${form([
          { k: 'mem_title', t: 'כותרת' },
          { k: 'mem_lead', type: 'area', t: 'פסקת הפתיחה' },
          { k: 'mem_body', type: 'area', t: 'גוף הטקסט — פסקה בכל שורה' },
          { k: 'mem_photo', type: 'img', t: 'התצלום' }
        ], {
          mem_title: m.title,
          mem_lead: m.lead,
          mem_body: (m.paragraphs || []).join('\n'),
          mem_photo: m.photo
        })}
        <div class="eyebrow" style="margin-top:24px">המשפחה</div>
        ${form([
          { k: 'mem_fin', type: 'area', t: 'משפט פתיחה' },
          { k: 'mem_names', t: 'השמות — מופרדים בפסיק' },
          { k: 'mem_fout', type: 'area', t: 'משפט סיום' }
        ], {
          mem_fin: m.familyIntro,
          mem_names: (m.familyNames || []).join(', '),
          mem_fout: m.familyOutro
        })}
`;
    },

    moments() {
      return storageBar()
        + `<p class="hint">התמונות מוקטנות אוטומטית ל-900 פיקסל. עשר־חמש־עשרה תמונות טובות עדיפות על הרבה בינוניות.</p>`
        + listBlock('moments', Store.list('moments').map(x =>
            `<div class="adm-list-item">
              <div class="head">
                <div style="display:flex;gap:12px;align-items:center;min-width:0">
                  ${x.image ? `<img src="${esc(x.image)}" alt="" style="width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid var(--line);flex-shrink:0">` : '<span style="font-size:26px">📷</span>'}
                  <div style="min-width:0"><div style="font-weight:600">${esc(x.caption || 'ללא כיתוב')}</div></div>
                </div>
                <div class="acts">
                  <button class="mini" data-edit="moments" data-id="${esc(x.id)}">עריכה</button>
                  <button class="mini mini--stop" data-del="moments" data-id="${esc(x.id)}">מחיקה</button>
                </div>
              </div></div>`),
          'עוד לא העליתם תמונות.', 'תמונה חדשה');
    },

    openws() {
      const o = Store.site().openWorkshop || {};
      return `<div class="eyebrow">טקסט המסך</div>
        ${form([
          { k: 'ow_title', t: 'כותרת' },
          { k: 'ow_text', type: 'area', t: 'תיאור' }
        ], { ow_title: o.title, ow_text: o.text })}

        <div class="eyebrow" style="margin-top:24px">שעות הפעילות</div>
        ${(o.hours || []).map((h, i) => `<div class="grid2">
          <div class="field"><label>ימים</label><input data-owh="d" data-i="${i}" value="${esc(h.d)}"></div>
          <div class="field"><label>שעות</label><input data-owh="t" data-i="${i}" value="${esc(h.t)}"></div></div>`).join('')}

        <div class="eyebrow" style="margin-top:24px">מסלולים ומחירים</div>
        <p class="hint" style="margin-top:0">הרכישה עצמה תיפתח בשלב הבא. כרגע המחירים מוצגים בלבד.</p>
        ${(o.plans || []).map((pl, i) => `<div class="card" style="padding:14px">
          <div class="field"><label>שם המסלול</label><input data-owp="name" data-i="${i}" value="${esc(pl.name)}"></div>
          <div class="field"><label>תיאור</label><input data-owp="desc" data-i="${i}" value="${esc(pl.desc || '')}"></div>
          <div class="grid2">
            <div class="field"><label>מחיר (₪)</label><input type="number" data-owp="price" data-i="${i}" value="${esc(pl.price)}"></div>
            <div class="switchrow"><label style="margin:0">הכי משתלם</label>
              <input type="checkbox" data-owp="best" data-i="${i}" style="width:auto" ${pl.best ? 'checked' : ''}></div>
          </div></div>`).join('')}

`;
    },

    products() {
      return listBlock('products', Store.list('products').map(x =>
        itemRow('products', x, x.name, `${money(x.price)}${x.stock !== '' && x.stock !== undefined ? ` · במלאי ${x.stock}` : ''}`)),
        'החנות ריקה.', 'פריט לחנות');
    },

    orders() {
      return `<p class="hint" style="margin-top:0">הזמנות מהחנות מגיעות בוואטסאפ. כאן מתעדים אותן ועוקבים אחרי איסוף ותשלום.</p>`
        + listBlock('orders', Store.list('orders').map(x => itemRow('orders', x,
            `${x.name || 'ללא שם'} · ${money(x.total)}`,
            `${dateHe(x.date)} · ${x.summary || ''} · ${x.status || ''}`)),
          'אין הזמנות רשומות.', 'הזמנה חדשה');
    },

    people() {
      return listBlock('participants', Store.list('participants').map(x =>
        itemRow('participants', x, x.name, `${x.phone || ''}${x.email ? ' · ' + x.email : ''}`)),
        'אין עדיין משתתפים בכרטיסייה.', 'משתתף חדש');
    },

    inventory() {
      return listBlock('inventory', Store.list('inventory').map(x =>
        itemRow('inventory', x, x.name, `${x.category || ''} · ${x.qty || 0} יחידות`)),
        'המלאי ריק.', 'פריט מלאי');
    },

    finance() {
      const arr = Store.list('finance');
      const mth = todayISO().slice(0, 7);
      const cur = arr.filter(f => (f.date || '').startsWith(mth));
      const inn = cur.filter(f => f.type === 'in').reduce((s, f) => s + Number(f.amount || 0), 0);
      const out = cur.filter(f => f.type === 'out').reduce((s, f) => s + Number(f.amount || 0), 0);
      return `<div class="stat-strip">
          <div class="stat"><b style="color:var(--ok)">${money(inn)}</b><span>הכנסות החודש</span></div>
          <div class="stat"><b style="color:var(--stop)">${money(out)}</b><span>הוצאות</span></div>
          <div class="stat"><b>${money(inn - out)}</b><span>מאזן</span></div>
        </div>` + listBlock('finance', arr.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(x =>
          itemRow('finance', x, `${x.type === 'in' ? '+' : '−'} ${money(x.amount)}`, `${dateHe(x.date)} · ${x.desc || ''}`)),
          'אין תנועות.', 'תנועה חדשה');
    },

    tasks() {
      return listBlock('tasks', Store.list('tasks').map(x =>
        itemRow('tasks', x, (x.done ? '✓ ' : '') + x.name, x.notes || '')),
        'אין משימות פתוחות.', 'משימה חדשה');
    },

    content() {
      const s = Store.site();
      return `<div class="eyebrow">מיתוג</div>
        ${form([
          { k: 'name', t: 'שם המקום' },
          { k: 'tagline', t: 'שורת משנה' },
          { k: 'heroEmoji', t: 'סמל' },
          { k: 'heroTitle', t: 'כותרת ראשית', ph: 'אפשר להדגיש מילה עם <em>…</em>' },
          { k: 'heroText', type: 'area', t: 'פסקת פתיחה' }
        ], s)}
        <div class="eyebrow" style="margin-top:24px">שלוש המספרים בפתיח</div>
        ${(s.stats || []).map((x, i) => `<div class="grid2">
          <div class="field"><label>מספר ${i + 1}</label><input data-stat="n" data-i="${i}" value="${esc(x.n)}"></div>
          <div class="field"><label>תיאור</label><input data-stat="l" data-i="${i}" value="${esc(x.l)}"></div></div>`).join('')}
        <div class="eyebrow" style="margin-top:24px">אודות</div>
        ${form([
          { k: 'aboutTitle', t: 'כותרת' },
          { k: 'aboutHtml', type: 'area', t: 'הטקסט', ph: 'אפשר להשתמש ב-<p> ו-<strong>' },
          { k: 'aboutImage', type: 'img', t: 'תמונה' }
        ], s)}
        <div class="eyebrow" style="margin-top:24px">מדור הרגעים</div>
        ${form([{ k: 'momentsIntro', t: 'פסקת הפתיחה' }], s)}
        <div class="eyebrow" style="margin-top:24px">מדור הפרויקטונים</div>
        ${form([{ k: 'projectsIntro', type: 'area', t: 'פסקת הפתיחה של המדור' }], s)}
        <div class="eyebrow" style="margin-top:24px">שעות פתיחה</div>
        ${(s.hours || []).map((h, i) => `<div class="grid2">
          <div class="field"><label>ימים</label><input data-hour="d" data-i="${i}" value="${esc(h.d)}"></div>
          <div class="field"><label>שעות</label><input data-hour="t" data-i="${i}" value="${esc(h.t)}"></div></div>`).join('')}
        <div class="eyebrow" style="margin-top:24px">יצירת קשר</div>
        ${form([
          { k: 'c_phone', t: 'טלפון' },
          { k: 'c_whatsapp', t: 'וואטסאפ', ph: '9725XXXXXXXX' },
          { k: 'c_email', t: 'אימייל' },
          { k: 'c_address', t: 'כתובת' },
          { k: 'c_instagram', t: 'קישור אינסטגרם' },
          { k: 'c_facebook', t: 'קישור פייסבוק' }
        ], {
          c_phone: s.contact?.phone, c_whatsapp: s.contact?.whatsapp, c_email: s.contact?.email,
          c_address: s.contact?.address, c_instagram: s.contact?.instagram, c_facebook: s.contact?.facebook
        })}
        <div class="eyebrow" style="margin-top:24px">שעות להרשמה</div>
        ${form([{ k: 'slots', t: 'שעות אפשריות', ph: '09:00, 11:00, 16:00' }], { slots: (s.bookingSlots || []).join(', ') })}
        <div class="eyebrow" style="margin-top:24px">אבטחה</div>
        ${form([{ k: 'pin', t: 'קוד כניסה לניהול' }], { pin: s.pin })}
`;
    },

    publish() {
      return `<div class="card">
          <h3 style="font-size:20px;margin-bottom:8px">פרסום לכולם</h3>
          <p class="lead" style="font-size:15px">מוריד קובץ <code>content.json</code>. מעלים אותו ל-GitHub לתיקייה <code>assets/data/</code> במקום הקיים — ותוך דקה כל מי שנכנס לאפליקציה רואה את התוכן החדש.</p>
          <p class="hint">הקובץ כולל תוכן ציבורי בלבד: פתיח, אודות, סדנאות, חוגים, חנות ומועדים. בקשות, כספים ומשתתפים לא נכללים בו.</p>
          <button class="btn btn-primary btn-block" data-adm-act="publish">הורדת content.json</button>
        </div>
        <div class="card">
          <h3 style="font-size:20px;margin-bottom:8px">גיבוי מלא</h3>
          <p class="lead" style="font-size:15px">כל הנתונים, כולל הפנימיים. שמרו אצלכם — לא מעלים את זה ל-GitHub.</p>
          <div class="btn-row">
            <button class="btn btn-quiet" style="flex:1" data-adm-act="backup">ייצוא גיבוי</button>
            <button class="btn btn-quiet" style="flex:1" data-adm-act="import">ייבוא גיבוי</button>
          </div>
          <input type="file" id="restore-file" accept=".json" hidden>
        </div>
        <div class="card">
          <h3 style="font-size:20px;margin-bottom:8px">איפוס העריכות המקומיות</h3>
          <p class="lead" style="font-size:15px">מוחק את כל השינויים שטרם פורסמו וחוזר לתוכן שמופיע באתר. פעולה שלא ניתן לבטל.</p>
          <button class="btn btn-danger btn-block" data-adm-act="reset">מחיקת הטיוטה המקומית</button>
        </div>`;
    }
  };

  /* ======================================================================
     חיווט
     ====================================================================== */
  function wire() {
    document.addEventListener('click', async e => {
     try {
      const t = e.target;

      const nav = t.closest('[data-adm]');
      if (nav) {
        if (nav.dataset.adm === 'lock') { Store.setAdminOpen(false); closeSheet(); return toast('מרכז הניהול ננעל'); }
        view = nav.dataset.adm; return render();
      }

      const add = t.closest('[data-new]');
      if (add) {
        const coll = add.dataset.new;
        const blank = coll === 'projects' ? { emoji: '🪚', level: 'קל' } : { active: true, date: todayISO() };
        const r = editor(coll, FIELDS[coll], blank, TITLES[coll][1]);
        if (coll === 'projects') appendIllusKey();
        return r;
      }

      const ed = t.closest('[data-edit]');
      if (ed) {
        const coll = ed.dataset.edit;
        const rec0 = Store.find(coll, ed.dataset.id);
        const rec = forEdit(coll, rec0);
        if (rec && rec0) rec.id = rec0.id;
        const form = coll === 'projects' ? pjToForm(rec) : rec;
        const r = editor(coll, FIELDS[coll], form, 'עריכת ' + TITLES[coll][0]);
        if (coll === 'projects') appendIllusKey();
        return r;
      }

      const del = t.closest('[data-del]');
      if (del) {
        if (!confirm('למחוק? הפעולה לא ניתנת לביטול.')) return;
        try { Store.remove(del.dataset.del, del.dataset.id); }
        catch (err) { return toast(err.message); }
        refreshPublic(); toast('נמחק'); return render();
      }

      const save = t.closest('[data-save]');
      if (save) {
        if (pending) await settle();
        const coll = save.dataset.save;
        let data = collect($('#sheet-body'));
        if (!data.id) delete data.id;
        if (coll === 'projects') data = pjFromForm(data);
        ['price', 'capacity', 'sessions', 'qty', 'amount', 'stock', 'taken', 'people', 'total'].forEach(k => {
          if (data[k] !== undefined && data[k] !== '') data[k] = Number(data[k]);
        });
        if (data.image && !Store.hasRoom(data.image.length)) {
          const u = Store.usage();
          return toast(`אין מקום לתמונה נוספת (${u.kb}KB מתוך ${u.limitKb}KB). מחקו תמונות קיימות.`);
        }
        try {
          if (I18n.isEn() && bilingual(coll)) saveTranslation(coll, data);
          else Store.upsert(coll, data);
        } catch (err) { return toast(err.message); }
        refreshPublic(); toast('נשמר'); view = { events: 'calendar', participants: 'people' }[coll] || coll;
        return render();
      }

      if (t.closest('[data-save-site]')) { if (pending) await settle(); return saveSite(); }
      if (t.closest('[data-save-ow]')) { if (pending) await settle(); return saveOpenWorkshop(); }
      if (t.closest('[data-save-mem]')) { if (pending) await settle(); return saveMemorial(); }

      const pull = t.closest('[data-pull]');
      if (pull) {
        const r = (Store.local.myRequests || []).find(x => x.id === pull.dataset.pull);
        if (!r) return;
        Store.upsert('registrations', {
          name: r.name, phone: r.phone, activity: r.refTitle,
          date: r.date, people: r.people, status: 'new', note: r.note
        });
        Store.local.myRequests = Store.local.myRequests.filter(x => x.id !== r.id);
        Store.saveLocal();
        refreshPublic(); toast('נקלט לרשימה'); return render();
      }

      const dm = t.closest('[data-demo]');
      if (dm) return demoAction(dm.dataset.demo, dm.dataset.id);

      const act = t.closest('[data-adm-act]');
      if (act) {
        const a = act.dataset.admAct;
        if (a === 'publish') { Store.publishFile(); return toast('הקובץ ירד — העלו אותו ל-GitHub'); }
        if (a === 'backup') { Store.backupFile(); return toast('הגיבוי ירד'); }
        if (a === 'import') return $('#restore-file').click();
        if (a === 'reset') {
          if (confirm('למחוק את כל העריכות שטרם פורסמו?')) Store.resetDraft();
          return;
        }
      }
     } catch (err) {
      console.error('שגיאה בניהול:', err);
      toast('משהו השתבש: ' + (err && err.message ? err.message : 'שגיאה לא מזוהה'));
     }
    });

    // תמונות.
    // הכפתור לא ננעל בזמן העיבוד: כפתור מנוטרל שלא מגיב נראה למשתמש
    // כמו תקלה. במקום זה השמירה ממתינה לעיבוד אם הוא עוד רץ.
    document.addEventListener('change', async e => {
      if (e.target.id === 'demo-on') {
        Demo.setOn(e.target.checked);
        refreshPublic(); render();
        return toast(e.target.checked ? 'סביבת ההדגמה פעילה' : 'סביבת ההדגמה כובתה');
      }

      const img = e.target.closest('[data-img]');
      if (img) {
        const key = img.dataset.img;
        const prev = $(`#prev_${key}`);
        const file = e.target.files && e.target.files[0];
        e.target.value = '';           // מאפשר לבחור שוב את אותו קובץ
        if (!file) return;

        if (prev) prev.innerHTML = '<span class="hint">מעבד את התמונה…</span>';

        pending = (async () => {
          try {
            const url = await readImage(file);
            const hidden = $(`input[type=hidden][data-f="${key}"]`);
            if (!hidden) throw new Error('הטופס נסגר באמצע העיבוד');
            hidden.value = url;
            const kb = Math.round(url.length * 0.75 / 1024);
            if (prev) prev.innerHTML =
              `<img src="${url}" alt="" style="height:88px;border-radius:var(--r-sm);border:1px solid var(--line)">
               <div class="hint">מוכן · ${kb}KB</div>`;
          } catch (err) {
            if (prev) prev.innerHTML = `<div class="hint" style="color:var(--stop)">${esc(err.message)}</div>`;
            toast(err.message);
          } finally {
            pending = null;
          }
        })();
        return;
      }

      if (e.target.id === 'restore-file') {
        const file = e.target.files[0];
        if (!file) return;
        try {
          Store.restore(await file.text());
          refreshPublic(); toast('הגיבוי נטען'); render();
        } catch (err) { toast('הקובץ אינו גיבוי תקין'); }
      }
    });
  }

  /* ======================================================================
     עריכה דו-לשונית
     כשהאפליקציה באנגלית, העריכה כותבת לתרגום ולא לרשומה המקורית.
     ככה אותו טופס משמש לשתי השפות, בלי מסך נפרד.
     ====================================================================== */

  const TRANSLATABLE = {
    workshops: ['title', 'summary', 'description', 'duration', 'level', 'materials'],
    classes:   ['title', 'summary', 'description', 'schedule', 'ageRange'],
    products:  ['name', 'category', 'desc'],
    projects:  ['title', 'summary', 'materials', 'tools', 'tip', 'steps'],
    moments:   ['caption']
  };

  const bilingual = coll => !!TRANSLATABLE[coll];

  /** הערכים שיוצגו בטופס: התרגום כשקיים, אחרת המקור */
  function forEdit(coll, rec) {
    if (!rec || !I18n.isEn() || !bilingual(coll)) return rec;
    return I18n.rec(coll, rec);
  }

  /** שמירה באנגלית: רק השדות הניתנים לתרגום, לתוך content.en */
  function saveTranslation(coll, data) {
    const id = data.id;
    if (!id) throw new Error('אי אפשר ליצור פריט חדש במצב אנגלית. עברו לעברית, צרו, ואז תרגמו.');
    const c = Store.content;
    if (!c.en) c.en = {};
    if (!c.en[coll]) c.en[coll] = {};
    const tr = c.en[coll][id] || (c.en[coll][id] = {});
    TRANSLATABLE[coll].forEach(k => {
      if (data[k] !== undefined) tr[k] = data[k];
    });
    Store.saveContent();
  }

  /* ---------- פעולות סביבת ההדגמה ---------- */

  /** מד האחסון — מופיע בלוח המחוונים ובמסך הרגעים */
  function storageBar() {
    const u = Store.usage();
    const level = u.pct >= 85 ? 'stop' : u.pct >= 60 ? 'warn' : 'ok';
    const note = u.pct >= 85
      ? 'האחסון כמעט מלא. מחקו תמונות או פרסמו ואפסו את הטיוטה.'
      : u.pct >= 60 ? 'שימו לב לנפח. כל תמונה תופסת מקום.' : '';
    return `<div class="card" style="padding:14px">
      <div class="line" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px">
        <span class="lbl" style="margin:0">אחסון במכשיר</span>
        <b class="num" style="font-size:13px">${u.kb}KB מתוך ${u.limitKb}KB · ${u.images} תמונות</b>
      </div>
      <div class="bar"><i class="${u.pct >= 85 ? 'full' : ''}" style="width:${Math.max(2, u.pct)}%"></i></div>
      ${note ? `<div class="alert ${level}" style="margin:10px 0 0;font-size:13px;padding:9px 11px">${esc(note)}</div>` : ''}
    </div>`;
  }

  function demoAction(what, id) {
    try {
      if (what === 'seed')  { Demo.seed(); toast('נוצרו משתמשים לדוגמה'); }
      if (what === 'reset') {
        if (!confirm('למחוק את כל נתוני ההדגמה?')) return;
        Demo.reset(); toast('נמחק');
      }
      if (what === 'approve') {
        const c = Demo.approvePurchase(id);
        toast(c ? 'הכרטיסייה הופעלה' : 'הבקשה כבר טופלה');
      }
      if (what === 'decline') { Demo.declinePurchase(id); toast('נדחה'); }
      if (what === 'punch')   {
        const r = Demo.punch(id);
        toast(r.msg);
        if (!r.ok) return render();
      }
      if (what === 'del-user') {
        if (!confirm('למחוק את המשתמש ואת כל הנתונים שלו?')) return;
        const d = Demo.db;
        d.users    = d.users.filter(u => u.id !== id);
        d.cards    = d.cards.filter(c => c.userId !== id);
        d.visits   = d.visits.filter(v => v.userId !== id);
        d.purchases = d.purchases.filter(p => p.userId !== id);
        Demo.save(); toast('נמחק');
      }
      if (what === 'card') return customerCard(id);
    } catch (e) { return toast(e.message); }
    refreshPublic();
    render();
  }

  function customerCard(id) {
    const u = Demo.findUser(id);
    if (!u) return;
    const cards = Demo.cardsOf(id);
    const visits = Demo.visitsOf(id);
    sheetBody(`<button class="mini" data-adm="members" style="margin-bottom:16px">→ חזרה</button>
      <h3 style="font-size:22px;margin-bottom:4px">${esc(u.name)}</h3>
      <p class="hint" style="margin-top:0">${esc(u.email)}${u.phone ? ' · ' + esc(u.phone) : ''}</p>

      ${u.isMinor ? `<div class="alert warn" style="margin-top:12px"><span>👤</span><span>קטין. אחראי: ${esc(u.guardianName || '—')}</span></div>` : ''}

      <div class="eyebrow" style="margin-top:22px">טופס בטיחות</div>
      ${u.safetySignedAt
        ? `<div class="switchrow"><span class="lbl" style="margin:0">נחתם</span><span>${esc(dateHe(u.safetySignedAt.slice(0,10)))} · ${esc(u.safetySignedBy || u.name)}</span></div>
           ${u.safetySignature ? `<img src="${esc(u.safetySignature)}" alt="חתימה" style="width:100%;max-width:280px;border:1px solid var(--line);border-radius:var(--r-sm);background:#fff;margin-top:10px">` : ''}`
        : '<div class="alert stop"><span>⚠️</span><span>לא נחתם</span></div>'}

      <div class="eyebrow" style="margin-top:24px">כרטיסיות</div>
      ${cards.length ? cards.map(c => `<div class="switchrow">
          <span>${esc(c.name)}</span>
          <span class="num">${c.kind === 'punch' ? `${c.total - c.used}/${c.total}` : 'עד ' + esc(dateHe(c.validUntil))}</span>
        </div>`).join('') : '<p class="muted" style="margin:0">אין</p>'}

      <div class="eyebrow" style="margin-top:24px">ביקורים אחרונים</div>
      ${visits.length ? visits.slice(0, 12).map(v => `<div class="switchrow">
          <span class="num">${esc(dateHe(v.at.slice(0,10)))}</span>
          <span class="muted">${esc(new Date(v.at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }))}</span>
        </div>`).join('') : '<p class="muted" style="margin:0">אין</p>'}`);
    sheetFoot(`<button class="btn btn-primary btn-block" data-demo="punch" data-id="${esc(u.id)}">ניקוב כניסה</button>`);
  }

  function saveSite() {
    const site = Store.site();
    const d = collect($('#sheet-body'));
    Object.assign(site, {
      name: d.name, tagline: d.tagline, heroEmoji: d.heroEmoji,
      heroTitle: d.heroTitle, heroText: d.heroText,
      aboutTitle: d.aboutTitle, aboutHtml: d.aboutHtml, aboutImage: d.aboutImage,
      projectsIntro: d.projectsIntro,
      momentsIntro: d.momentsIntro,
      pin: d.pin || site.pin,
      bookingSlots: String(d.slots || '').split(',').map(x => x.trim()).filter(Boolean),
      contact: {
        phone: d.c_phone, whatsapp: d.c_whatsapp, email: d.c_email,
        address: d.c_address, instagram: d.c_instagram, facebook: d.c_facebook
      }
    });
    $$('[data-hour]').forEach(el => { site.hours[el.dataset.i][el.dataset.hour] = el.value; });
    try { Store.saveContent(); }
    catch (err) { return toast(err.message); }
    refreshPublic();
    toast('התוכן נשמר. לפרסום לכולם — ״פרסום וגיבוי״.');
  }

  function saveMemorial() {
    const d = collect($('#sheet-body'));
    const lines = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
    Store.content.memorial = {
      title: d.mem_title,
      photo: d.mem_photo,
      lead: d.mem_lead,
      paragraphs: lines(d.mem_body),
      familyIntro: d.mem_fin,
      familyNames: String(d.mem_names || '').split(',').map(x => x.trim()).filter(Boolean),
      familyOutro: d.mem_fout
    };
    try { Store.saveContent(); }
    catch (err) { return toast(err.message); }
    refreshPublic();
    toast('נשמר');
  }

  function saveOpenWorkshop() {
    const site = Store.site();
    const o = site.openWorkshop || (site.openWorkshop = { hours: [], plans: [] });
    const d = collect($('#sheet-body'));
    o.title = d.ow_title;
    o.text  = d.ow_text;
    $$('[data-owh]').forEach(el => { o.hours[el.dataset.i][el.dataset.owh] = el.value; });
    $$('[data-owp]').forEach(el => {
      const pl = o.plans[el.dataset.i], k = el.dataset.owp;
      pl[k] = k === 'best' ? el.checked : (k === 'price' ? Number(el.value) : el.value);
    });
    try { Store.saveContent(); }
    catch (err) { return toast(err.message); }
    refreshPublic();
    toast('נשמר. לפרסום לכולם — ״פרסום וגיבוי״.');
  }

  function init(refresh) { refreshPublic = refresh || (() => {}); wire(); }

  return { init, knock };
})();
