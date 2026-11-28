/* ==========================================================================
   a11y.js — תפריט נגישות
   תואם לדרישות תקן ישראלי ת״י 5568 ברמה AA.
   ההעדפות נשמרות על המכשיר ונטענות מחדש בכל כניסה.
   ========================================================================== */

const A11y = (() => {
  const KEY = 'etz_a11y_v1';

  const DEFAULTS = { font: 0, contrast: 0, gray: 0, links: 0, readable: 0, motion: 0 };
  let state = { ...DEFAULTS };

  /* ---------- שמירה ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (e) {
      // גלישה פרטית או אחסון חסום — ממשיכים עם ברירת המחדל
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- החלה ---------- */
  function apply() {
    const h = document.documentElement;
    // גודל טקסט: חמש דרגות, 0 עד 4 (100% עד 160%)
    h.style.fontSize = state.font ? `${100 + state.font * 15}%` : '';
    h.dataset.a11yContrast = state.contrast ? '1' : '';
    h.dataset.a11yGray     = state.gray     ? '1' : '';
    h.dataset.a11yLinks    = state.links    ? '1' : '';
    h.dataset.a11yFont     = state.readable ? '1' : '';
    h.dataset.a11yMotion   = state.motion   ? '1' : '';
    syncButtons();
  }

  function syncButtons() {
    document.querySelectorAll('[data-a11y]').forEach(b => {
      const k = b.dataset.a11y;
      if (k === 'bigger' || k === 'smaller' || k === 'reset' || k === 'statement') return;
      b.setAttribute('aria-pressed', String(!!state[k]));
    });
    const lbl = document.getElementById('a11y-size-label');
    if (lbl) lbl.textContent = `${100 + state.font * 15}%`;
    document.querySelectorAll('[data-lang]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.lang === I18n.get())));
  }

  /* ---------- הלוח ---------- */
  function panelHtml() {
    return `
      <h3>${I18n.t('a11y.title')}</h3>
      <p class="hint" style="margin:0">${I18n.t('a11y.saved')}</p>

      <div class="lbl" style="margin-top:14px">${I18n.t('a11y.lang')}</div>
      <div class="a11y-row" style="margin-top:6px">
        <button class="a11y-btn" data-lang="he" aria-pressed="false">עברית</button>
        <button class="a11y-btn" data-lang="en" aria-pressed="false">English</button>
      </div>

      <div class="lbl">${I18n.t('a11y.size')} — <span id="a11y-size-label">100%</span></div>
      <div class="a11y-row" style="margin-top:6px">
        <button class="a11y-btn" data-a11y="bigger">${I18n.t('a11y.bigger')}</button>
        <button class="a11y-btn" data-a11y="smaller">${I18n.t('a11y.smaller')}</button>
      </div>

      <div class="lbl">${I18n.t('a11y.display')}</div>
      <div class="a11y-row">
        <button class="a11y-btn" data-a11y="contrast" aria-pressed="false">${I18n.t('a11y.contrast')}</button>
        <button class="a11y-btn" data-a11y="gray" aria-pressed="false">${I18n.t('a11y.gray')}</button>
        <button class="a11y-btn" data-a11y="links" aria-pressed="false">${I18n.t('a11y.links')}</button>
        <button class="a11y-btn" data-a11y="readable" aria-pressed="false">${I18n.t('a11y.font')}</button>
        <button class="a11y-btn" data-a11y="motion" aria-pressed="false">${I18n.t('a11y.motion')}</button>
        <button class="a11y-btn" data-a11y="reset">${I18n.t('a11y.reset')}</button>
      </div>

      <button class="btn btn-quiet btn-block btn-sm" data-a11y="statement">${I18n.t('a11y.statement')}</button>`;
  }

  const STATEMENT_HE = `
    <p class="lead" style="margin-top:0">אנחנו רוצים שכל אחד יוכל להשתמש באפליקציה של עץ תמרי, בלי קשר ליכולת או לטכנולוגיה שבה הוא משתמש.</p>

    <div class="eyebrow" style="margin-top:22px">מה נעשה</div>
    <p>האפליקציה נבנתה לעמידה בתקן הישראלי ת״י 5568 ברמה AA, המאמץ את הנחיות WCAG 2.0. בין היתר:</p>
    <ul class="pj-spec">
      <li>ניווט מלא במקלדת, עם סימון ברור של האלמנט הפעיל</li>
      <li>תגיות וכותרות מסודרות לקוראי מסך</li>
      <li>ניגודיות צבעים נבדקת</li>
      <li>תפריט נגישות: הגדלת טקסט, ניגודיות, גווני אפור, הדגשת קישורים, גופן קריא ועצירת אנימציות</li>
      <li>כיבוד הגדרת ״צמצום תנועה״ של מערכת ההפעלה</li>
      <li>תצוגה מותאמת לכל גודל מסך</li>
    </ul>

    <div class="eyebrow" style="margin-top:22px">מגבלות שאנחנו מודעים להן</div>
    <p>האפליקציה בפיתוח מתמשך. ייתכנו חלקים שטרם הונגשו במלואם. אנחנו מתקנים כל ליקוי שמדווח לנו.</p>

    <div class="eyebrow" style="margin-top:22px">נתקלתם בבעיה?</div>
    <p>נשמח לשמוע, וגם לקבל הצעות לשיפור. פרטי הקשר נמצאים במסך ״שלי״ ובתחתית הדף. נשתדל לחזור אליכם בהקדם.</p>

    <p class="hint">עודכן לאחרונה: נובמבר 2026</p>`;

  const STATEMENT_EN = `
    <p class="lead" style="margin-top:0">We want everyone to be able to use the Etz Tamari app, whatever their ability or the technology they use.</p>

    <div class="eyebrow" style="margin-top:22px">What we have done</div>
    <p>The app was built to meet Israeli standard SI 5568 at level AA, which adopts the WCAG 2.0 guidelines. Among other things:</p>
    <ul class="pj-spec">
      <li>Full keyboard navigation, with a clear focus indicator</li>
      <li>Ordered headings and labels for screen readers</li>
      <li>Colour contrast checked throughout</li>
      <li>An accessibility menu: larger text, high contrast, greyscale, highlighted links, a readable font and stopped animation</li>
      <li>The operating system's reduced-motion setting is respected</li>
      <li>A layout that adapts to any screen size</li>
    </ul>

    <div class="eyebrow" style="margin-top:22px">Limitations we know about</div>
    <p>The app is under continuous development. Some parts may not yet be fully accessible. We fix every issue reported to us.</p>

    <div class="eyebrow" style="margin-top:22px">Run into a problem?</div>
    <p>We would like to hear about it, and we welcome suggestions. Contact details are on the Me screen and at the foot of the page. We will get back to you as soon as we can.</p>

    <p class="hint">Last updated: November 2026</p>`;

  /* ---------- חיווט ---------- */
  function init() {
    load();
    apply();

    const fab = document.getElementById('a11y-fab');
    if (!fab) return;

    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'אפשרויות נגישות');
    panel.innerHTML = panelHtml();
    document.body.appendChild(panel);
    syncButtons();

    const toggle = open => {
      panel.classList.toggle('on', open);
      fab.setAttribute('aria-expanded', String(open));
      if (open && typeof Nav !== 'undefined') Nav.push('a11y');
    };

    fab.addEventListener('click', e => {
      e.stopPropagation();
      toggle(!panel.classList.contains('on'));
    });

    document.addEventListener('click', e => {
      if (panel.classList.contains('on') && !panel.contains(e.target) && !fab.contains(e.target)) {
        toggle(false);
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('on')) { toggle(false); fab.focus(); }
    });

    panel.addEventListener('click', e => {
      const lb = e.target.closest('[data-lang]');
      if (lb) {
        I18n.set(lb.dataset.lang);
        panel.innerHTML = panelHtml();
        syncButtons();
        return;
      }
      const b = e.target.closest('[data-a11y]');
      if (!b) return;
      const k = b.dataset.a11y;

      if (k === 'bigger')       state.font = Math.min(4, state.font + 1);
      else if (k === 'smaller') state.font = Math.max(0, state.font - 1);
      else if (k === 'reset')   state = { ...DEFAULTS };
      else if (k === 'statement') {
        toggle(false);
        if (window.UI) UI.sheet({ title: I18n.t('a11y.statement'), body: I18n.isEn() ? STATEMENT_EN : STATEMENT_HE });
        return;
      }
      else state[k] = state[k] ? 0 : 1;

      apply();
      save();
    });
  }

  return { init, apply };
})();

document.addEventListener('DOMContentLoaded', A11y.init);
