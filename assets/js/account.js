/* ==========================================================================
   account.js — צד המשתמש בסביבת ההדגמה
   הרשמה, התחברות, האזור האישי, טופס הבטיחות ובקשות רכישה.
   ========================================================================== */

const Account = (() => {
  const { $, $$, esc, money, dateHe, toast, sheet, sheetFoot, closeSheet } = UI;

  let refreshAll = () => {};

  /* ======================================================================
     הרשמה והתחברות
     ====================================================================== */

  function authSheet(mode = 'register') {
    const reg = mode === 'register';
    sheet({
      title: reg ? 'הרשמה' : 'כניסה',
      body: `
        <div class="alert ok" style="margin-bottom:18px">
          <span>🧪</span><span>סביבת הדגמה. המשתמשים נשמרים על המכשיר הזה בלבד.</span>
        </div>

        <button class="btn btn-quiet btn-block" id="auth-google" style="margin-bottom:8px">
          המשך עם Google
        </button>
        <p class="hint" style="text-align:center;margin:0 0 18px">
          בהדגמה זה יוצר משתמש לדוגמה. בגרסה האמיתית זו התחברות אמיתית.
        </p>

        <div class="eyebrow">${reg ? 'או הרשמה עם פרטים' : 'כניסה עם אימייל'}</div>
        ${reg ? `<div class="field"><label for="au-name">שם מלא</label><input id="au-name" autocomplete="name"></div>` : ''}
        <div class="field"><label for="au-mail">אימייל</label><input id="au-mail" type="email" autocomplete="email"></div>
        <div class="field"><label for="au-pass">סיסמה</label><input id="au-pass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
        ${reg ? `
          <div class="field"><label for="au-phone">טלפון <span class="muted">(לא חובה)</span></label><input id="au-phone" type="tel" autocomplete="tel"></div>
          <div class="switchrow">
            <label for="au-minor" style="margin:0">המשתמש מתחת לגיל 18</label>
            <input type="checkbox" id="au-minor" style="width:auto">
          </div>
          <div class="field" id="au-guardian-wrap" hidden style="margin-top:12px">
            <label for="au-guardian">שם ההורה או האפוטרופוס</label>
            <input id="au-guardian">
            <p class="hint">קטין אינו יכול לחתום בעצמו על הצהרת בטיחות. ההורה הוא שחותם.</p>
          </div>` : ''}`,
      foot: `<div class="btn-row">
        <button class="btn btn-quiet" data-auth-switch="${reg ? 'login' : 'register'}">${reg ? 'כבר רשום' : 'הרשמה'}</button>
        <button class="btn btn-primary" style="flex:1" data-auth="${mode}">${reg ? 'יצירת חשבון' : 'כניסה'}</button>
      </div>`
    });

    const mn = $('#au-minor');
    if (mn) mn.addEventListener('change', () => { $('#au-guardian-wrap').hidden = !mn.checked; });
  }

  function doRegister() {
    try {
      Demo.register({
        name: $('#au-name').value,
        email: $('#au-mail').value,
        password: $('#au-pass').value,
        phone: $('#au-phone').value,
        isMinor: $('#au-minor').checked,
        guardianName: $('#au-guardian').value
      });
      closeSheet(); refreshAll(); toast('נרשמת בהצלחה');
    } catch (e) { toast(e.message); }
  }

  function doLogin() {
    try {
      Demo.login($('#au-mail').value, $('#au-pass').value);
      closeSheet(); refreshAll(); toast('ברוך שובך');
    } catch (e) { toast(e.message); }
  }

  function doGoogle() {
    const n = Demo.users().length + 1;
    try {
      Demo.register({
        name: `משתמש הדגמה ${n}`,
        email: `demo${n}@gmail.test`,
        password: 'google-demo',
        phone: ''
      });
      closeSheet(); refreshAll(); toast('נכנסת עם Google (הדגמה)');
    } catch (e) { toast(e.message); }
  }

  /* ======================================================================
     טופס בטיחות וחתימה
     ====================================================================== */

  const SAFETY = [
    'אני מצהיר/ה שקיבלתי הדרכה על השימוש בכלים ובמכונות שבמרחב, ואשתמש בהם רק לאחר שהוסברו לי.',
    'אני מתחייב/ת להרכיב משקפי מגן בכל עבודה עם מכונה, ולאסוף שיער ארוך ובגדים רפויים.',
    'ידוע לי שאין להפעיל מכונה שלא קיבלתי עליה הדרכה, ושאין לעבוד במרחב לבד.',
    'אני מצהיר/ה שמצבי הבריאותי מאפשר עבודה פיזית בנגרות, ושאיידע את הצוות על כל מגבלה רפואית, הריון, רגישות לאבק או טיפול תרופתי שעלול להשפיע על הריכוז.',
    'ידוע לי שאין לעבוד תחת השפעת אלכוהול או חומרים אחרים.',
    'אני מתחייב/ת לדווח מיד על כל תקלה, פציעה או אירוע חריג.'
  ];

  function safetySheet(onDone) {
    const u = Demo.current();
    if (!u) return;
    const signer = u.isMinor ? u.guardianName : u.name;

    sheet({
      title: 'הצהרת בטיחות ובריאות',
      body: `
        ${u.isMinor ? `<div class="alert warn" style="margin-bottom:16px">
          <span>👤</span><span>המשתמש קטין. החתימה היא של <strong>${esc(u.guardianName)}</strong> כהורה או אפוטרופוס.</span></div>` : ''}
        <p class="lead" style="margin-top:0">קראו את הסעיפים, סמנו שהבנתם, וחתמו למטה.</p>
        ${SAFETY.map((t, i) => `
          <label class="switchrow" style="align-items:flex-start;gap:12px;cursor:pointer">
            <input type="checkbox" class="sf-chk" data-i="${i}" style="width:auto;margin-top:4px;flex-shrink:0">
            <span style="font-size:14.5px;line-height:1.5;font-weight:400">${esc(t)}</span>
          </label>`).join('')}

        <div class="eyebrow" style="margin-top:24px">חתימה</div>
        <canvas id="sig" class="sig-pad" width="600" height="340"></canvas>
        <div class="sig-row">
          <span class="hint">חתמו באצבע על המסגרת · ${esc(signer || '')}</span>
          <button class="mini" id="sig-clear">ניקוי</button>
        </div>`,
      foot: `<button class="btn btn-primary btn-block" id="sig-save">אישור וחתימה</button>`
    });

    const cv = $('#sig');
    const ctx = cv.getContext('2d');
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#21241F';
    let drawing = false, dirty = false;

    const pos = e => {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
    };
    const start = e => { e.preventDefault(); drawing = true; dirty = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move  = e => { if (!drawing) return; e.preventDefault(); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end   = () => { drawing = false; };

    ['mousedown', 'touchstart'].forEach(k => cv.addEventListener(k, start, { passive: false }));
    ['mousemove', 'touchmove'].forEach(k => cv.addEventListener(k, move, { passive: false }));
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(k => cv.addEventListener(k, end));

    $('#sig-clear').addEventListener('click', () => { ctx.clearRect(0, 0, cv.width, cv.height); dirty = false; });

    $('#sig-save').addEventListener('click', () => {
      if ($$('.sf-chk').some(c => !c.checked)) return toast('צריך לסמן את כל הסעיפים');
      if (!dirty) return toast('חסרה חתימה');
      try {
        Demo.signSafety(u.id, cv.toDataURL('image/png'), signer);
        closeSheet(); refreshAll(); toast('הטופס נחתם');
        if (onDone) onDone();
      } catch (e) { toast(e.message); }
    });
  }

  /* ======================================================================
     בקשת רכישה
     ====================================================================== */

  function buy(planName) {
    const u = Demo.current();
    if (!u) return authSheet('register');

    const plans = (Store.site().openWorkshop || {}).plans || [];
    const plan = plans.find(p => p.name === planName)
      || { name: planName, price: 0 };

    // טופס הבטיחות נדרש פעם אחת, לפני הרכישה הראשונה
    if (!u.safetySignedAt) return safetySheet(() => buy(planName));

    const p = Demo.requestPurchase(u.id, plan);
    const wa = Store.site().contact?.whatsapp;
    const text = `היי, אשמח לרכוש: ${plan.name} (${money(plan.price)})\nשם: ${u.name}\nאימייל: ${u.email}${u.phone ? '\nטלפון: ' + u.phone : ''}`;

    sheet({
      title: 'הבקשה נשלחה',
      body: `<div style="text-align:center;padding:22px 6px">
          <div style="font-size:44px;margin-bottom:12px">📨</div>
          <h3 style="font-size:24px;margin-bottom:8px">${esc(plan.name)}</h3>
          <p class="lead">${money(plan.price)}</p>
        </div>
        <div class="alert warn"><span>⏳</span><span>הבקשה ממתינה לאישור. ברגע שנאשר, הכרטיסייה תופיע באזור האישי שלכם.</span></div>
        <p class="hint" style="text-align:center">התשלום מתואם איתנו ישירות. אין סליקה באפליקציה.</p>`,
      foot: `<div class="btn-row">
        ${wa ? `<a class="btn btn-sage" style="flex:1" target="_blank" rel="noopener"
              href="https://wa.me/${esc(wa.replace(/\D/g, ''))}?text=${encodeURIComponent(text)}">שליחה בוואטסאפ</a>` : ''}
        <button class="btn btn-quiet" style="flex:1" data-close-sheet>סגירה</button></div>`
    });
    refreshAll();
    return p;
  }

  /* ======================================================================
     האזור האישי
     ====================================================================== */

  function render() {
    const box = $('#me-account');
    if (!box) return;

    if (!Demo.isOn()) { box.innerHTML = ''; return; }

    const u = Demo.current();
    if (!u) {
      box.innerHTML = `
        <div class="acct" style="text-align:center">
          <div style="font-size:38px;margin-bottom:10px">👋</div>
          <h3 style="font-size:20px;margin-bottom:6px">האזור האישי</h3>
          <p class="muted" style="margin:0 0 16px">התחברו כדי לנהל כרטיסיות, לשריין מקום ולהציג את קוד הכניסה.</p>
          <div class="btn-row" style="justify-content:center">
            <button class="btn btn-primary" data-auth-open="register">הרשמה</button>
            <button class="btn btn-quiet" data-auth-open="login">כניסה</button>
          </div>
        </div>`;
      return;
    }

    const card   = Demo.activeCard(u.id);
    const left   = Demo.entriesLeft(u.id);
    const ins    = Demo.insurance(u.id);
    const alerts = Demo.alertsFor(u.id);
    const visits = Demo.visitsOf(u.id);
    const unlimited = card && card.kind === 'unlimited';

    box.innerHTML = `
      <div class="acct">
        <div class="acct-head">
          <div class="acct-avatar">${esc((u.name || '?').trim().charAt(0))}</div>
          <div style="flex:1;min-width:0">
            <div class="acct-name">${esc(u.name)}</div>
            <div class="acct-mail">${esc(u.email)}</div>
          </div>
          <button class="mini" data-logout>יציאה</button>
        </div>

        ${alerts.map(a => `<div class="alert ${a.level}"><span>${a.level === 'stop' ? '⚠️' : '⏳'}</span><span>${esc(a.text)}</span></div>`).join('')}

        <div class="eyebrow" style="margin-top:20px">הכרטיסייה שלי</div>
        ${card ? `
          <div class="meter">
            <b>${unlimited ? '∞' : left}</b>
            <span>${unlimited ? 'מנוי ללא הגבלה' : 'כניסות שנשארו'}</span>
          </div>
          <div class="switchrow"><span class="lbl" style="margin:0">המסלול</span><span style="font-weight:600">${esc(card.name)}</span></div>
          <div class="switchrow"><span class="lbl" style="margin:0">בתוקף עד</span><span class="num">${esc(dateHe(card.validUntil))}</span></div>
        ` : `<p class="muted" style="margin:6px 0 14px">אין כרטיסייה פעילה.</p>
             <button class="btn btn-sage btn-block btn-sm" data-go="open">למסלולים</button>`}

        <div class="switchrow"><span class="lbl" style="margin:0">ביטוח</span>
          <span style="font-weight:600">${ins ? 'בתוקף עד ' + esc(dateHe(ins.validUntil)) : 'אין'}</span></div>
        <div class="switchrow"><span class="lbl" style="margin:0">טופס בטיחות</span>
          <span style="font-weight:600">${u.safetySignedAt
            ? 'נחתם ' + esc(dateHe(u.safetySignedAt.slice(0, 10)))
            : '<button class="mini mini--stop" data-sign>לחתימה</button>'}</span></div>
        <div class="switchrow"><span class="lbl" style="margin:0">ביקורים</span><span class="num">${visits.length}</span></div>

        ${card ? `<button class="btn btn-primary btn-block" data-qr style="margin-top:16px">הצגת קוד הכניסה</button>` : ''}
      </div>`;
  }

  function qrSheet() {
    const u = Demo.current();
    if (!u) return;
    const card = Demo.activeCard(u.id);
    const left = Demo.entriesLeft(u.id);
    const alerts = Demo.alertsFor(u.id);

    sheet({
      title: 'קוד הכניסה שלי',
      body: `<div class="qr-wrap">${Demo.codeSvg('etz:' + u.id, 230)}</div>
        <div style="text-align:center;margin:14px 0 18px">
          <div style="font-weight:700;font-size:18px">${esc(u.name)}</div>
          <div class="muted">${card ? esc(card.name) : 'אין כרטיסייה'}${
            card && card.kind === 'punch' ? ` · ${left} כניסות` : ''}</div>
        </div>
        ${alerts.map(a => `<div class="alert ${a.level}"><span>${a.level === 'stop' ? '⚠️' : '⏳'}</span><span>${esc(a.text)}</span></div>`).join('')}
        <p class="hint" style="text-align:center">הראו את הקוד בכניסה לסדנה.</p>`
    });
  }

  /* ======================================================================
     חיווט
     ====================================================================== */

  function init(refresh) {
    refreshAll = refresh || (() => {});

    document.addEventListener('click', e => {
      const t = e.target;

      const openAuth = t.closest('[data-auth-open]');
      if (openAuth) return authSheet(openAuth.dataset.authOpen);

      const sw = t.closest('[data-auth-switch]');
      if (sw) return authSheet(sw.dataset.authSwitch);

      const go = t.closest('[data-auth]');
      if (go) return go.dataset.auth === 'register' ? doRegister() : doLogin();

      if (t.closest('#auth-google')) return doGoogle();
      if (t.closest('[data-logout]')) { Demo.logout(); refreshAll(); return toast('יצאת מהחשבון'); }
      if (t.closest('[data-sign]')) return safetySheet();
      if (t.closest('[data-qr]')) return qrSheet();
      if (t.closest('[data-close-sheet]')) return closeSheet();

      const b = t.closest('[data-buy]');
      if (b) return buy(b.dataset.buy);
    });
  }

  return { init, render, authSheet, safetySheet, buy };
})();
