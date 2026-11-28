/* ==========================================================================
   app.js — החוויה של המבקר
   ========================================================================== */

const App = (() => {
  const { $, $$, esc, safeHtml, money, dateHe, dowHe, todayISO, toast, sheet, sheetFoot, closeSheet, go } = UI;

  const t = k => I18n.t(k);

  let actTab = 'workshops';
  let pjFilter = 'all';
  let openPj = null;

  /* ======================================================================
     כותרת ומיתוג
     ====================================================================== */
  function renderBrand() {
    const s = Store.site();
    $('#brand-name').textContent = I18n.site('name');
    $('#brand-tagline').textContent = I18n.site('tagline');
    $('#foot-name').textContent = I18n.site('name');
    $('#foot-tagline').textContent = I18n.site('tagline');
    document.title = `${I18n.site('name')} — ${I18n.site('tagline')}`;

    const c = s.contact || {};
    const links = [];
    if (c.whatsapp) links.push(`<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(t('me.whatsapp'))}</a>`);
    if (c.phone) links.push(`<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`);
    if (c.email) links.push(`<a href="mailto:${esc(c.email)}">${esc(t('me.email'))}</a>`);
    if (c.instagram) links.push(`<a href="${esc(c.instagram)}" target="_blank" rel="noopener">אינסטגרם</a>`);
    if (c.facebook) links.push(`<a href="${esc(c.facebook)}" target="_blank" rel="noopener">פייסבוק</a>`);
    $('#foot-links').innerHTML = links.join('');
  }

  function renderBadges() {
    const set = (id, n) => {
      const el = $(id);
      if (!el) return;
      el.textContent = n;
      el.hidden = n === 0;
    };
    set('#badge-cart-tab', Store.cartCount());
    set('#badge-favs-tab', Store.local.favs.length);
  }

  /* ======================================================================
     בית
     ====================================================================== */
  function renderHome() {
    const s = Store.site();
    $('#hero-title').innerHTML = safeHtml(I18n.site('heroTitle'));
    $('#hero-text').textContent = I18n.site('heroText');

    // קרוב בזמן — אירועים מהיומן שפתוחים לקהל
    const today = todayISO();
    const soon = Store.list('events')
      .filter(e => e.date >= today && e.type !== 'internal')
      .sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')))
      .slice(0, 3);

    $('#home-upcoming').innerHTML = soon.length ? soon.map(e => {
      const full = e.capacity && Number(e.taken || 0) >= Number(e.capacity);
      const ev = I18n.rec('events', e);
      return `<div class="card" style="display:flex;gap:14px;align-items:center">
        <div style="text-align:center;flex-shrink:0;min-width:52px">
          <div class="num" style="font-size:24px;line-height:1">${esc(e.date.slice(8, 10))}</div>
          <div class="tiny muted">${esc(dateHe(e.date).replace(/^\d+\s/, ''))}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600">${esc(ev.title)}</div>
          <div class="tiny muted">${esc(dowHe(e.date))}${e.start ? ' · ' + esc(e.start) : ''}</div>
        </div>
        ${full ? `<span class="chip chip--stop">${esc(t('home.full'))}</span>`
               : `<button class="btn btn-sage btn-sm" data-book="event" data-id="${esc(e.id)}">${esc(t('f.register'))}</button>`}
      </div>`;
    }).join('') : `<div class="empty"><div class="em">🗓️</div><p>${esc(t('home.noDates'))}</p>
      <button class="btn btn-quiet btn-sm" data-book="visit">${esc(t('home.askDate'))}</button></div>`;

    // שעות
    $('#home-hours').innerHTML = (I18n.site('hours') || []).map(h =>
      `<div class="switchrow"><span style="font-weight:600">${esc(h.d)}</span><span class="num muted">${esc(h.t)}</span></div>`
    ).join('') + (s.contact?.address
      ? `<div class="switchrow"><span style="font-weight:600">${esc(t('me.address'))}</span><span class="muted">${esc(s.contact.address)}</span></div>` : '');
  }

  /* ======================================================================
     כרטיס פעילות
     ====================================================================== */
  function cardItem(x0) {
    const kind = x0.sessions ? 'class' : 'workshop';
    const x = I18n.rec(kind === 'class' ? 'classes' : 'workshops', x0);
    const media = x.image
      ? `style="background-image:url('${esc(x.image)}')"`
      : '';
    const meta = [];
    if (x.duration) meta.push(`<span>${esc(t('m.duration'))} <b>${esc(x.duration)}</b></span>`);
    if (x.sessions) meta.push(`<span><b>${esc(x.sessions)}</b> ${esc(t('m.sessions'))}</span>`);
    if (x.ageRange) meta.push(`<span>${esc(t('m.ages'))} <b>${esc(x.ageRange)}</b></span>`);
    if (x.capacity) meta.push(`<span>${esc(t('m.upTo'))} <b>${esc(x.capacity)}</b> ${esc(t('m.participants'))}</span>`);
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
          <h3 style="font-size:21px;margin-bottom:8px">${esc(t('act.privTitle'))}</h3>
          <p class="lead" style="margin:0 0 16px">${esc(t('act.privText'))}</p>
          <button class="btn btn-primary btn-block" data-book="private">${esc(t('act.privCta'))}</button>
        </div>
        ${priv.map(cardItem).join('')}`;
      return;
    }

    const src = actTab === 'classes' ? Store.list('classes') : Store.list('workshops');
    const arr = src.filter(x => x.active !== false);
    box.innerHTML = arr.length ? arr.map(cardItem).join('')
      : `<div class="empty"><div class="em">${actTab === 'classes' ? '👥' : '🪚'}</div>
         <p>${esc(actTab === 'classes' ? t('act.emptyC') : t('act.emptyW'))}</p>
         <button class="btn btn-quiet btn-sm" data-book="visit">${esc(t('act.notify'))}</button></div>`;
  }

  /* ======================================================================
     פרטי פעילות
     ====================================================================== */
  function openActivity(kind, id) {
    const coll = kind === 'class' ? 'classes' : 'workshops';
    const raw = Store.find(coll, id);
    if (!raw) return toast(t('act.emptyW'));
    const x = I18n.rec(coll, raw); x.id = raw.id;

    const facts = [];
    if (x.price) facts.push([t('f.price'), money(x.price)]);
    if (x.duration) facts.push([t('f.duration'), x.duration]);
    if (x.sessions) facts.push([t('f.sessions'), x.sessions]);
    if (x.schedule) facts.push([t('f.schedule'), x.schedule]);
    if (x.ageRange) facts.push([t('f.ages'), x.ageRange]);
    if (x.capacity) facts.push([t('f.spots'), x.capacity]);
    if (x.level) facts.push([t('f.level'), x.level]);

    const syl = (x.syllabus || []).length ? `
      <div class="eyebrow" style="margin-top:24px">${esc(t('f.syllabus'))}</div>
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
        ${x.description ? `<div class="eyebrow">${esc(t('f.about'))}</div><div class="lead">${safeHtml(x.description)}</div>` : ''}
        ${x.materials ? `<div class="eyebrow" style="margin-top:24px">${esc(t('f.included'))}</div><p class="lead" style="margin-top:0">${esc(x.materials)}</p>` : ''}
        ${syl}`,
      foot: `<button class="btn btn-primary btn-block" data-book="${kind}" data-id="${esc(x.id)}">${esc(t('f.register'))}</button>`
    });
  }

  /* ======================================================================
     אשף ההרשמה
     ====================================================================== */
  const booking = { kind: '', refId: '', refTitle: '', date: '', slot: '', people: 1, step: 0 };

  function startBooking(kind, id) {
    const map = { workshop: 'workshops', class: 'classes' };
    let title = t('bk.visit');
    if (kind === 'event') {
      const e = Store.find('events', id);
      title = e ? (I18n.f('events', e, 'title') || e.title) : title;
      if (e) { booking.date = e.date; booking.slot = e.start || ''; }
    } else if (map[kind]) {
      const x = Store.find(map[kind], id);
      title = x ? (I18n.f(map[kind], x, 'title') || x.title) : title;
    } else if (kind === 'private') {
      title = t('act.privTitle');
    }
    Object.assign(booking, { kind, refId: id || '', refTitle: title, people: 1, step: kind === 'event' ? 1 : 0 });
    if (kind !== 'event') { booking.date = ''; booking.slot = ''; }
    renderBooking();
  }

  function renderBooking() {
    const steps = [0, 1, 2];
    const dots = `<div class="stepdots">${steps.map((_, i) => `<i class="${i <= booking.step ? 'on' : ''}"></i>`).join('')}</div>`;
    const me = Store.local.me;
    const wa = Store.site().contact?.whatsapp;
    let body = '', foot = '';

    if (booking.step === 0) {
      const slots = Store.site().bookingSlots || [];
      body = `${dots}
        <div class="eyebrow">${esc(t('bk.when'))}</div>
        <div class="field"><label for="bk-date">${esc(t('bk.date'))}</label>
          <input type="date" id="bk-date" min="${todayISO()}" value="${esc(booking.date)}"></div>
        <div class="field"><label>${esc(t('bk.time'))}</label>
          <div class="slots">${slots.map(t =>
            `<button class="slot" type="button" data-slot="${esc(t)}" aria-pressed="${booking.slot === t}">${esc(t)}</button>`).join('')}</div>
          <p class="hint">${esc(t('bk.hint'))}</p></div>
        <div class="field"><label for="bk-people">${esc(t('bk.howMany'))}</label>
          <input type="number" id="bk-people" min="1" max="40" value="${booking.people}"></div>`;
      foot = `<button class="btn btn-primary btn-block" data-bk="next">${esc(t('bk.next'))}</button>`;
    }

    if (booking.step === 1) {
      body = `${dots}
        <div class="eyebrow">${esc(t('bk.reach'))}</div>
        <div class="field"><label for="bk-name">${esc(t('bk.fullName'))}</label><input id="bk-name" value="${esc(me.name)}" autocomplete="name"></div>
        <div class="field"><label for="bk-phone">${esc(t('me.phone'))}</label><input id="bk-phone" type="tel" value="${esc(me.phone)}" autocomplete="tel"></div>
        <div class="field"><label for="bk-email">${esc(t('me.email'))} <span class="muted">${esc(t('bk.optional'))}</span></label><input id="bk-email" type="email" value="${esc(me.email)}" autocomplete="email"></div>
        <div class="field"><label for="bk-note">${esc(t('bk.note'))}</label>
          <textarea id="bk-note" placeholder="${esc(t('bk.notePh'))}"></textarea></div>`;
      foot = `<div class="btn-row"><button class="btn btn-quiet" data-bk="back">${esc(t('bk.back'))}</button>
        <button class="btn btn-primary" style="flex:1" data-bk="submit">${esc(t('bk.submit'))}</button></div>`;
    }

    if (booking.step === 2) {
      body = `<div style="text-align:center;padding:26px 6px">
          <div style="font-size:46px;margin-bottom:12px">✅</div>
          <h3 style="font-size:26px;margin-bottom:10px">${esc(t('bk.sent'))}</h3>
          <p class="lead">${esc(t('bk.sentText'))}</p>
        </div>
        <p class="hint" style="text-align:center">${esc(wa ? t('bk.sentWa') : t('bk.sentNoWa'))}</p>`;
      foot = `<div class="btn-row">
        ${wa ? `<a class="btn btn-sage" style="flex:1" id="bk-wa" target="_blank" rel="noopener">${esc(t('bk.viaWa'))}</a>` : ''}
        <button class="btn btn-quiet" style="flex:1" data-bk="done">${esc(t('bk.close'))}</button></div>`;
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
    if (!booking.date) return toast(t('bk.needDate'));
    booking.step = 1;
    renderBooking();
  }

  function bookingSubmit() {
    const name = $('#bk-name').value.trim();
    const phone = $('#bk-phone').value.trim();
    if (!name) return toast(t('bk.needName'));
    if (!/^[\d\-+() ]{7,}$/.test(phone)) return toast(t('bk.badPhone'));

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

  function pjCard(p0) {
    const p = I18n.rec('projects', p0);
    const { total, done, pct } = pjStats(p0);
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
    $('#projects-intro').textContent = I18n.site('projectsIntro') || '';

    $$('#projects-filter [data-lvl]').forEach(b =>
      b.setAttribute('aria-selected', String(b.dataset.lvl === pjFilter)));

    // "קל" אוסף גם את "קל מאוד" ואת "קל-בינוני"; "בינוני" הוא התאמה מדויקת
    const arr = pjFilter === 'all' ? all
      : pjFilter === 'קל' ? all.filter(p => (p.level || '').startsWith('קל'))
      : all.filter(p => (p.level || '') === pjFilter);
    $('#projects-grid').innerHTML = arr.length ? arr.map(pjCard).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="em">♻️</div><p>${esc(t('proj.empty'))}</p></div>`;

  }

  function projectBody(p) {
    const done = new Set(Store.progressOf(p.id));
    const total = (p.steps || []).length;
    const n = [...done].filter(i => i < total).length;
    const pct = total ? Math.round(n / total * 100) : 0;

    return `<div class="pj-progress">
        <div class="line"><span class="lbl" style="margin:0">${esc(t('proj.progress'))}</span><b id="pj-count">${n} ${esc(t('proj.of'))} ${total}</b></div>
        <div class="bar"><i id="pj-bar" class="${n === total && total ? 'full' : ''}" style="width:${pct}%"></i></div>
      </div>
      <p class="lead" style="margin-top:0">${esc(p.summary || '')}</p>
      <div class="btn-row" style="margin-bottom:6px">
        <span class="chip">${esc(p.level)}</span>
        <span class="chip chip--flat">${esc(p.time)}</span>
      </div>

      <div class="eyebrow" style="margin-top:24px">${esc(t('proj.materials'))}</div>
      <ul class="pj-spec">${(p.materials || []).map(m => `<li>${esc(m)}</li>`).join('')}</ul>

      <div class="eyebrow" style="margin-top:22px">${esc(t('proj.tools'))}</div>
      <ul class="pj-spec">${(p.tools || []).map(m => `<li>${esc(m)}</li>`).join('')}</ul>

      <div class="eyebrow" style="margin-top:26px">${esc(t('proj.steps'))}</div>
      ${(p.steps || []).map((st, i) => {
        const il = (typeof Illus !== 'undefined') ? Illus.forStep(st) : '';
        return `<button class="step${done.has(i) ? ' done' : ''}" data-step="${i}">
        <span class="step-box">✓</span>
        ${il
          ? `<span class="step-il"><i class="step-no">${i + 1}</i>${il}</span>`
          : `<span class="step-n">${String(i + 1).padStart(2, '0')}</span>`}
        <span class="step-main">
          <span class="step-t">${esc(st.t)}</span>
          <span class="step-d">${esc(st.d)}</span>
        </span>
      </button>`;
      }).join('')}

      ${p.tip ? `<div class="pj-tip"><span class="em">💡</span><span>${esc(p.tip)}</span></div>` : ''}`;
  }

  function openProject(id) {
    const raw = Store.find('projects', id);
    if (!raw) return toast(t('proj.empty'));
    const p = I18n.rec('projects', raw);
    p.id = raw.id;
    openPj = p;
    sheet({
      title: `${p.emoji || '🪚'} ${p.title}`,
      body: projectBody(p),
      foot: `<div class="btn-row">
        <button class="btn btn-quiet btn-sm" data-pj-reset="${esc(p.id)}">${esc(t('proj.reset'))}</button>
        <button class="btn btn-quiet btn-sm" style="flex:1" data-go="activities">${esc(t('proj.learn'))}</button>
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
    if (label) label.textContent = `${done.length} ${I18n.t('proj.of')} ${total}`;
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
    { k: 'open',     go: 'open',       ico: '🪚', cls: 't-open'   },
    { k: 'work',     go: 'activities', ico: '🪵', cls: 't-work'   },
    { k: 'proj',     go: 'projects',   ico: '♻️', cls: 't-proj'   },
    { k: 'class',    go: 'activities', ico: '👥', cls: 't-class'  },
    { k: 'shop',     go: 'shop',       ico: '🛒', cls: 't-shop'   },
    { k: 'moments',  go: 'moments',    ico: '📷', cls: 't-moment' },
    { k: 'about',    go: '',           ico: '🌳', cls: 't-about'  },
    { k: 'memorial', go: 'memorial',   ico: '🕯️', cls: 't-mem'    }
  ];

  function renderTiles() {
    const box = $('#home-tiles');
    if (!box) return;
    box.innerHTML = TILES.map(tl => {
      // כמה פעילויות פתוחות? מציגים דגל קטן כשיש מה להראות
      let flag = '';
      if (tl.k === 'work') {
        const n = Store.list('workshops').filter(w => w.active !== false).length;
        if (n) flag = `<span class="flag">${n}</span>`;
      }
      if (tl.k === 'class') {
        const n = Store.list('classes').filter(c => c.active !== false).length;
        if (n) flag = `<span class="flag">${n}</span>`;
      }
      if (tl.k === 'proj') {
        const n = Store.list('projects').length;
        if (n) flag = `<span class="flag">${n}</span>`;
      }
      return `<button class="tile ${tl.cls}" data-tile="${tl.k}"${tl.go ? ` data-go="${tl.go}"` : ''}>
        ${flag}
        <span class="ico" aria-hidden="true">${tl.ico}</span>
        <span class="label">${esc(I18n.t('tile.' + tl.k))}</span>
        <span class="note">${esc(I18n.t('tile.' + tl.k + '.note'))}</span>
      </button>`;
    }).join('');
  }

  function openAbout() {
    const s = Store.site();
    sheet({
      title: I18n.site('aboutTitle') || t('tile.about'),
      body: `${s.aboutImage
          ? `<img src="${esc(s.aboutImage)}" alt="" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:1px solid var(--line);margin-bottom:18px">`
          : `<img src="logo-large.png" alt="" style="width:120px;height:120px;margin:0 auto 18px">`}
        <div class="lead">${safeHtml(I18n.site('aboutHtml'))}</div>
        <div class="eyebrow" style="margin-top:26px">${esc(t('home.hours'))}</div>
        ${(I18n.site('hours') || []).map(h => `<div class="switchrow"><span style="font-weight:600">${esc(h.d)}</span><span class="num muted">${esc(h.t)}</span></div>`).join('')}
        ${s.contact?.address ? `<div class="switchrow"><span style="font-weight:600">${esc(t('me.address'))}</span><span class="muted">${esc(s.contact.address)}</span></div>` : ''}`
    });
  }

  /* ======================================================================
     הסדנה הפתוחה
     ====================================================================== */

  function renderOpen() {
    const o = I18n.openWorkshop() || {};
    $('#open-title').textContent = o.title || '';
    $('#open-text').textContent  = o.text || '';
    $('#open-hours').innerHTML = (o.hours || []).map(h =>
      `<div class="switchrow"><span style="font-weight:600">${esc(h.d)}</span><span class="num muted">${esc(h.t)}</span></div>`
    ).join('') || '';

    const plans = o.plans || [];
    const demo = typeof Demo !== 'undefined' && Demo.isOn();
    $('#open-plans').innerHTML = plans.length ? `
      <div class="eyebrow" style="margin-top:28px">${esc(t('open.plans'))}</div>
      ${plans.map(pl => `<div class="plan${pl.best ? ' best' : ''}">
        <div class="plan-top">
          <div><div class="plan-name">${esc(pl.name)}${pl.best ? ` <span class="chip chip--rust">${esc(t('open.best'))}</span>` : ''}</div>
            <div class="plan-desc">${esc(pl.desc || '')}</div></div>
          <span class="price">${money(pl.price)}</span>
        </div>
        ${demo ? `<button class="btn btn-sage btn-block btn-sm" style="margin-top:14px" data-buy="${esc(pl.name)}">${esc(t('open.buy'))}</button>` : ''}
      </div>`).join('')}` : '';
    const soon = $('#open-soon');
    if (soon) soon.hidden = demo;
  }

  /* ======================================================================
     לזכרה
     ====================================================================== */

  function renderMemorial() {
    const m = I18n.memorial();
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
      <p class="mem-close">${esc(t('mem.closing'))}</p>`;
  }

  /* ======================================================================
     רגעים מהסדנה
     ====================================================================== */

  function renderMoments() {
    const arr = Store.list('moments');
    $('#moments-intro').textContent = I18n.site('momentsIntro') || '';
    $('#moments-grid').innerHTML = arr.length
      ? arr.map(m => `<div class="moment" ${m.image ? `style="background-image:url('${esc(m.image)}')"` : ''}>
          ${m.image ? '' : '📷'}
          ${m.caption ? `<span class="cap">${esc(m.caption)}</span>` : ''}
        </div>`).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="em">📷</div><p>${esc(t('mom.empty'))}</p></div>`;
  }

  /* ======================================================================
     חנות
     ====================================================================== */
  function renderShop() {
    const q = ($('#shop-search')?.value || '').trim().toLowerCase();
    const arr = Store.list('products')
      .filter(p => p.active !== false)
      .map(p0 => { const p = I18n.rec('products', p0); p.id = p0.id; p.stock = p0.stock; p.price = p0.price; return p; })
      .filter(p => !q || (p.name + ' ' + (p.desc || '') + ' ' + (p.category || '')).toLowerCase().includes(q));

    $('#shop-shelf').innerHTML = arr.length ? arr.map(p => {
      const out = p.stock !== undefined && p.stock !== '' && Number(p.stock) <= 0;
      return `<div class="prod">
        <div class="prod-media" data-prod="${esc(p.id)}" ${p.image ? `style="background-image:url('${esc(p.image)}')"` : ''}>${p.image ? '' : '🔧'}</div>
        <div class="prod-body">
          <div class="prod-name" data-prod="${esc(p.id)}">${esc(p.name)}</div>
          ${out ? `<span class="chip chip--flat">${esc(t('shop.out'))}</span>` : ''}
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
      <p>${esc(q ? t('shop.noMatch') : t('shop.empty'))}</p></div>`;
  }

  function openProduct(id) {
    const raw = Store.find('products', id);
    if (!raw) return;
    const p = I18n.rec('products', raw); p.id = raw.id; p.price = raw.price; p.stock = raw.stock;
    sheet({
      title: p.name,
      body: `${p.image ? `<img src="${esc(p.image)}" alt="" style="width:100%;height:230px;object-fit:cover;border-radius:var(--r);margin-bottom:18px">` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
          <span class="price" style="font-size:28px">${money(p.price)}</span>
          ${p.category ? `<span class="chip">${esc(p.category)}</span>` : ''}
        </div>
        <p class="lead">${esc(p.desc || '')}</p>
        ${p.stock !== undefined && p.stock !== '' ? `<p class="hint">${esc(t('shop.stock'))}: ${esc(p.stock)}</p>` : ''}`,
      foot: `<div class="btn-row">
        <button class="btn btn-quiet" data-fav="${esc(p.id)}">${esc(Store.isFav(p.id) ? t('shop.faved') : t('shop.fav'))}</button>
        <button class="btn btn-primary" style="flex:1" data-add="${esc(p.id)}">${esc(t('shop.addCart'))}</button></div>`
    });
  }

  function openCart() {
    const lines = Store.local.cart;
    sheet({
      title: t('cart.title'),
      body: lines.length ? `
        ${lines.map(l => `<div class="row">
          <div class="row-main"><div class="row-title">${esc(l.name)}</div>
            <div class="row-sub">${money(l.price)} ${esc(t('cart.each'))}</div></div>
          <div class="row-end">
            <div class="qty">
              <button data-qty="${esc(l.id)}" data-d="1" aria-label="הוספה">+</button>
              <span>${l.qty}</span>
              <button data-qty="${esc(l.id)}" data-d="-1" aria-label="הפחתה">−</button>
            </div>
            <button class="mini mini--stop" data-qty="${esc(l.id)}" data-d="0">${esc(t('cart.remove'))}</button>
          </div></div>`).join('')}
        <div class="total-row"><span class="lbl" style="margin:0">${esc(t('cart.total'))}</span><span class="price">${money(Store.cartTotal())}</span></div>
        <p class="hint">${esc(t('cart.note'))}</p>`
        : `<div class="empty"><div class="em">🛒</div><p>${esc(t('cart.empty'))}</p>
           <button class="btn btn-quiet btn-sm" data-go="shop">${esc(t('cart.toShop'))}</button></div>`,
      foot: lines.length ? `<button class="btn btn-primary btn-block" id="cart-send">${esc(t('cart.send'))}</button>` : ''
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
    else navigator.clipboard?.writeText(text).then(() => toast(t('cart.copied')));

    Store.cartClear();
    closeSheet();
    toast(t('cart.sent'));
  }

  function openFavs() {
    const arr = Store.local.favs.map(id => Store.find('products', id)).filter(Boolean);
    sheet({
      title: t('favs.title'),
      body: arr.length ? arr.map(p0 => { const p = I18n.rec('products', p0); p.id = p0.id; p.price = p0.price;
        return `<div class="row">
          <div class="row-main"><div class="row-title">${esc(p.name)}</div><div class="row-sub">${money(p.price)}</div></div>
          <div class="row-end">
            <button class="mini" data-add="${esc(p.id)}">${esc(t('favs.toCart'))}</button>
            <button class="mini mini--stop" data-fav="${esc(p.id)}">${esc(t('cart.remove'))}</button>
          </div></div>`; }).join('')
        : `<div class="empty"><div class="em">♡</div><p>${esc(t('favs.empty'))}</p></div>`
    });
  }

  /* ======================================================================
     האזור שלי
     ====================================================================== */
  const STATUS = {
    new:      ['st.new', 'chip--warn'],
    approved: ['st.approved', ''],
    waitlist: ['st.waitlist', 'chip--flat'],
    declined: ['st.declined', 'chip--stop']
  };

  function renderMe() {
    const reqs = Store.local.myRequests;
    $('#me-requests').innerHTML = reqs.length ? reqs.map(r => {
      const [lk, cls] = STATUS[r.status] || STATUS.new;
      const label = t(lk);
      return `<div class="card" style="padding:16px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div><div style="font-weight:600;font-size:16px">${esc(r.refTitle)}</div>
            <div class="tiny muted">${esc(dowHe(r.date))} ${esc(dateHe(r.date))}${r.slot ? ' · ' + esc(r.slot) : ''} · ${r.people} ${esc(t('m.participants'))}</div></div>
          <span class="chip ${cls}">${label}</span>
        </div></div>`;
    }).join('') : `<div class="empty"><div class="em">📋</div><p>${esc(t('me.none'))}</p>
      <button class="btn btn-quiet btn-sm" data-go="activities">${esc(t('me.whatsOn'))}</button></div>`;

    const me = Store.local.me;
    $('#me-name').value = me.name; $('#me-phone').value = me.phone; $('#me-email').value = me.email;

    const c = Store.site().contact || {};
    const rows = [];
    if (c.phone) rows.push([t('me.phone'), `<a href="tel:${esc(c.phone)}" style="font-weight:600">${esc(c.phone)}</a>`]);
    if (c.whatsapp) rows.push([t('me.whatsapp'), `<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener" style="font-weight:600">${esc(t('me.sendMsg'))}</a>`]);
    if (c.email) rows.push([t('me.email'), `<a href="mailto:${esc(c.email)}" style="font-weight:600">${esc(c.email)}</a>`]);
    if (c.address) rows.push([t('me.address'), `<span style="font-weight:600">${esc(c.address)}</span>`]);
    $('#me-contact').innerHTML = rows.length
      ? rows.map(([k, v]) => `<div class="switchrow"><span class="lbl" style="margin:0">${k}</span>${v}</div>`).join('')
      : `<p class="muted" style="margin:0">${esc(t('me.contactSoon'))}</p>`;
  }

  /* ======================================================================
     חיווט
     ====================================================================== */
  function wire() {
    document.addEventListener('click', e => {
      const t = e.target;

      const lb = t.closest('#lang-pill [data-lang]');
      if (lb) {
        if (lb.dataset.lang !== I18n.get()) I18n.set(lb.dataset.lang);
        return;
      }

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
      if (t.closest('#tab-cart')) return openCart();
      if (t.closest('#tab-favs')) return openFavs();

      if (t.closest('#me-save')) {
        Store.local.me = { name: $('#me-name').value.trim(), phone: $('#me-phone').value.trim(), email: $('#me-email').value.trim() };
        Store.saveLocal();
        return toast(t('me.saved'));
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
  /** מחליף את הטקסט בכל אלמנט מתויג ב-HTML הקבוע */
  function paintStatic() {
    $$('[data-i18n]').forEach(el => { el.textContent = I18n.t(el.dataset.i18n); });
    $$('#lang-pill [data-lang]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.lang === I18n.get())));
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = I18n.t(el.dataset.i18nPh); });
    const d = document.querySelector('meta[name="description"]');
    if (d) d.content = I18n.site('heroText') || d.content;
  }

  function renderAll() {
    paintStatic();
    const demoOn = typeof Demo !== 'undefined' && Demo.isOn();
    const ribbon = $('#demo-ribbon');
    if (ribbon) ribbon.hidden = !demoOn;
    if (typeof Account !== 'undefined') Account.render();
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
    I18n.load();
    I18n.onChange(() => { renderAll(); });
    if (typeof Demo !== 'undefined') {
      Demo.load();
      Demo.onChange(() => renderAll());
    }
    Store.onChange(() => { renderBadges(); });
    renderAll();
    wire();
    Admin.init(renderAll);
    if (typeof Account !== 'undefined') Account.init(renderAll);
    if (typeof Nav !== 'undefined') Nav.init();
  }

  return { boot, renderAll, cardItem };
})();

document.addEventListener('DOMContentLoaded', App.boot);
