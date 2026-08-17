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
    { k: 'registrations', i: '📥', t: 'הרשמות' },
    { k: 'calendar',  i: '📅', t: 'יומן ומועדים' },
    { k: 'workshops', i: '🪵', t: 'סדנאות' },
    { k: 'classes',   i: '👥', t: 'חוגים' },
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
    sheetFoot(view === 'dash'
      ? `<button class="btn btn-quiet btn-block btn-sm" data-adm="lock">נעילת מרכז הניהול</button>`
      : '');
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

  function collect(scope = document) {
    const out = {};
    $$('[data-f]', scope).forEach(el => {
      out[el.dataset.f] = el.dataset.type === 'check' ? el.checked : el.value;
    });
    return out;
  }

  /** עורך פריט באוסף — פותח מגירה משנית בתוך אותה מגירה */
  function editor(coll, fields, item, title) {
    sheetBody(`<button class="mini" data-adm="${view}" style="margin-bottom:16px">→ ביטול</button>
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
    registrations: ['הרשמה', 'הרשמה חדשה'], orders: ['הזמנה', 'הזמנה חדשה']
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
          <div class="stat"><b>${pend + inbox}</b><span>הרשמות לטיפול</span></div>
          <div class="stat"><b>${upcoming}</b><span>מועדים קרובים</span></div>
          <div class="stat"><b>${c.tasks.filter(t => !t.done).length}</b><span>משימות פתוחות</span></div>
        </div>
        <div class="adm-grid">
          ${SECTIONS.map(s => `<button class="adm-tile" data-adm="${s.k}">
            ${counts[s.k] ? `<span class="dot">${counts[s.k]}</span>` : ''}
            <span class="ico">${s.i}</span><span>${esc(s.t)}</span></button>`).join('')}
        </div>
        ${Store.content.updatedAt ? `<p class="hint" style="text-align:center;margin-top:16px">שינוי אחרון נשמר: ${new Date(Store.content.updatedAt).toLocaleString('he-IL')}</p>` : ''}
        <p class="hint" style="text-align:center">שינויים נשמרים על המכשיר הזה. כדי שיופיעו לכולם — ״פרסום וגיבוי״.</p>`;
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
        <button class="btn btn-primary btn-block" data-save-site="1" style="margin-top:20px">שמירת התוכן</button>`;
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
      const t = e.target;

      const nav = t.closest('[data-adm]');
      if (nav) {
        if (nav.dataset.adm === 'lock') { Store.setAdminOpen(false); closeSheet(); return toast('מרכז הניהול ננעל'); }
        view = nav.dataset.adm; return render();
      }

      const add = t.closest('[data-new]');
      if (add) {
        const coll = add.dataset.new;
        return editor(coll, FIELDS[coll], { active: true, date: todayISO() }, TITLES[coll][1]);
      }

      const ed = t.closest('[data-edit]');
      if (ed) {
        const coll = ed.dataset.edit;
        return editor(coll, FIELDS[coll], Store.find(coll, ed.dataset.id), 'עריכת ' + TITLES[coll][0]);
      }

      const del = t.closest('[data-del]');
      if (del) {
        if (!confirm('למחוק? הפעולה לא ניתנת לביטול.')) return;
        Store.remove(del.dataset.del, del.dataset.id);
        refreshPublic(); toast('נמחק'); return render();
      }

      const save = t.closest('[data-save]');
      if (save) {
        const coll = save.dataset.save;
        const data = collect($('#sheet-body'));
        if (!data.id) delete data.id;
        ['price', 'capacity', 'sessions', 'qty', 'amount', 'stock', 'taken', 'people', 'total'].forEach(k => {
          if (data[k] !== undefined && data[k] !== '') data[k] = Number(data[k]);
        });
        Store.upsert(coll, data);
        refreshPublic(); toast('נשמר'); view = { events: 'calendar', participants: 'people' }[coll] || coll;
        return render();
      }

      if (t.closest('[data-save-site]')) return saveSite();

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
    });

    // תמונות
    document.addEventListener('change', async e => {
      const img = e.target.closest('[data-img]');
      if (img) {
        try {
          const url = await readImage(e.target.files[0]);
          $(`#prev_${img.dataset.img}`).innerHTML = `<img src="${url}" alt="" style="height:88px;border-radius:var(--r-sm);border:1px solid var(--line)">`;
          $(`input[type=hidden][data-f="${img.dataset.img}"]`).value = url;
        } catch (err) { toast(err.message); }
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

  function saveSite() {
    const s = Store.site();
    const d = collect($('#sheet-body'));
    Object.assign(s, {
      name: d.name, tagline: d.tagline, heroEmoji: d.heroEmoji,
      heroTitle: d.heroTitle, heroText: d.heroText,
      aboutTitle: d.aboutTitle, aboutHtml: d.aboutHtml, aboutImage: d.aboutImage,
      pin: d.pin || s.pin,
      bookingSlots: String(d.slots || '').split(',').map(x => x.trim()).filter(Boolean),
      contact: {
        phone: d.c_phone, whatsapp: d.c_whatsapp, email: d.c_email,
        address: d.c_address, instagram: d.c_instagram, facebook: d.c_facebook
      }
    });
    $$('[data-stat]').forEach(el => { s.stats[el.dataset.i][el.dataset.stat] = el.value; });
    $$('[data-hour]').forEach(el => { s.hours[el.dataset.i][el.dataset.hour] = el.value; });
    Store.saveContent();
    refreshPublic();
    toast('התוכן נשמר. לפרסום לכולם — ״פרסום וגיבוי״.');
  }

  function init(refresh) { refreshPublic = refresh || (() => {}); wire(); }

  return { init, knock };
})();
