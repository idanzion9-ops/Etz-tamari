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
  }

  /* ---------- הלוח ---------- */
  function panelHtml() {
    return `
      <h3>נגישות</h3>
      <p class="hint" style="margin:0">ההגדרות נשמרות במכשיר שלכם.</p>

      <div class="lbl" style="margin-top:14px">גודל הטקסט — <span id="a11y-size-label">100%</span></div>
      <div class="a11y-row" style="margin-top:6px">
        <button class="a11y-btn" data-a11y="bigger">א+ הגדלה</button>
        <button class="a11y-btn" data-a11y="smaller">א− הקטנה</button>
      </div>

      <div class="lbl">תצוגה</div>
      <div class="a11y-row">
        <button class="a11y-btn" data-a11y="contrast" aria-pressed="false">ניגודיות גבוהה</button>
        <button class="a11y-btn" data-a11y="gray" aria-pressed="false">גווני אפור</button>
        <button class="a11y-btn" data-a11y="links" aria-pressed="false">הדגשת קישורים</button>
        <button class="a11y-btn" data-a11y="readable" aria-pressed="false">גופן קריא</button>
        <button class="a11y-btn" data-a11y="motion" aria-pressed="false">עצירת אנימציות</button>
        <button class="a11y-btn" data-a11y="reset">איפוס הכול</button>
      </div>

      <button class="btn btn-quiet btn-block btn-sm" data-a11y="statement">הצהרת נגישות</button>`;
  }

  const STATEMENT = `
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
      const b = e.target.closest('[data-a11y]');
      if (!b) return;
      const k = b.dataset.a11y;

      if (k === 'bigger')       state.font = Math.min(4, state.font + 1);
      else if (k === 'smaller') state.font = Math.max(0, state.font - 1);
      else if (k === 'reset')   state = { ...DEFAULTS };
      else if (k === 'statement') {
        toggle(false);
        if (window.UI) UI.sheet({ title: 'הצהרת נגישות', body: STATEMENT });
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
