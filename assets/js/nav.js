/* ==========================================================================
   nav.js — כפתור החזרה של אנדרואיד
   --------------------------------------------------------------------------
   באפליקציה ארוזה, כפתור החזרה סוגר את כל האפליקציה כברירת מחדל.
   כאן הוא מתנהג כמו שמצפים: סוגר מגירה, חוזר מסך אחורה, ורק בדף הבית
   יוצא — ואז בלחיצה אחת שנייה, אחרי אזהרה.

   המנגנון: כל מסך ומגירה דוחפים רשומה להיסטוריה של הדפדפן.
   popstate הוא האירוע שכפתור החזרה מפעיל.
   ========================================================================== */

const Nav = (() => {
  let armed = false;          // האם הלחיצה הבאה תצא מהאפליקציה
  let armTimer = null;
  let suppress = false;       // מונע לולאה כשאנחנו עצמנו קוראים ל-back

  /* רשומת בסיס אחת, כדי שתמיד יהיה לאן לחזור */
  function init() {
    try {
      history.replaceState({ etz: 'home' }, '');
      history.pushState({ etz: 'guard' }, '');
    } catch (e) { return; }   // דפדפן בלי היסטוריה — נותנים לו להתנהג כרגיל

    window.addEventListener('popstate', onBack);
  }

  /** נדחף כשנפתח משהו שאפשר לסגור */
  function push(kind) {
    try { history.pushState({ etz: kind }, ''); } catch (e) {}
  }

  function onBack() {
    if (suppress) { suppress = false; return; }

    // 1. מגירה פתוחה — סוגרים אותה
    if (UI.sheetOpen()) {
      UI.closeSheet();
      rearm();
      return;
    }

    // 2. לוח הנגישות פתוח
    const panel = document.getElementById('a11y-panel');
    if (panel && panel.classList.contains('on')) {
      panel.classList.remove('on');
      document.getElementById('a11y-fab')?.setAttribute('aria-expanded', 'false');
      rearm();
      return;
    }

    // 3. לא בדף הבית — חוזרים אליו
    const cur = document.querySelector('.screen.on');
    if (cur && cur.id !== 'screen-home') {
      UI.go('home');
      rearm();
      return;
    }

    // 4. בדף הבית. פעם ראשונה מזהירים, פעם שנייה יוצאים.
    if (armed) { leave(); return; }

    armed = true;
    UI.toast(I18n.t('nav.exitHint'));
    clearTimeout(armTimer);
    armTimer = setTimeout(() => { armed = false; }, 2400);
    rearm();
  }

  /** מחזיר רשומה להיסטוריה, אחרת הלחיצה הבאה תצא מיד */
  function rearm() {
    try { history.pushState({ etz: 'guard' }, ''); } catch (e) {}
  }

  /** יציאה אמיתית: נותנים לדפדפן לחזור מעבר לרשומה שלנו */
  function leave() {
    clearTimeout(armTimer);
    armed = false;
    suppress = true;
    try { history.back(); } catch (e) {}
    // אם זו הכניסה הראשונה לאתר ואין לאן לחזור, סוגרים חלון שנפתח בקוד
    setTimeout(() => { try { window.close(); } catch (e) {} }, 120);
  }

  /** מאפסים את האזהרה בכל פעולה אחרת, כדי שלא תישאר דרוכה */
  function disarm() { armed = false; clearTimeout(armTimer); }

  return { init, push, disarm, get armed() { return armed; } };
})();
