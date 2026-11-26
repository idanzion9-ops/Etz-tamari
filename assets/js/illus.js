/* ==========================================================================
   illus.js — איורי טכניקה לפרויקטונים
   --------------------------------------------------------------------------
   כל שלב מקבל איור שמראה את הפעולה עצמה: הכלי, החומר, וכיוון התנועה.
   החץ בחלודה הוא תמיד התנועה — זה מה שהופך תרשים להוראה.

   הכול SVG מוטבע: נטען מיד, מתרחב לכל גודל, ומשנה צבע עם ערכת הנושא.
   ========================================================================== */

const Illus = (() => {

  /* ---------- הפלטה, זהה לזו של האפליקציה ---------- */
  const C = {
    wood:   '#D2A878',   // פני העץ
    woodHi: '#E3C49C',   // צד מואר
    woodLo: '#A87C4E',   // צד מוצל וקצוות
    grain:  '#8E6236',   // סיב
    steel:  '#C3C9C4',
    steelLo:'#7D857F',
    handle: '#A8623C',
    ink:    '#2E3A31',
    move:   '#B65D3C',   // חץ התנועה
    accent: '#5E8468'
  };

  /* חץ תנועה — מוגדר פעם אחת ומשמש את כל האיורים */
  const DEFS = `<defs>
    <marker id="il-ah" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="${C.move}"/>
    </marker>
  </defs>`;

  const wrap = inner =>
    `<svg class="il" viewBox="0 0 160 104" xmlns="http://www.w3.org/2000/svg"
          role="img" aria-hidden="true" focusable="false">${DEFS}${inner}</svg>`;

  /** לוח עץ בפרספקטיבה קלה, עם סיב */
  const board = (x, y, w, h, grain = true) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${C.wood}" stroke="${C.woodLo}" stroke-width="1.5"/>
    <rect x="${x}" y="${y}" width="${w}" height="3" fill="${C.woodHi}"/>
    ${grain ? `
      <path d="M${x + 6} ${y + h * 0.35} q${w * 0.25} -3 ${w * 0.5} 0 t${w * 0.4} 0"
            stroke="${C.grain}" stroke-width="1" fill="none" opacity=".45"/>
      <path d="M${x + 10} ${y + h * 0.68} q${w * 0.3} 3 ${w * 0.55} 0"
            stroke="${C.grain}" stroke-width="1" fill="none" opacity=".3"/>` : ''}`;

  const arrow = (d, w = 2.6) =>
    `<path d="${d}" stroke="${C.move}" stroke-width="${w}" fill="none"
           stroke-linecap="round" marker-end="url(#il-ah)"/>`;

  /* ======================================================================
     הטכניקות
     ====================================================================== */

  const T = {

    /* מדידה וסימון */
    measure: () => wrap(`
      ${board(10, 56, 140, 34)}
      <rect x="18" y="40" width="104" height="14" rx="2" fill="#F6F1E4" stroke="${C.ink}" stroke-width="1.4"/>
      ${[0,1,2,3,4,5,6,7,8,9,10].map(i =>
        `<line x1="${24 + i * 9.6}" y1="40" x2="${24 + i * 9.6}" y2="${i % 5 === 0 ? 50 : 46}"
               stroke="${C.ink}" stroke-width="1"/>`).join('')}
      <g transform="rotate(32 96 30)">
        <rect x="88" y="2" width="14" height="30" rx="2" fill="${C.handle}"/>
        <rect x="88" y="32" width="14" height="7" fill="${C.woodHi}"/>
        <path d="M88 39 h14 l-7 9 z" fill="${C.ink}"/>
      </g>
      <line x1="96" y1="56" x2="96" y2="90" stroke="${C.move}" stroke-width="2.4" stroke-dasharray="6 4"/>
      ${arrow('M58 100 L92 100')}`),

    /* ניסור */
    saw: () => wrap(`
      ${board(10, 58, 140, 30)}
      <g transform="rotate(-12 86 44)">
        <rect x="34" y="38" width="100" height="11" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1.2"/>
        <path d="M34 49 ${Array.from({length: 25}, (_, i) => `l2 4 l2 -4`).join(' ')}"
              fill="${C.steel}" stroke="${C.steelLo}" stroke-width=".8"/>
        <rect x="128" y="32" width="24" height="23" rx="5" fill="${C.handle}"/>
        <rect x="133" y="38" width="13" height="11" rx="4" fill="#F1EDE2"/>
      </g>
      <line x1="60" y1="58" x2="60" y2="88" stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="4 3"/>
      ${arrow('M26 96 L74 96')}
      ${arrow('M74 86 L26 86')}`),

    /* הידוק במלחציים */
    clamp: () => wrap(`
      ${board(26, 48, 108, 26)}
      <rect x="18" y="74" width="124" height="7" rx="2" fill="${C.woodLo}" opacity=".5"/>
      <path d="M44 34 h54 v58 h-54" fill="none" stroke="${C.steelLo}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="54" y="34" width="26" height="12" rx="3" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1.2"/>
      <rect x="54" y="80" width="26" height="12" rx="3" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1.2"/>
      <line x1="98" y1="56" x2="124" y2="56" stroke="${C.steelLo}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="128" cy="56" r="9" fill="none" stroke="${C.handle}" stroke-width="4"/>
      ${arrow('M67 14 L67 30')}
      ${arrow('M67 100 L67 96')}`),

    /* אזמל ופטיש */
    chisel: () => wrap(`
      ${board(12, 56, 136, 34)}
      <rect x="66" y="56" width="26" height="12" fill="${C.woodLo}" opacity=".45"/>
      <rect x="73" y="26" width="12" height="26" rx="2" fill="${C.handle}"/>
      <rect x="74" y="50" width="10" height="8" fill="${C.steelLo}"/>
      <path d="M75 56 h8 l-1 6 h-6 z" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1"/>
      <rect x="54" y="6" width="50" height="16" rx="3" fill="${C.woodLo}"/>
      <rect x="76" y="20" width="6" height="6" fill="${C.grain}"/>
      ${arrow('M110 10 L110 48')}
      <path d="M96 60 q6 -5 12 -1" stroke="${C.move}" stroke-width="1.6" fill="none" opacity=".7"/>`),

    /* קדיחה */
    drill: () => wrap(`
      ${board(10, 64, 140, 28)}
      <rect x="46" y="8" width="52" height="28" rx="6" fill="${C.ink}"/>
      <rect x="52" y="14" width="34" height="9" rx="3" fill="${C.steelLo}" opacity=".55"/>
      <path d="M58 36 h26 v12 h-26 z" fill="${C.handle}"/>
      <rect x="64" y="48" width="14" height="10" rx="2" fill="${C.steelLo}"/>
      <rect x="68" y="56" width="6" height="12" fill="${C.steel}" stroke="${C.steelLo}" stroke-width=".9"/>
      <path d="M68 58 q7 3 0 6 q-7 3 0 6" stroke="${C.steelLo}" stroke-width="1.4" fill="none"/>
      <ellipse cx="71" cy="65" rx="8" ry="3" fill="${C.grain}" opacity=".45"/>
      <path d="M98 44 v18" stroke="${C.move}" stroke-width="2.6" fill="none"
            stroke-linecap="round" marker-end="url(#il-ah)"/>
      <path d="M92 76 q8 -9 17 -3 M100 88 q9 -8 17 -2" stroke="${C.grain}" stroke-width="1.7" fill="none" opacity=".55"/>`),

    /* שיוף */
    sand: () => wrap(`
      ${board(12, 58, 136, 32)}
      <rect x="48" y="34" width="62" height="22" rx="4" fill="${C.woodLo}"/>
      <rect x="48" y="52" width="62" height="7" rx="2" fill="#E8DCC4" stroke="${C.grain}" stroke-width="1"/>
      ${Array.from({length: 14}, (_, i) =>
        `<circle cx="${52 + i * 4.3}" cy="55.5" r=".9" fill="${C.grain}" opacity=".6"/>`).join('')}
      ${arrow('M26 22 L46 22')}
      ${arrow('M132 22 L112 22')}
      ${Array.from({length: 7}, (_, i) =>
        `<circle cx="${30 + i * 17}" cy="${94 + (i % 2) * 4}" r="1.6" fill="${C.grain}" opacity=".4"/>`).join('')}`),

    /* הדבקה */
    glue: () => wrap(`
      ${board(14, 64, 62, 26)}
      ${board(84, 64, 62, 26)}
      <path d="M76 64 h8 v26 h-8 z" fill="${C.accent}" opacity=".3"/>
      <path d="M70 20 h20 v22 l-6 14 h-8 l-6 -14 z" fill="#EFEAE0" stroke="${C.ink}" stroke-width="1.4"/>
      <rect x="74" y="12" width="12" height="9" rx="2" fill="${C.ink}"/>
      <path d="M80 56 q0 6 0 8" stroke="${C.accent}" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="80" cy="68" r="2.6" fill="${C.accent}"/>
      ${arrow('M30 98 L66 98')}
      ${arrow('M130 98 L94 98')}`),

    /* הברגה */
    screw: () => wrap(`
      ${board(12, 58, 136, 32)}
      <rect x="74" y="56" width="12" height="4" rx="1" fill="${C.steelLo}"/>
      <path d="M77 60 l6 0 l-1 16 -4 0 z" fill="${C.steel}" stroke="${C.steelLo}" stroke-width=".9"/>
      ${Array.from({length: 5}, (_, i) =>
        `<line x1="77" y1="${63 + i * 3}" x2="83" y2="${64.5 + i * 3}" stroke="${C.steelLo}" stroke-width="1"/>`).join('')}
      <rect x="76" y="24" width="8" height="32" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1"/>
      <rect x="70" y="2" width="20" height="24" rx="5" fill="${C.handle}"/>
      <path d="M104 22 a22 22 0 0 1 0 26" stroke="${C.move}" stroke-width="2.6" fill="none"
            stroke-linecap="round" marker-end="url(#il-ah)"/>`),

    /* גימור ושימון */
    oil: () => wrap(`
      ${board(10, 58, 140, 32)}
      <path d="M10 58 h62 v32 h-62 z" fill="${C.grain}" opacity=".35"/>
      <line x1="72" y1="58" x2="72" y2="90" stroke="${C.woodLo}" stroke-width="1" stroke-dasharray="3 3"/>
      <path d="M76 20 q20 -14 42 -2 q14 8 8 20 q-4 8 -16 10 q-18 3 -32 -4 q-10 -6 -8 -14 q1 -6 6 -10 z"
            fill="#FBF7EE" stroke="${C.ink}" stroke-width="1.4"/>
      <path d="M86 24 q10 10 6 22 M104 20 q4 12 -2 24" stroke="${C.ink}" stroke-width="1" fill="none" opacity=".35"/>
      <ellipse cx="100" cy="56" rx="30" ry="4" fill="${C.ink}" opacity=".12"/>
      ${arrow('M122 48 L68 48')}
      <path d="M30 44 l4 -9 4 9 -4 3 z M50 36 l3 -7 3 7 -3 2 z"
            fill="#F7EDD2" stroke="${C.grain}" stroke-width=".7"/>`),

    /* גילוף */
    carve: () => wrap(`
      <path d="M16 64 q26 -26 62 -26 q36 0 66 26 q-30 24 -66 24 q-36 0 -62 -24 z"
            fill="${C.wood}" stroke="${C.woodLo}" stroke-width="1.6"/>
      <path d="M38 62 q26 -14 52 -5" stroke="${C.grain}" stroke-width="1.1" fill="none" opacity=".4"/>
      <g transform="rotate(-28 100 40)">
        <path d="M54 32 l48 0 l12 9 -60 0 z" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1.3"/>
        <path d="M54 32 l48 0 l0 3 -48 0 z" fill="#E6EAE7"/>
        <rect x="102" y="26" width="42" height="19" rx="7" fill="${C.handle}"/>
        <rect x="102" y="31" width="6" height="9" fill="${C.steelLo}"/>
      </g>
      <path d="M44 52 q10 -14 24 -10 q-4 7 -11 8 q7 2 12 -3 q-6 11 -25 5 z"
            fill="${C.woodHi}" stroke="${C.woodLo}" stroke-width="1.1"/>
      ${arrow('M110 92 L58 72')}`),

    /* הרכבה */
    assemble: () => wrap(`
      ${board(16, 22, 30, 70, false)}
      <path d="M16 22 h30 v8 h-30 z" fill="${C.woodHi}"/>
      ${board(78, 54, 66, 26)}
      <path d="M46 54 h32" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="4 3"/>
      <path d="M46 80 h32" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="4 3"/>
      <rect x="46" y="54" width="14" height="26" rx="1" fill="${C.accent}" opacity=".22"/>
      ${arrow('M126 24 L92 46')}
      ${arrow('M126 104 L92 88')}
      <circle cx="53" cy="67" r="5" fill="none" stroke="${C.accent}" stroke-width="2.2"/>`),

    /* בדיקת זווית */
    square: () => wrap(`
      ${board(16, 44, 70, 46)}
      ${board(86, 18, 56, 72)}
      <path d="M86 90 L86 30 L140 30" fill="none" stroke="${C.steelLo}" stroke-width="6" stroke-linejoin="miter"/>
      <path d="M86 90 L86 30 L140 30" fill="none" stroke="${C.steel}" stroke-width="2.4" stroke-linejoin="miter"/>
      <path d="M92 36 h12 v12" fill="none" stroke="${C.move}" stroke-width="2"/>
      <path d="M26 20 l7 8 14 -16" fill="none" stroke="${C.accent}" stroke-width="3.4"
            stroke-linecap="round" stroke-linejoin="round"/>`),

    /* פירוק משטח */
    pallet: () => wrap(`
      ${board(10, 26, 140, 15)}
      ${board(10, 50, 140, 15)}
      ${board(10, 74, 140, 15)}
      <rect x="30" y="26" width="11" height="63" fill="${C.woodLo}" opacity=".5"/>
      <rect x="118" y="26" width="11" height="63" fill="${C.woodLo}" opacity=".5"/>
      <g transform="rotate(-38 58 26)">
        <rect x="50" y="-10" width="11" height="40" rx="3" fill="${C.steelLo}"/>
        <path d="M50 30 q5 8 11 0 l-1 8 q-5 4 -9 0 z" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1"/>
      </g>
      ${arrow('M98 6 L66 18')}
      <rect x="54" y="19" width="5" height="9" rx="1" fill="${C.steelLo}"/>
      <circle cx="56.5" cy="18" r="3" fill="${C.steelLo}"/>`),

    /* תלייה על קיר */
    hang: () => wrap(`
      <rect x="0" y="0" width="160" height="30" fill="#EDE7DA"/>
      ${Array.from({length: 4}, (_, i) =>
        `<line x1="${20 + i * 40}" y1="0" x2="${20 + i * 40}" y2="30" stroke="${C.ink}" stroke-width=".7" opacity=".18"/>`).join('')}
      <circle cx="62" cy="22" r="3.4" fill="${C.steelLo}"/>
      <circle cx="98" cy="22" r="3.4" fill="${C.steelLo}"/>
      ${board(44, 40, 72, 30)}
      <line x1="62" y1="22" x2="62" y2="40" stroke="${C.steelLo}" stroke-width="2"/>
      <line x1="98" y1="22" x2="98" y2="40" stroke="${C.steelLo}" stroke-width="2"/>
      <line x1="80" y1="74" x2="80" y2="98" stroke="${C.move}" stroke-width="1.6" stroke-dasharray="4 3"/>
      <circle cx="80" cy="100" r="3" fill="${C.move}"/>
      <path d="M22 44 h14 M22 66 h14" stroke="${C.accent}" stroke-width="1.6"/>
      <line x1="29" y1="44" x2="29" y2="66" stroke="${C.accent}" stroke-width="1.6"/>`),

    /* ייבוש והמתנה */
    wait: () => wrap(`
      ${board(14, 62, 132, 28)}
      <path d="M58 16 h44 v10 l-16 16 16 16 v10 h-44 v-10 l16 -16 -16 -16 z"
            fill="#F4EFE2" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M64 21 h32 l-16 16 z" fill="${C.move}" opacity=".75"/>
      <path d="M72 62 h16 l-8 -9 z" fill="${C.move}" opacity=".45"/>
      <circle cx="80" cy="47" r="1.7" fill="${C.move}"/>
      <path d="M118 30 q8 -8 16 0 M118 44 q8 -8 16 0" stroke="${C.accent}" stroke-width="1.6" fill="none" opacity=".65"/>`),

    /* בחירת חומר */
    select: () => wrap(`
      ${board(8, 20, 44, 66)}
      ${board(58, 20, 44, 66)}
      ${board(108, 20, 44, 66)}
      <rect x="55" y="17" width="50" height="72" rx="4" fill="none" stroke="${C.accent}" stroke-width="3"/>
      <circle cx="104" cy="22" r="10" fill="${C.accent}"/>
      <path d="M99 22 l4 4 7 -8" stroke="#fff" stroke-width="2.4" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>`),

    /* ניקוי */
    clean: () => wrap(`
      ${board(12, 60, 136, 30)}
      <rect x="58" y="34" width="46" height="14" rx="3" fill="${C.handle}"/>
      ${Array.from({length: 15}, (_, i) =>
        `<line x1="${61 + i * 3}" y1="48" x2="${59 + i * 3}" y2="60" stroke="${C.ink}" stroke-width="1.2" opacity=".65"/>`).join('')}
      ${arrow('M124 42 L104 42')}
      ${Array.from({length: 6}, (_, i) =>
        `<circle cx="${34 + i * 6}" cy="${50 - (i % 3) * 7}" r="1.5" fill="${C.grain}" opacity=".45"/>`).join('')}`),

    /* פטיש ומסמר */
    nail: () => wrap(`
      ${board(12, 58, 136, 32)}
      <rect x="77" y="46" width="5" height="22" fill="${C.steel}" stroke="${C.steelLo}" stroke-width=".8"/>
      <path d="M77 68 h5 l-2.5 6 z" fill="${C.steelLo}"/>
      <rect x="71" y="43" width="17" height="4" rx="1.5" fill="${C.steelLo}"/>
      <g transform="rotate(-18 96 20)">
        <rect x="58" y="8" width="44" height="17" rx="3" fill="${C.steelLo}"/>
        <path d="M58 8 h-9 q-5 8 0 17 h9 z" fill="${C.steelLo}"/>
        <rect x="100" y="13" width="46" height="8" rx="4" fill="${C.handle}"/>
      </g>
      ${arrow('M118 44 L92 34')}
      <path d="M62 50 q-6 -5 -9 -1 M96 48 q6 -6 10 -2" stroke="${C.move}" stroke-width="1.6" fill="none" opacity=".6"/>`),

    /* חיתוך לגודל סופי */
    trim: () => wrap(`
      ${board(10, 48, 108, 38)}
      <rect x="118" y="48" width="32" height="38" rx="2" fill="${C.wood}" opacity=".3" stroke="${C.woodLo}"
            stroke-width="1.2" stroke-dasharray="4 3"/>
      <line x1="118" y1="40" x2="118" y2="94" stroke="${C.move}" stroke-width="2.2" stroke-dasharray="6 4"/>
      <g transform="rotate(-8 112 30)">
        <rect x="68" y="22" width="80" height="9" fill="${C.steel}" stroke="${C.steelLo}" stroke-width="1.1"/>
        <path d="M68 31 ${Array.from({length: 20}, () => 'l2 3.5 l2 -3.5').join(' ')}" fill="${C.steel}" stroke="${C.steelLo}" stroke-width=".7"/>
      </g>
      ${arrow('M132 16 L132 36')}`)
  };

  /* ======================================================================
     זיהוי אוטומטי מתוך לשון השלב
     משמש כשלא הוגדר איור ידנית — למשל בפרויקטון חדש שתוסיפו.
     ====================================================================== */

  const RULES = [
    [/מודד|מדיד|מסמנים|מסמן|סימון|סרגל|מרכז/, 'measure'],
    [/משולש|זווית|ישר(ות)? הזווי|אלכסונ/,      'square'],
    [/לגודל סופי|מיישרים את ארבע|קצה סופי|לגודל ומעגלים/, 'trim'],
    [/מנסר|ניסור|מסור|חותכים|חיתוך/,            'saw'],
    [/מהדק|מלחצ|הידוק/,                         'clamp'],
    [/אזמל|שוברים את הפרוס/,                    'chisel'],
    [/קודח|קדיח|מקדח|חור/,                      'drill'],
    [/משייפ|שיוף|נייר שיוף|מעגלים|חלק למגע/,    'sand'],
    [/מדביק|דבק/,                               'glue'],
    [/מבריג|ברגים|בורג|מברגה/,                  'screw'],
    [/שמן|שעווה|לכה|מגמרים|גימור|משמנים/,       'oil'],
    [/מגלפ|גילוף|סכין/,                         'carve'],
    [/מסמר|פטיש/,                               'nail'],
    [/מרכיב|הרכבה|מחברים|חיבור|מוסיפים|בודקים התאמ|יושב/, 'assemble'],
    [/משטח|מסמרים ישנים|מפרקים/,                'pallet'],
    [/תולים|תלייה|קיר|מתלה/,                    'hang'],
    [/מחכים|ייבוש|לילה|שעתיים ייבוש|מתייבש/,    'wait'],
    [/בוחרים|ממיינים|מחליטים|מתכננים/,          'select'],
    [/מנקים|ניקוי|אבק|מטלית/,                   'clean']
  ];

  function detect(step) {
    const txt = `${step.t || ''} ${step.d || ''}`;
    for (const [re, key] of RULES) if (re.test(txt)) return key;
    return null;
  }

  /** מחזיר את ה-SVG לשלב, או מחרוזת ריקה אם אין התאמה */
  function forStep(step) {
    const key = (step && step.il) || detect(step || {});
    return key && T[key] ? T[key]() : '';
  }

  const keys = () => Object.keys(T);
  const byKey = k => (T[k] ? T[k]() : '');

  /** שמות בעברית, לבורר באזור הניהול */
  const LABELS = {
    measure:'מדידה וסימון', square:'בדיקת זווית', saw:'ניסור', trim:'חיתוך לגודל',
    clamp:'הידוק במלחציים', chisel:'עבודה באזמל', drill:'קדיחה', sand:'שיוף',
    glue:'הדבקה', screw:'הברגה', oil:'גימור ושימון', carve:'גילוף',
    assemble:'הרכבה', nail:'פטיש ומסמר', pallet:'פירוק משטח', hang:'תלייה', wait:'ייבוש והמתנה',
    select:'בחירת חומר', clean:'ניקוי'
  };

  return { forStep, byKey, keys, detect, LABELS };
})();
