/* ==========================================================================
   app.js — החוויה של המבקר
   ========================================================================== */

const App = (() => {
  const { $, $$, esc, safeHtml, money, dateHe, dowHe, todayISO, toast, sheet, sheetFoot, closeSheet, go } = UI;

  let actTab = 'workshops';
  let pjFilter = 'all';
  let openPj = null;

  /* ======================================================================
     כותרת ומיתוג
     ====================================================================== */
  function renderBrand() {
    const s = Store.site();
    $('#brand-name').textContent = s.name;
    $('#brand-tagline').textContent = s.tagline;
    $('#foot-name').textContent = s.name;
    $('#foot-tagline').textContent = s.tagline;
    document.title = `${s.name} — ${s.tagline}`;

    const c = s.contact || {};
    const links = [];
    if (c.whatsapp) links.push(`<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">וואטסאפ</a>`);
    if (c.phone) links.push(`<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`);
    if (c.email) links.push(`<a href="mailto:${esc(c.email)}">אימייל</a>`);
    if (c.instagram) links.push(`<a href="${esc(c.instagram)}" target="_blank" rel="noopener">אינסטגרם</a>`);
    if (c.facebook) links.push(`<a href="${esc(c.facebook)}" target="_blank" rel="noopener">פייסבוק</a>`);
    $('#foot-links').innerHTML = links.join('');
  }

  function renderBadges() {
    const cc = Store.cartCount();
    const cb = $('#badge-cart'); cb.textContent = cc; cb.hidden = cc === 0;
    const fc = Store.local.favs.length;
    const fb = $('#badge-favs'); fb.textContent = fc; fb.hidden = fc === 0;
  }

  /* ======================================================================
     בית
     ====================================================================== */
  function renderHome() {
    const s = Store.site();
    $('#hero-title').innerHTML = safeHtml(s.heroTitle);
    $('#hero-text').textContent = s.heroText;

    // קרוב בזמן — אירועים מהיומן שפתוחים לקהל
    const today = todayISO();
    const soon = Store.list('events')
      .filter(e => e.date >= today && e.type !== 'internal')
      .sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')))
      .slice(0, 3);

    $('#home-upcoming').innerHTML = soon.length ? soon.map(e => {
      const full = e.capacity && Number(e.taken || 0) >= Number(e.capacity);
      return `<div class="card" style="display:flex;gap:14px;align-items:center">
        <div style="text-align:center;flex-shrink:0;min-width:52px">
          <div class="num" style="font-size:24px;line-height:1">${esc(e.date.slice(8, 10))}</div>
          <div class="tiny muted">${esc(dateHe(e.date).replace(/^\d+\s/, ''))}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600">${esc(e.title)}</div>
          <div class="tiny muted">${esc(dowHe(e.date))}${e.start ? ' · ' + esc(e.start) : ''}</div>
        </div>
        ${full ? '<span class="chip chip--stop">מלא</span>'
               : `<button class="btn btn-sage btn-sm" data-book="event" data-id="${esc(e.id)}">הרשמה</button>`}
      </div>`;
    }).join('') : `<div class="empty"><div class="em">🗓️</div><p>עוד לא נקבעו מועדים קרובים.</p>
      <button class="btn btn-quiet btn-sm" data-book="visit">בקשת מועד</button></div>`;

    // שלוש סדנאות ראשונות
    const ws = Store.list('workshops').filter(w => w.active !== false).slice(0, 3);
    $('#home-workshops').innerHTML = ws.length ? ws.map(cardItem).join('')
      : `<div class="empty"><div class="em">🪚</div><p>הסדנאות בהכנה. בקרוב כאן.</p></div>`;

    // אודות
    $('#home-about').innerHTML = `
      ${s.aboutImage ? `<div style="width:110px;height:110px;border-radius:50%;overflow:hidden;border:1px solid var(--line);margin:0 0 16px"><img src="${esc(s.aboutImage)}" alt="" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
      <h3 style="font-size:23px;margin-bottom:10px">${esc(s.aboutTitle)}</h3>
      <div class="lead">${safeHtml(s.aboutHtml)}</div>`;

    // שעות
    $('#home-hours').innerHTML = (s.hours || []).map(h =>
      `<div class="switchrow"><span style="font-weight:600">${esc(h.d)}</span><span class="num muted">${esc(h.t)}</span></div>`
    ).join('') + (s.contact?.address
      ? `<div class="switchrow"><span style="font-weight:600">כתובת</span><span class="muted">${esc(s.contact.address)}</span></div>` : '');
  }

  /* ======================================================================
     כרטיס פעילות
     ====================================================================== */
  function cardItem(x) {
    const kind = x.sessions ? 'class' : 'workshop';
    const media = x.image
      ? `style="background-image:url('${esc(x.image)}')"`
      : '';
    const meta = [];
    if (x.duration) meta.push(`<span>משך <b>${esc(x.duration)}</b></span>`);
    if (x.sessions) meta.push(`<span><b>${esc(x.sessions)}</b> מפגשים</span>`);
    if (x.ageRange) meta.push(`<span>גילאי <b>${esc(x.ageRange)}</b></span>`);
    if (x.capacity) meta.push(`<span>עד <b>${esc(x.capacity)}</b> משתתפים</span>`);
    return `<article class="item" data-open="${kind}" data-id="${esc(x.id)}">
      <div class="item-media" ${media}>${x.image ? '' : (kind === 'class' ? '👥' : '🪵')}</div>
      <div class="item-body">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <h3 class="item-title">${esc(x.title)}</h3>
          ${x.price ? `<span class="price">${money(x.price)}</span>` : ''}
        </div>
        <p class="item-sum">${esc(x.summary || '')}</p>
        ${meta.length ? `<div class="item-meta">${meta.join('')}</div>` : ''}
      </div>
    </article>`;
  }

  /* ======================================================================
     פעילויות
     ====================================================================== */
  function renderActivities() {
    $$('[data-act]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.act === actTab)));
    const box = $('#activities-list');

    if (actTab === 'private') {
      const priv = Store.list('workshops').filter(w => w.active !== false && w.private);
      box.innerHTML = `
        <div class="card" style="margin-bottom:16px">
          <h3 style="font-size:21px;margin-bottom:8px">סדנה פרטית או קבוצתית</h3>
          <p class="lead" style="margin:0 0 16px">ימי הולדת, גיבוש צוות, משפחה או חברים. אנחנו בונים את התוכן סביב מי שמגיע ומה שרוצים לקחת הביתה.</p>
          <button class="btn btn-primary btn-block" data-book="private">בקשת הצעה</button>
        </div>
        ${priv.map(cardItem).join('')}`;
      return;
    }

    const src = actTab === 'classes' ? Store.list('classes') : Store.list('workshops');
    const arr = src.filter(x => x.active !== false);
    box.innerHTML = arr.length ? arr.map(cardItem).join('')
      : `<div class="empty"><div class="em">${actTab === 'classes' ? '👥' : '🪚'}</div>
         <p>${actTab === 'classes' ? 'עוד לא נפתחו חוגים.' : 'עוד לא נפתחו סדנאות.'}</p>
         <button class="btn btn-quiet btn-sm" data-book="visit">להשאיר פרטים לעדכון</button></div>`;
  }

  /* ======================================================================
     פרטי פעילות
     ====================================================================== */
  function openActivity(kind, id) {
    const x = Store.find(kind === 'class' ? 'classes' : 'workshops', id);
    if (!x) return toast('הפעילות כבר לא זמינה');

    const facts = [];
    if (x.price) facts.push(['מחיר', money(x.price)]);
    if (x.duration) facts.push(['משך', x.duration]);
    if (x.sessions) facts.push(['מפגשים', x.sessions]);
    if (x.schedule) facts.push(['מועדים', x.schedule]);
    if (x.ageRange) facts.push(['גילאים', x.ageRange]);
    if (x.capacity) facts.push(['מקומות', x.capacity]);
    if (x.level) facts.push(['רמה', x.level]);

    const syl = (x.syllabus || []).length ? `
      <div class="eyebrow" style="margin-top:24px">מהלך המפגשים</div>
      ${x.syllabus.map((s, i) => `<div class="row">
        <span class="num muted" style="min-width:26px">${String(i + 1).padStart(2, '0')}</span>
        <div class="row-main"><div class="row-title">${esc(s.title)}</div>
        ${s.text ? `<div class="row-sub">${esc(s.text)}</div>` : ''}</div></div>`).join('')}` : '';

    sheet({
      title: x.title,
      body: `
        ${x.image ? `<img src="${esc(x.image)}" alt="" style="width:100%;height:200px;object-fit:cover;border-radius:var(--r);margin-bottom:18px">` : ''}
        <p class="lead" style="margin-top:0">${esc(x.summary || '')}</p>
        <div class="card" style="padding:6px 18px;margin:18px 0">
          ${facts.map(([k, v]) => `<div class="switchrow"><span class="lbl" style="margin:0">${esc(k)}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('')}
        </div>
        ${x.description ? `<div class="eyebrow">על הסדנה</div><div class="lead">${safeHtml(x.description)}</div>` : ''}
        ${x.materials ? `<div class="eyebrow" style="margin-top:24px">מה מקבלים</div><p class="lead" style="margin-top:0">${esc(x.materials)}</p>` : ''}
        ${syl}`,
      foot: `<button class="btn btn-primary btn-block" data-book="${kind}" data-id="${esc(x.id)}">הרשמה</button>`
    });
  }

  /* ======================================================================
     אשף ההרשמה
     ====================================================================== */
  const booking = { kind: '', refId: '', refTitle: '', date: '', slot: '', people: 1, step: 0 };

  function startBooking(kind, id) {
    const map = { workshop: 'workshops', class: 'classes' };
    let title = 'מועד במרחב';
    if (kind === 'event') {
      const e = Store.find('events', id);
      title = e ? e.title : title;
      if (e) { booking.date = e.date; booking.slot = e.start || ''; }
    } else if (map[kind]) {
      const x = Store.find(map[kind], id);
      title = x ? x.title : title;
    } else if (kind === 'private') {
      title = 'סדנה פרטית / קבוצתית';
    }
    Object.assign(booking, { kind, refId: id || '', refTitle: title, people: 1, step: kind === 'event' ? 1 : 0 });
    if (kind !== 'event') { booking.date = ''; booking.slot = ''; }
    renderBooking();
  }

  function renderBooking() {
    const steps = ['מועד', 'פרטים', 'שליחה'];
    const dots = `<div class="stepdots">${steps.map((_, i) => `<i class="${i <= booking.step ? 'on' : ''}"></i>`).join('')}</div>`;
    const me = Store.local.me;
    const wa = Store.site().contact?.whatsapp;
    let body = '', foot = '';

    if (booking.step === 0) {
      const slots = Store.site().bookingSlots || [];
      body = `${dots}
        <div class="eyebrow">מתי נוח לכם</div>
        <div class="field"><label for="bk-date">תאריך מבוקש</label>
          <input type="date" id="bk-date" min="${todayISO()}" value="${esc(booking.date)}"></div>
        <div class="field"><label>שעה</label>
          <div class="slots">${slots.map(t =>
            `<button class="slot" type="button" data-slot="${esc(t)}" aria-pressed="${booking.slot === t}">${esc(t)}</button>`).join('')}</div>
          <p class="hint">זו בקשה, לא אישור. נחזור אליכם לאישור סופי.</p></div>
        <div class="field"><label for="bk-people">כמה אתם</label>
          <input type="number" id="bk-people" min="1" max="40" value="${booking.people}"></div>`;
      foot = `<button class="btn btn-primary btn-block" data-bk="next">המשך</button>`;
    }

    if (booking.step === 1) {
      body = `${dots}
        <div class="eyebrow">איך נשיג אתכם</div>
        <div class="field"><label for="bk-name">שם מלא</label><input id="bk-name" value="${esc(me.name)}" autocomplete="name"></div>
        <div class="field"><label for="bk-phone">טלפון</label><input id="bk-phone" type="tel" value="${esc(me.phone)}" autocomplete="tel"></div>
        <div class="field"><label for="bk-email">אימייל <span class="muted">(לא חובה)</span></label><input id="bk-email" type="email" value="${esc(me.email)}" autocomplete="email"></div>
        <div class="field"><label for="bk-note">משהו שכדאי שנדע</label>
          <textarea id="bk-note" placeholder="ניסיון קודם, גיל המשתתפים, רגישויות, בקשה מיוחדת…"></textarea></div>`;
      foot = `<div class="btn-row"><button class="btn btn-quiet" data-bk="back">חזרה</button>
        <button class="btn btn-primary" style="flex:1" data-bk="submit">שליחת הבקשה</button></div>`;
    }

    if (booking.step === 2) {
      body = `<div style="text-align:center;padding:26px 6px">
          <div style="font-size:46px;margin-bottom:12px">✅</div>
          <h3 style="font-size:26px;margin-bottom:10px">הבקשה נשלחה</h3>
          <p class="lead">שמרנו אותה ב״האזור שלי״ שלכם.</p>
        </div>
        <p class="hint" style="text-align:center">${wa
          ? 'כדי שנראה אותה — שלחו לנו אותה גם בוואטסאפ בלחיצה אחת.'
          : 'צרו איתנו קשר כדי לתאם את המועד סופית.'}</p>`;
      foot = `<div class="btn-row">
        ${wa ? `<a class="btn btn-sage" style="flex:1" id="bk-wa" target="_blank" rel="noopener">שליחה בוואטסאפ</a>` : ''}
        <button class="btn btn-quiet" style="flex:1" data-bk="done">סגירה</button></div>`;
    }

    // חשוב: פותחים או מעדכנים את הגוף, ורק אחר כך את הכפתורים —
    // sheet() מאפס את התחתית.
    if (!UI.sheetOpen()) sheet({ title: booking.refTitle, body });
    else UI.sheetBody(body);
    sheetFoot(foot);

    if (booking.step === 2 && wa) {
      const el = $('#bk-wa');
      if (el) el.href = `https://wa.me/${wa.replace(/\D/g, '')}?text=${encodeURIComponent(waText())}`;
    }
  }

  function waText() {
    const me = Store.local.me;
    return `היי, אשמח להירשם ל"${booking.refTitle}".\n`
      + (booking.date ? `תאריך: ${booking.date}\n` : '')
      + (booking.slot ? `שעה: ${booking.slot}\n` : '')
      + `משתתפים: ${booking.people}\n`
      + `שם: ${me.name}\nטלפון: ${me.phone}`;
  }

  function bookingNext() {
    booking.date = $('#bk-date')?.value || '';
    booking.slot = $$('.slot').find(s => s.getAttribute('aria-pressed') === 'true')?.dataset.slot || '';
    booking.people = Math.max(1, Number($('#bk-people')?.value || 1));
    if (!booking.date) return toast('בחרו תאריך כדי להמשיך');
    booking.step = 1;
    renderBooking();
  }

  function bookingSubmit() {
    const name = $('#bk-name').value.trim();
    const phone = $('#bk-phone').value.trim();
    if (!name) return toast('צריך שם כדי לחזור אליכם');
    if (!/^[\d\-+() ]{7,}$/.test(phone)) return toast('בדקו את מספר הטלפון');

    Store.local.me = { name, phone, email: $('#bk-email').value.trim() };
    Store.saveLocal();

    Store.addRequest({
      kind: booking.kind, refId: booking.refId, refTitle: booking.refTitle,
      name, phone, email: Store.local.me.email,
      people: booking.people, date: booking.date, slot: booking.slot,
      note: $('#bk-note').value.trim()
    });

    booking.step = 2;
    renderBooking();
    renderAll();
  }

  /* ======================================================================
     פרויקטונים
     ====================================================================== */

  function pjStats(p) {
    const total = (p.steps || []).length;
    const done = Store.progressOf(p.id).filter(i => i < total).length;
    return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
  }

  function pjCard(p) {
    const { total, done, pct } = pjStats(p);
    return `<button class="pj-card" data-pj="${esc(p.id)}">
      ${done === total && total ? '<span class="done-mark">✓</span>' : ''}
      <span class="em">${esc(p.emoji || '🪚')}</span>
      <h3>${esc(p.title)}</h3>
      <div class="tags">
        <span class="tag-s lv">${esc(p.level)}</span>
        <span class="tag-s">${esc(p.time)}</span>
      </div>
      ${done ? `<div class="mini-bar"><i style="width:${pct}%"></i></div>` : ''}
    </button>`;
  }

  function renderProjects() {
    const all = Store.list('projects');
    $('#projects-intro').textContent = Store.site().projectsIntro || '';

    $$('#projects-filter [data-lvl]').forEach(b =>
      b.setAttribute('aria-selected', String(b.dataset.lvl === pjFilter)));

    // "קל" אוסף גם את "קל מאוד" ואת "קל-בינוני"; "בינוני" הוא התאמה מדויקת
    const arr = pjFilter === 'all' ? all
      : pjFilter === 'קל' ? all.filter(p => (p.level || '').startsWith('קל'))
      : all.filter(p => (p.level || '') === pjFilter);
    $('#projects-grid').innerHTML = arr.length ? arr.map(pjCard).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="em">♻️</div><p>אין כרגע פרויקטונים ברמה הזו.</p></div>`;

    // שלושה ראשונים בדף הבית
    const home = $('#home-projects');
    if (home) home.innerHTML = all.length
      ? `<div class="pj-grid">${all.slice(0, 3).map(pjCard).join('')}</div>`
      : `<div class="empty"><div class="em">♻️</div><p>הרעיונות בדרך.</p></div>`;
  }

  function projectBody(p) {
    const done = new Set(Store.progressOf(p.id));
    const total = (p.steps || []).length;
    const n = [...done].filter(i => i < total).length;
    const pct = total ? Math.round(n / total * 100) : 0;

    return `<div class="pj-progress">
        <div class="line"><span class="lbl" style="margin:0">התקדמות</span><b id="pj-count">${n} מתוך ${total}</b></div>
        <div class="bar"><i id="pj-bar" class="${n === total && total ? 'full' : ''}" style="width:${pct}%"></i></div>
      </div>
      <p class="lead" style="margin-top:0">${esc(p.summary || '')}</p>
      <div class="btn-row" style="margin-bottom:6px">
        <span class="chip">${esc(p.level)}</span>
        <span class="chip chip--flat">${esc(p.time)}</span>
      </div>

      <div class="eyebrow" style="margin-top:24px">חומרים ושאריות</div>
      <ul class="pj-spec">${(p.materials || []).map(m => `<li>${esc(m)}</li>`).join('')}</ul>

      <div class="eyebrow" style="margin-top:22px">כלים</div>
      <ul class="pj-spec">${(p.tools || []).map(m => `<li>${esc(m)}</li>`).join('')}</ul>

      <div class="eyebrow" style="margin-top:26px">שלב אחר שלב</div>
      ${(p.steps || []).map((st, i) => `<button class="step${done.has(i) ? ' done' : ''}" data-step="${i}">
        <span class="step-box">✓</span>
        <span class="step-n">${String(i + 1).padStart(2, '0')}</span>
        <span class="step-main">
          <span class="step-t">${esc(st.t)}</span>
          <span class="step-d">${esc(st.d)}</span>
        </span>
      </button>`).join('')}

      ${p.tip ? `<div class="pj-tip"><span class="em">💡</span><span>${esc(p.tip)}</span></div>` : ''}`;
  }

  function openProject(id) {
    const p = Store.find('projects', id);
    if (!p) return toast('הפרויקטון כבר לא זמין');
    openPj = p;
    sheet({
      title: `${p.emoji || '🪚'} ${p.title}`,
      body: projectBody(p),
      foot: `<div class="btn-row">
        <button class="btn btn-quiet btn-sm" data-pj-reset="${esc(p.id)}">איפוס הסימונים</button>
        <button class="btn btn-quiet btn-sm" style="flex:1" data-go="activities">רוצה ללמוד בסדנה</button>
      </div>`,
      onClose: () => { openPj = null; renderProjects(); }
    });
  }

  /** מעדכן רק את השלב שנלחץ ואת מד ההתקדמות — בלי לרנדר מחדש את כל המסך */
  function paintProgress() {
    if (!openPj) return;
    const total = (openPj.steps || []).length;
    const done = Store.progressOf(openPj.id).filter(i => i < total);
    const label = $('#pj-count'), bar = $('#pj-bar');
    if (label) label.textContent = `${done.length} מתוך ${total}`;
    if (bar) {
      bar.style.width = (total ? Math.round(done.length / total * 100) : 0) + '%';
      bar.classList.toggle('full', total > 0 && done.length === total);
    }
    $$('#sheet-body .step').forEach(el =>
      el.classList.toggle('done', done.includes(Number(el.dataset.step))));
  }


  /* ======================================================================
     דף הבית — גריד המדורים
     ====================================================================== */

  const TILES = [
    { k: 'open',     go: 'open',     ico: '🪚', label: 'הסדנה הפתוחה', cls: 't-open',   note: 'שעות עבודה חופשיות' },
    { k: 'work',     go: 'activities', ico: '🪵', label: 'סדנאות עץ',   cls: 't-work',   note: 'חד־פעמיות' },
    { k: 'proj',     go: 'projects', ico: '♻️', label: 'פרויקטונים',   cls: 't-proj',   note: 'משאריות עץ' },
    { k: 'class',    go: 'activities', ico: '👥', label: 'קבוצות וחוגים', cls: 't-class', note: 'מפגשים מתמשכים' },
    { k: 'shop',     go: 'shop',     ico: '🛒', label: 'חנות ציוד נגרות', cls: 't-shop', note: 'כלים וחומרים' },
    { k: 'moments',  go: 'moments',  ico: '📷', label: 'רגעים מהסדנה',  cls: 't-moment', note: 'מה קורה אצלנו' },
    { k: 'about',    go: '',         ico: '🌳', label: 'אודות עץ תמרי',  cls: 't-about',  note: 'הסיפור שלנו' },
    { k: 'memorial', go: 'memorial', ico: '🕯️', label: 'לזכרה',          cls: 't-mem',    note: 'תמר קדם סימן טוב ז״ל' }
  ];

  function renderTiles() {
    const box = $('#home-tiles');
    if (!box) return;
    box.innerHTML = TILES.map(t => {
      // כמה פעילויות פתוחות? מציגים דגל קטן כשיש מה להראות
      let flag = '';
      if (t.k === 'work') {
        const n = Store.list('workshops').filter(w => w.active !== false).length;
        if (n) flag = `<span class="flag">${n}</span>`;
      }
      if (t.k === 'class') {
        const n = Store.list('classes').filter(c => c.active !== false).length;
        if (n) flag = `<span class="flag">${n}</span>`;
      }
      if (t.k === 'proj') {
        const n = Store.list('projects').length;
        if (n) flag = `<span class="flag">${n}</span>`;
      }
      return `<button class="tile ${t.cls}" data-tile="${t.k}"${t.go ? ` data-go="${t.go}"` : ''}>
        ${flag}
        <span class="ico" aria-hidden="true">${t.ico}</span>
        <span class="label">${esc(t.label)}</span>
        <span class="note">${esc(t.note)}</span>
      </button>`;
    }).join('');
  }

  function openAbout() {
    const s = Store.site();
    sheet({
      title: s.aboutTitle || 'אודות עץ תמרי',
      body: `${s.aboutImage
          ? `<img src="${esc(s.aboutImage)}" alt="" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:1px solid var(--line);margin-bottom:18px">`
          : `<img src="logo-large.png" alt="" style="width:120px;height:120px;margin:0 auto 18px">`}
        <div class="lead">${safeHtml(s.aboutHtml)}</div>
        <div class="eyebrow" style="margin-top:26px">שעות פתיחה</div>
        ${(s.hours || []).map(h => `<div class="switchrow"><span style="font-weight:600">${esc(h.d)}</span><span class="num muted">${esc(h.t)}</span></div>`).join('')}
        ${s.contact?.address ? `<div class="switchrow"><span style="font-weight:600">כתובת</span><span class="muted">${esc(s.contact.address)}</span></div>` : ''}`
    });
  }

  /* ======================================================================
     הסדנה הפתוחה
     ====================================================================== */

  function renderOpen() {
    const o = Store.site().openWorkshop || {};
    $('#open-title').textContent = o.title || 'שעות עבודה חופשיות';
    $('#open-text').textContent  = o.text || '';
    $('#open-hours').innerHTML = (o.hours || []).map(h =>
      `<div class="switchrow"><span style="font-weight:600">${esc(h.d)}</span><span class="num muted">${esc(h.t)}</span></div>`
    ).join('') || '<p class="muted" style="margin:0">השעות יתעדכנו בקרוב.</p>';

    const plans = o.plans || [];
    $('#open-plans').innerHTML = plans.length ? `
      <div class="eyebrow" style="margin-top:28px">מסלולים</div>
      ${plans.map(pl => `<div class="card" style="padding:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div><div style="font-weight:600;font-size:17px">${esc(pl.name)}${pl.best ? ' <span class="chip chip--rust">הכי משתלם</span>' : ''}</div>
            <div class="tiny muted">${esc(pl.desc || '')}</div></div>
          <span class="price">${money(pl.price)}</span>
        </div></div>`).join('')}` : '';
  }

  /* ======================================================================
     לזכרה
     ====================================================================== */

  function renderMemorial() {
    const m = Store.content.memorial;
    const box = $('#memorial-body');
    if (!box || !m) return;

    box.innerHTML = `
      ${m.photo ? `<div class="mem-portrait"><img src="${esc(m.photo)}" alt="תמר קדם סימן טוב ז״ל"></div>` : ''}
      <h2>${esc(m.title)}</h2>
      <div class="mem-rule" aria-hidden="true"></div>
      ${m.lead ? `<p class="mem-lead">${esc(m.lead)}</p>` : ''}
      ${(m.paragraphs || []).map(t => `<p>${esc(t)}</p>`).join('')}
      <div class="mem-family">
        ${m.familyIntro ? `<p>${esc(m.familyIntro)}</p>` : ''}
        ${(m.familyNames || []).length
          ? `<div class="mem-names">${m.familyNames.map(n => `<span>${esc(n)}</span>`).join('')}</div>` : ''}
        ${m.familyOutro ? `<p>${esc(m.familyOutro)}</p>` : ''}
      </div>
      <p class="mem-close">יהי זכרם ברוך</p>`;
  }

  /* ======================================================================
     רגעים מהסדנה
     ====================================================================== */

  function renderMoments() {
    const arr = Store.list('moments');
    $('#moments-intro').textContent = Store.site().momentsIntro || '';
    $('#moments-grid').innerHTML = arr.length
      ? arr.map(m => `<div class="moment" ${m.image ? `style="background-image:url('${esc(m.image)}')"` : ''}>
          ${m.image ? '' : '📷'}
          ${m.caption ? `<span class="cap">${esc(m.caption)}</span>` : ''}
        </div>`).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="em">📷</div><p>התמונות הראשונות בדרך.</p></div>`;
  }

  /* ======================================================================
     חנות
     ====================================================================== */
  function renderShop() {
    const q = ($('#shop-search')?.value || '').trim().toLowerCase();
    const arr = Store.list('products')
      .filter(p => p.active !== false)
      .filter(p => !q || (p.name + ' ' + (p.desc || '') + ' ' + (p.category || '')).toLowerCase().includes(q));

    $('#shop-shelf').innerHTML = arr.length ? arr.map(p => {
      const out = p.stock !== undefined && p.stock !== '' && Number(p.stock) <= 0;
      return `<div class="prod">
        <div class="prod-media" data-prod="${esc(p.id)}" ${p.image ? `style="background-image:url('${esc(p.image)}')"` : ''}>${p.image ? '' : '🔧'}</div>
        <div class="prod-body">
          <div class="prod-name" data-prod="${esc(p.id)}">${esc(p.name)}</div>
          ${out ? '<span class="chip chip--flat">אזל</span>' : ''}
          <div class="prod-foot">
            <span class="price" style="font-size:17px">${money(p.price)}</span>
            <div style="display:flex;gap:5px">
              <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-fav="${esc(p.id)}" aria-label="מועדפים">${Store.isFav(p.id) ? '♥' : '♡'}</button>
              <button class="icon-btn" style="width:32px;height:32px;font-size:14px" data-add="${esc(p.id)}" aria-label="הוספה לעגלה" ${out ? 'disabled' : ''}>+</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="empty" style="grid-column:1/-1"><div class="em">🧰</div>
      <p>${q ? 'לא נמצא פריט מתאים. נסו מילה אחרת.' : 'המדפים עוד מתמלאים.'}</p></div>`;
  }

  function openProduct(id) {
    const p = Store.find('products', id);
    if (!p) return;
    sheet({
      title: p.name,
      body: `${p.image ? `<img src="${esc(p.image)}" alt="" style="width:100%;height:230px;object-fit:cover;border-radius:var(--r);margin-bottom:18px">` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
          <span class="price" style="font-size:28px">${money(p.price)}</span>
          ${p.category ? `<span class="chip">${esc(p.category)}</span>` : ''}
        </div>
        <p class="lead">${esc(p.desc || '')}</p>
        ${p.stock !== undefined && p.stock !== '' ? `<p class="hint">במלאי: ${esc(p.stock)}</p>` : ''}`,
      foot: `<div class="btn-row">
        <button class="btn btn-quiet" data-fav="${esc(p.id)}">${Store.isFav(p.id) ? '♥ במועדפים' : '♡ למועדפים'}</button>
        <button class="btn btn-primary" style="flex:1" data-add="${esc(p.id)}">הוספה לעגלה</button></div>`
    });
  }

  function openCart() {
    const lines = Store.local.cart;
    sheet({
      title: 'העגלה שלי',
      body: lines.length ? `
        ${lines.map(l => `<div class="row">
          <div class="row-main"><div class="row-title">${esc(l.name)}</div>
            <div class="row-sub">${money(l.price)} ליחידה</div></div>
          <div class="row-end">
            <div class="qty">
              <button data-qty="${esc(l.id)}" data-d="1" aria-label="הוספה">+</button>
              <span>${l.qty}</span>
              <button data-qty="${esc(l.id)}" data-d="-1" aria-label="הפחתה">−</button>
            </div>
            <button class="mini mini--stop" data-qty="${esc(l.id)}" data-d="0">הסרה</button>
          </div></div>`).join('')}
        <div class="total-row"><span class="lbl" style="margin:0">סה״כ</span><span class="price">${money(Store.cartTotal())}</span></div>
        <p class="hint">התשלום והאיסוף מתואמים איתנו ישירות. שליחת ההזמנה פותחת שיחה.</p>`
        : `<div class="empty"><div class="em">🛒</div><p>העגלה ריקה.</p>
           <button class="btn btn-quiet btn-sm" data-go="shop">למדפים</button></div>`,
      foot: lines.length ? `<button class="btn btn-primary btn-block" id="cart-send">שליחת ההזמנה</button>` : ''
    });
  }

  function sendOrder() {
    const me = Store.local.me;
    const lines = Store.local.cart;
    if (!lines.length) return;
    const text = 'היי, אשמח להזמין:\n'
      + lines.map(l => `• ${l.name} × ${l.qty} — ${money(l.price * l.qty)}`).join('\n')
      + `\nסה״כ: ${money(Store.cartTotal())}`
      + (me.name ? `\nשם: ${me.name}` : '') + (me.phone ? `\nטלפון: ${me.phone}` : '');

    Store.addOrder({
      items: lines.map(l => ({ ...l })), total: Store.cartTotal(),
      name: me.name, phone: me.phone
    });

    const wa = Store.site().contact?.whatsapp;
    if (wa) window.open(`https://wa.me/${wa.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    else navigator.clipboard?.writeText(text).then(() => toast('ההזמנה הועתקה — שלחו לנו אותה'));

    Store.cartClear();
    closeSheet();
    toast('ההזמנה נשלחה');
  }

  function openFavs() {
    const arr = Store.local.favs.map(id => Store.find('products', id)).filter(Boolean);
    sheet({
      title: 'המועדפים שלי',
      body: arr.length ? arr.map(p => `<div class="row">
          <div class="row-main"><div class="row-title">${esc(p.name)}</div><div class="row-sub">${money(p.price)}</div></div>
          <div class="row-end">
            <button class="mini" data-add="${esc(p.id)}">לעגלה</button>
            <button class="mini mini--stop" data-fav="${esc(p.id)}">הסרה</button>
          </div></div>`).join('')
        : `<div class="empty"><div class="em">♡</div><p>עוד לא סימנתם פריטים.</p></div>`
    });
  }

  /* ======================================================================
     האזור שלי
     ====================================================================== */
  const STATUS = {
    new:      ['נשלח', 'chip--warn'],
    approved: ['מאושר', ''],
    waitlist: ['ברשימת המתנה', 'chip--flat'],
    declined: ['לא אושר', 'chip--stop']
  };

  function renderMe() {
    const reqs = Store.local.myRequests;
    $('#me-requests').innerHTML = reqs.length ? reqs.map(r => {
      const [label, cls] = STATUS[r.status] || STATUS.new;
      return `<div class="card" style="padding:16px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div><div style="font-weight:600;font-size:16px">${esc(r.refTitle)}</div>
            <div class="tiny muted">${esc(dowHe(r.date))} ${esc(dateHe(r.date))}${r.slot ? ' · ' + esc(r.slot) : ''} · ${r.people} משתתפים</div></div>
          <span class="chip ${cls}">${label}</span>
        </div></div>`;
    }).join('') : `<div class="empty"><div class="em">📋</div><p>עוד לא נרשמתם לשום דבר.</p>
      <button class="btn btn-quiet btn-sm" data-go="activities">מה יש בלוח</button></div>`;

    const me = Store.local.me;
    $('#me-name').value = me.name; $('#me-phone').value = me.phone; $('#me-email').value = me.email;

    const c = Store.site().contact || {};
    const rows = [];
    if (c.phone) rows.push(['טלפון', `<a href="tel:${esc(c.phone)}" style="font-weight:600">${esc(c.phone)}</a>`]);
    if (c.whatsapp) rows.push(['וואטסאפ', `<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener" style="font-weight:600">שליחת הודעה</a>`]);
    if (c.email) rows.push(['אימייל', `<a href="mailto:${esc(c.email)}" style="font-weight:600">${esc(c.email)}</a>`]);
    if (c.address) rows.push(['כתובת', `<span style="font-weight:600">${esc(c.address)}</span>`]);
    $('#me-contact').innerHTML = rows.length
      ? rows.map(([k, v]) => `<div class="switchrow"><span class="lbl" style="margin:0">${k}</span>${v}</div>`).join('')
      : '<p class="muted" style="margin:0">פרטי הקשר יתעדכנו בקרוב.</p>';
  }

  /* ======================================================================
     חיווט
     ====================================================================== */
  function wire() {
    document.addEventListener('click', e => {
      const t = e.target;

      const tile = t.closest('[data-tile]');
      if (tile) {
        const k = tile.dataset.tile;
        if (k === 'work')  actTab = 'workshops';
        if (k === 'class') actTab = 'classes';
        if (k === 'work' || k === 'class') renderActivities();
        if (k === 'about') return openAbout();
        // שאר הכרטיסיות מנווטות דרך data-go
      }

      const open = t.closest('[data-open]');
      if (open) return openActivity(open.dataset.open, open.dataset.id);

      const bk = t.closest('[data-book]');
      if (bk) return startBooking(bk.dataset.book, bk.dataset.id);

      const slot = t.closest('.slot');
      if (slot) { $$('.slot').forEach(s => s.setAttribute('aria-pressed', 'false')); slot.setAttribute('aria-pressed', 'true'); return; }

      const step = t.closest('[data-bk]');
      if (step) {
        if (step.dataset.bk === 'next') return bookingNext();
        if (step.dataset.bk === 'back') { booking.step = 0; return renderBooking(); }
        if (step.dataset.bk === 'submit') return bookingSubmit();
        if (step.dataset.bk === 'done') return closeSheet();
      }

      const act = t.closest('[data-act]');
      if (act) { actTab = act.dataset.act; return renderActivities(); }

      const pjc = t.closest('[data-pj]');
      if (pjc) return openProject(pjc.dataset.pj);

      const lvl = t.closest('[data-lvl]');
      if (lvl) { pjFilter = lvl.dataset.lvl; return renderProjects(); }

      const stp = t.closest('[data-step]');
      if (stp && openPj) { Store.toggleStep(openPj.id, Number(stp.dataset.step)); return paintProgress(); }

      const rst = t.closest('[data-pj-reset]');
      if (rst) { Store.resetProgress(rst.dataset.pjReset); paintProgress(); return toast('הסימונים אופסו'); }

      const prod = t.closest('[data-prod]');
      if (prod) return openProduct(prod.dataset.prod);

      const add = t.closest('[data-add]');
      if (add) {
        const p = Store.find('products', add.dataset.add);
        if (p) { Store.cartAdd(p); toast(`${p.name} נוסף לעגלה`); }
        return;
      }

      const fav = t.closest('[data-fav]');
      if (fav) { const on = Store.favToggle(fav.dataset.fav); toast(on ? 'נשמר במועדפים' : 'הוסר מהמועדפים'); return; }

      const qty = t.closest('[data-qty]');
      if (qty) {
        const line = Store.local.cart.find(l => l.id === qty.dataset.qty);
        const d = Number(qty.dataset.d);
        Store.cartSet(qty.dataset.qty, d === 0 ? 0 : (line ? line.qty + d : 0));
        return openCart();
      }

      if (t.closest('#cart-send')) return sendOrder();
      if (t.closest('#btn-cart')) return openCart();
      if (t.closest('#btn-favs')) return openFavs();

      if (t.closest('#me-save')) {
        Store.local.me = { name: $('#me-name').value.trim(), phone: $('#me-phone').value.trim(), email: $('#me-email').value.trim() };
        Store.saveLocal();
        return toast('הפרטים נשמרו');
      }
    });

    $('#shop-search').addEventListener('input', renderShop);

    // לחיצה על הלוגו — חזרה הביתה. חמש לחיצות רצופות — כניסת ניהול.
    let taps = 0, tapTimer;
    $('#wordmark').addEventListener('click', () => {
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { if (taps < 5) go('home'); taps = 0; }, 600);
      if (taps >= 5) { taps = 0; clearTimeout(tapTimer); Admin.knock(); }
    });

    // לחיצה ארוכה על הסימן בכותרת התחתונה — כניסה חלופית
    const key = $('#secret-key');
    let holdTimer;
    const hold = () => { holdTimer = setTimeout(() => Admin.knock(), 900); };
    const release = () => clearTimeout(holdTimer);
    ['mousedown', 'touchstart'].forEach(ev => key.addEventListener(ev, hold, { passive: true }));
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => key.addEventListener(ev, release));

    if (location.hash === '#admin') Admin.knock();
  }

  /* ======================================================================
     איתחול
     ====================================================================== */
  function renderAll() {
    renderBrand();
    renderBadges();
    renderHome();
    renderTiles();
    renderOpen();
    renderMoments();
    renderMemorial();
    renderActivities();
    renderProjects();
    renderShop();
    renderMe();
  }

  async function boot() {
    try {
      await Store.init();
    } catch (e) {
      console.error(e);
      toast('טעינת התוכן נכשלה. רעננו את הדף.');
      return;
    }
    Store.onChange(() => { renderBadges(); });
    renderAll();
    wire();
    Admin.init(renderAll);
  }

  return { boot, renderAll, cardItem };
})();

document.addEventListener('DOMContentLoaded', App.boot);
