/* ==========================================================================
   ui.js — רכיבי ממשק משותפים
   ========================================================================== */

const UI = (() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- בטיחות טקסט ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** מנקה HTML שהגיע מעורך התוכן — משאיר רק תגיות עיצוב בסיסיות */
  function safeHtml(html) {
    const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H3', 'H4', 'SPAN', 'DIV', 'A']);
    const tpl = document.createElement('div');
    tpl.innerHTML = String(html || '');
    tpl.querySelectorAll('*').forEach(el => {
      if (!allowed.has(el.tagName)) { el.replaceWith(...el.childNodes); return; }
      Array.from(el.attributes).forEach(a => {
        const ok = (a.name === 'style') || (el.tagName === 'A' && a.name === 'href' && /^https?:|^mailto:|^tel:/i.test(a.value));
        if (!ok) el.removeAttribute(a.name);
      });
      if (el.tagName === 'A') { el.target = '_blank'; el.rel = 'noopener'; }
    });
    return tpl.innerHTML;
  }

  /* ---------- פורמט ---------- */
  const money = n => '₪' + Number(n || 0).toLocaleString('he-IL');
  const HE_DOW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  function dateHe(iso) {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  }
  function dowHe(iso) {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return isNaN(d) ? '' : 'יום ' + HE_DOW[d.getDay()];
  }
  const todayISO = () => new Date().toISOString().slice(0, 10);

  /* ---------- טוסט ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
  }

  /* ---------- מגירה ---------- */
  let onCloseHook = null;

  function sheet({ title, body, foot = '', admin = false, onClose = null }) {
    const s = $('#sheet');
    $('#sheet-title').textContent = title;
    $('#sheet-body').innerHTML = body;
    const f = $('#sheet-foot');
    f.innerHTML = foot;
    f.hidden = !foot;
    s.classList.toggle('admin', !!admin);
    s.classList.add('on');
    $('#scrim').classList.add('on');
    document.body.classList.add('no-scroll');
    $('#sheet-body').scrollTop = 0;
    onCloseHook = onClose;
    if (typeof Nav !== 'undefined') Nav.push('sheet');
    return $('#sheet-body');
  }

  function closeSheet() {
    $('#sheet').classList.remove('on');
    $('#scrim').classList.remove('on');
    document.body.classList.remove('no-scroll');
    if (onCloseHook) { const f = onCloseHook; onCloseHook = null; f(); }
  }

  const sheetOpen = () => $('#sheet').classList.contains('on');

  /** מרענן רק את גוף המגירה, בלי אנימציית פתיחה מחדש */
  function sheetBody(html) { $('#sheet-body').innerHTML = html; }
  function sheetFoot(html) { const f = $('#sheet-foot'); f.innerHTML = html; f.hidden = !html; }

  /* ---------- קריאת קובץ תמונה ל-Data URL ----------
     צילום מטלפון הוא 12 מגה־פיקסל ויכול להיות HEIC. העיבוד חייב להיות
     מהיר, לא לתפוס את הדפדפן, ולהיכשל בקול רם במקום להיתקע בשקט.
     ------------------------------------------------------------------ */

  const MAX_SIDE = 900;
  const QUALITY  = 0.72;

  function canvasFrom(bitmapOrImg, w, h) {
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width  = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    c.getContext('2d').drawImage(bitmapOrImg, 0, 0, c.width, c.height);
    return c;
  }

  async function readImage(file) {
    if (!file) throw new Error('לא נבחר קובץ');
    if (file.size > 25 * 1024 * 1024) throw new Error('הקובץ גדול מדי — עד 25MB');

    // createImageBitmap מהיר בהרבה ומטפל גם בפורמטים שה-img לא תמיד קורא
    let canvas = null;
    if (typeof createImageBitmap === 'function') {
      try {
        const bmp = await withTimeout(createImageBitmap(file), 20000);
        canvas = canvasFrom(bmp, bmp.width, bmp.height);
        if (bmp.close) bmp.close();
      } catch (e) {
        canvas = null;   // נופלים לדרך הוותיקה
      }
    }

    if (!canvas) {
      const dataUrl = await withTimeout(readAsDataURL(file), 20000);
      const img = await withTimeout(loadImage(dataUrl), 20000);
      canvas = canvasFrom(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
    }

    let out;
    try {
      out = canvas.toDataURL('image/jpeg', QUALITY);
    } catch (e) {
      throw new Error('לא ניתן לעבד את התמונה במכשיר הזה');
    }
    if (!out || out.length < 100) throw new Error('עיבוד התמונה נכשל');
    return out;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('עיבוד התמונה נתקע. נסו תמונה אחרת או קטנה יותר.')), ms))
    ]);
  }

  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(new Error('קריאת הקובץ נכשלה'));
      fr.onload  = () => res(fr.result);
      fr.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onerror = () => rej(new Error('הפורמט לא נתמך. נסו לשמור את התמונה כ-JPG.'));
      img.onload  = () => res(img);
      img.src = src;
    });
  }

  /* ---------- ניווט בין מסכים ---------- */
  function go(name) {
    const cur = document.querySelector('.screen.on');
    if (typeof Nav !== 'undefined' && cur && cur.id !== 'screen-' + name) Nav.push('screen');
    if (typeof Nav !== 'undefined') Nav.disarm();
    $$('.screen').forEach(s => s.classList.toggle('on', s.id === 'screen-' + name));
    $$('.tab[data-go]').forEach(t => t.setAttribute('aria-selected', String(t.dataset.go === name)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- חיווט גלובלי ---------- */
  document.addEventListener('click', e => {
    if (e.target.closest('#sheet-close') || e.target.closest('#scrim')) closeSheet();
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { go(goBtn.dataset.go); if (sheetOpen()) closeSheet(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen()) closeSheet(); });

  return { $, $$, esc, safeHtml, money, dateHe, dowHe, todayISO, HE_DOW, toast, sheet, closeSheet, sheetOpen, sheetBody, sheetFoot, readImage, go };
})();
