// Strict in-page audit: inspects page layout, responsiveness, contrast, and interactive elements.
// Runs inside the browser environment and returns a list of issues found.

export function auditPage(opts = {}) {
  const issues = [];
  const add = (kind, el, extra = "") => {
    const label = (el.getAttribute?.("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 32);
    const cls = (typeof el.className === "string" ? el.className : "").split(" ").filter(Boolean).slice(0, 2).join(".");
    issues.push(`${kind}: <${el.tagName.toLowerCase()}${cls ? ` class="${cls}"` : ""}> "${label}" ${extra}`.trim());
  };

  const vw = window.innerWidth;
  const root = document.documentElement;

  // 1. Horizontal Page Scroll / Overflow
  if (root.scrollWidth > vw + 1) {
    const culprits = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 2) {
        culprits.push(`${el.tagName.toLowerCase()}.${(el.className||'').split(' ').slice(0,2).join('.')} (right: ${Math.round(r.right)}px > ${vw}px)`);
      }
    });
    issues.push(`PAGE scrolls sideways: scrollWidth ${root.scrollWidth} > ${vw}. Culprits: ${culprits.slice(0, 3).join(', ')}`);
  }

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
      if (n.hasAttribute('hidden') || n.hasAttribute('inert') || n.getAttribute('aria-hidden') === 'true') return false;
    }
    return true;
  };

  const inScroller = (el) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1) return true;
    }
    return false;
  };

  // Color & Contrast Math
  const parseColor = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };

  const alphaOver = (top, bottom) => {
    const a = top.a + bottom.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
      g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
      b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
      a
    };
  };

  const relLum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const getBackdrop = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none' && !cs.backgroundImage.includes('none')) {
        // gradient or image backdrop
        return null;
      }
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    return stack.reduceRight((acc, c) => alphaOver(c, acc), base);
  };

  const inSentence = (el) => getComputedStyle(el).display === "inline" && !!el.parentElement && [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);

  // Inspect interactive controls
  const controls = [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, .thumb-btn, .model-tab, .tbs-model-tab, .type-btn")].filter(el => visible(el));
  const checked = [];

  for (const el of controls) {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);

    // Skip offscreen elements
    if ((r.right <= 0 || r.left >= vw) && !inScroller(el)) continue;
    checked.push(el);

    // 2. Accessible label
    const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.value || el.placeholder || '').trim();
    if (!name && !el.querySelector('img[alt]')) {
      add("NO NAME", el);
    }

    // 3. Sticking outside viewport
    if ((r.right > vw + 2 || r.left < -2) && !inScroller(el)) {
      add("OUTSIDE", el, `[${Math.round(r.left)}..${Math.round(r.right)} vs vw ${vw}]`);
    }

    // 4. Touch target size on touch devices (WCAG 2.5.8 min 36px for buttons/tabs)
    const inline = el.tagName === "A" && (inSentence(el) || !!el.closest("p, li, small, td"));
    if (opts.touch && !inline && (el.tagName === "BUTTON" || el.classList.contains("thumb-btn") || el.classList.contains("type-btn") || el.classList.contains("btn"))) {
      if (r.height < 36 || r.width < 36) {
        add("TOO SMALL TOUCH TARGET", el, `${Math.round(r.width)}x${Math.round(r.height)}px (min 36px)`);
      }
    }

    // 5. Clipped text (overflow hidden without an ellipsis)
    if (/(hidden|clip)/.test(style.overflowX) && style.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 2 && !["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) {
      add("CLIPPED", el, `${el.scrollWidth}>${el.clientWidth}`);
    }

    // 6. Text contrast
    if (el.tagName !== "INPUT" && el.tagName !== "SELECT" && el.tagName !== "TEXTAREA") {
      const text = el.textContent.trim();
      if (text.length > 0 && !el.disabled) {
        const textColor = parseColor(style.color);
        const bg = getBackdrop(el);
        if (textColor && bg) {
          const l1 = relLum(textColor);
          const l2 = relLum(bg);
          const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          const isLarge = parseFloat(style.fontSize) >= 18 || (parseFloat(style.fontSize) >= 14 && style.fontWeight >= 700);
          const reqRatio = isLarge ? 3.0 : 4.5;
          if (cr < reqRatio) {
            add("LOW CONTRAST", el, `ratio ${cr.toFixed(2)}:1 < ${reqRatio}:1 (color: ${style.color})`);
          }
        }
      }
    }
  }

  // 7. Overlapping sibling controls
  const boxes = checked.map(el => [el, el.getBoundingClientRect()]);
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const [a, ra] = boxes[i];
      const [b, rb] = boxes[j];
      if (a.contains(b) || b.contains(a)) continue;
      if (getComputedStyle(a).display === "inline" || getComputedStyle(b).display === "inline") continue;
      if (a.parentElement === b.parentElement) {
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (w > 4 && h > 4 && w * h > 40) {
          add("OVERLAP", a, `with "${(b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 18)}"`);
        }
      }
    }
  }

  // 8. Badges and prominent headings contrast
  document.querySelectorAll(".section-label, .section-title, .status-pill, .product-badge, .tbs-badge").forEach(el => {
    if (!visible(el)) return;
    const style = getComputedStyle(el);
    const textColor = parseColor(style.color);
    const bg = getBackdrop(el);
    if (textColor && bg) {
      const l1 = relLum(textColor);
      const l2 = relLum(bg);
      const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (cr < 3.0) {
        add("LOW CONTRAST BADGE/TITLE", el, `ratio ${cr.toFixed(2)}:1 < 3.0:1 (color: ${style.color})`);
      }
    }
  });

  return issues;
}
