// Strict in-page audit: inspects page layout, responsiveness, contrast, and interactive elements.
// Runs inside the browser environment and returns a list of issues found.

export function auditPage(opts = {}) {
  const issues = [];
  const add = (kind, el, extra = "") => {
    const label = (el.getAttribute?.("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 32);
    const cls = (typeof el.className === "string" ? el.className : "").split(" ").filter(Boolean).slice(0, 2).join(".");
    issues.push(`${kind}: <${el.tagName.toLowerCase()}${cls ? ` class="${cls}"` : ""}> "${label}" ${extra}`.trim());
  };

  const vw = document.documentElement.clientWidth || window.innerWidth;
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

  // 7. Overlapping sibling controls (within same container or header)
  const boxes = checked.map(el => [el, el.getBoundingClientRect()]);
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const [a, ra] = boxes[i];
      const [b, rb] = boxes[j];
      if (a.contains(b) || b.contains(a)) continue;
      if (getComputedStyle(a).display === "inline" || getComputedStyle(b).display === "inline") continue;
      // Check elements in same parent or both inside .header-inner
      const sameContainer = a.parentElement === b.parentElement || (a.closest('.header-inner') && b.closest('.header-inner'));
      if (sameContainer) {
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (w > 4 && h > 4 && w * h > 40) {
          add("OVERLAP", a, `with "${(b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 18)}" (${Math.round(w)}x${Math.round(h)}px)`);
        }
      }
    }
  }

  // 7b. Header Sibling Collision & Nav Multi-Line Wrap Check (Desktop Nav)
  const logo = document.querySelector('.logo-link');
  const nav = document.querySelector('nav');
  const cta = document.querySelector('.header-cta');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const isDesktopNav = !menuBtn || getComputedStyle(menuBtn).display === 'none';

  if (isDesktopNav) {
    if (logo && nav && visible(logo) && visible(nav)) {
      const lr = logo.getBoundingClientRect();
      const nr = nav.getBoundingClientRect();
      if (lr.right > nr.left + 4) {
        add("HEADER OVERLAP", logo, `overlaps nav by ${Math.round(lr.right - nr.left)}px`);
      }
    }
    if (nav && cta && visible(nav) && visible(cta)) {
      const nr = nav.getBoundingClientRect();
      const cr = cta.getBoundingClientRect();
      if (nr.right > cr.left + 4) {
        add("HEADER OVERLAP", nav, `overlaps cta by ${Math.round(nr.right - cr.left)}px`);
      }
    }
    document.querySelectorAll('.nav-links li a').forEach(a => {
      if (visible(a)) {
        const r = a.getBoundingClientRect();
        if (r.height > 44) {
          add("NAV MULTILINE WRAP", a, `height ${Math.round(r.height)}px exceeds single line`);
        }
      }
    });
  }

  // 8. Badges, status pills and prominent headings contrast
  document.querySelectorAll(".section-label, .section-title, .status-pill, .product-badge, .tbs-badge, .compat-chip, .model-tab, .step-badge, .guarantee-pill, .compat-tag, .wire-tag").forEach(el => {
    if (!visible(el)) return;
    const style = getComputedStyle(el);
    const textColor = parseColor(style.color);
    const bg = getBackdrop(el);
    if (textColor && bg) {
      const l1 = relLum(textColor);
      const l2 = relLum(bg);
      const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const isLarge = parseFloat(style.fontSize) >= 18 || (parseFloat(style.fontSize) >= 14 && Number(style.fontWeight) >= 700);
      const reqRatio = isLarge ? 3.0 : 4.5;
      if (cr < reqRatio) {
        add("LOW CONTRAST BADGE/TITLE", el, `ratio ${cr.toFixed(2)}:1 < ${reqRatio}:1 (color: ${style.color}, bg: rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}))`);
      }
    }
  });

  // 9. Image Frame & Zoom Badge Layout Integrity
  document.querySelectorAll(".main-image-frame").forEach(frame => {
    if (!visible(frame)) return;
    const zh = frame.querySelector(".zoom-hint, .zoom-badge");
    if (zh && visible(zh)) {
      const cs = getComputedStyle(zh);
      if (cs.position !== 'absolute') {
        add("ZOOM BADGE NOT ABSOLUTE", zh, `position: ${cs.position} forces flex layout squeeze`);
      }
      const zr = zh.getBoundingClientRect();
      if (zr.height > 38) {
        add("ZOOM BADGE MULTILINE WRAP", zh, `height ${Math.round(zr.height)}px exceeds single line`);
      }
    }
    const img = frame.querySelector("img");
    if (img && visible(img)) {
      const fr = frame.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      const widthRatio = ir.width / fr.width;
      const heightRatio = ir.height / fr.height;
      if (widthRatio < 0.50 && heightRatio < 0.60 && fr.width > 300) {
        add("IMAGE SQUEEZED", img, `image ${Math.round(ir.width)}x${Math.round(ir.height)}px occupies only ${(widthRatio*100).toFixed(0)}% width and ${(heightRatio*100).toFixed(0)}% height of frame (${Math.round(fr.width)}x${Math.round(fr.height)}px)`);
      }
    }
  });

  // 10. Unstyled Component & Default Browser List Detection
  document.querySelectorAll(".specs-list, ul.footer-links, ul.nav-links").forEach(ul => {
    if (!visible(ul)) return;
    const cs = getComputedStyle(ul);
    if (cs.listStyleType === 'disc' || cs.listStyleType === 'circle' || cs.listStyleType === 'square') {
      add("UNSTYLED DEFAULT BULLETS", ul, `list-style-type: ${cs.listStyleType} renders raw browser bullets`);
    }
  });

  // 11. Multi-Column Desktop Grid Layout Verification
  if (!opts.touch && vw >= 1024) {
    const grids = [
      { sel: '.process-steps-grid', minCols: 3, name: 'Process Steps' },
      { sel: '.reviews-grid', minCols: 3, name: 'Reviews' },
      { sel: '.b2b-cards-grid', minCols: 2, name: 'B2B Cards' },
      { sel: '.trust-ribbon-grid', minCols: 2, name: 'Trust Ribbon' }
    ];
    grids.forEach(({ sel, minCols, name }) => {
      const el = document.querySelector(sel);
      if (el && visible(el)) {
        const cs = getComputedStyle(el);
        if (cs.display !== 'grid') {
          add("COLLAPSED DESKTOP GRID", el, `${name} has display: ${cs.display} instead of grid`);
        } else {
          const cols = (cs.gridTemplateColumns || '').split(' ').filter(Boolean).length;
          if (cols < minCols) {
            add("TOO FEW DESKTOP GRID COLS", el, `${name} has only ${cols} cols (expected min ${minCols})`);
          }
        }
      }
    });
  }

  // 12. Form Select Custom Appearance
  document.querySelectorAll(".form-select, select").forEach(sel => {
    if (!visible(sel)) return;
    const cs = getComputedStyle(sel);
    if (cs.appearance === 'auto') {
      add("UNSTYLED BROWSER SELECT", sel, `appearance: auto renders native OS dropdown`);
    }
    if (parseFloat(cs.paddingRight) < 24) {
      add("SELECT INSUFFICIENT ARROW PADDING", sel, `paddingRight: ${cs.paddingRight} risks overlapping text with chevron`);
    }
  });

  // 13. Button Text Wrapping & Height Harmony in Action Groups
  document.querySelectorAll(".product-action-group, .price-actions").forEach(group => {
    if (!visible(group)) return;
    const cs = getComputedStyle(group);
    if (cs.display !== 'flex' && cs.display !== 'grid') {
      add("ACTION GROUP NOT FLEX", group, `display: ${cs.display} causes block stacking`);
    }
    const btns = [...group.querySelectorAll(".btn")].filter(b => visible(b));
    if (btns.length >= 2) {
      const heights = btns.map(b => b.offsetHeight);
      const maxH = Math.max(...heights);
      const minH = Math.min(...heights);
      if (maxH - minH > 14) {
        add("ACTION BUTTON HEIGHT MISMATCH", group, `button heights vary (${minH}px vs ${maxH}px)`);
      }
    }
  });

  // 14. Theme Harmony & Luminance Consistency
  document.querySelectorAll(".contact-card-box, .company-meta-box, .inquiry-form-card").forEach(card => {
    if (!visible(card)) return;
    const cs = getComputedStyle(card);
    const c = parseColor(cs.backgroundColor);
    if (c && c.a > 0.5) {
      const lum = relLum(c);
      if (lum < 0.3) {
        add("THEME INCONSISTENT DARK CARD", card, `card background ${cs.backgroundColor} (lum ${lum.toFixed(2)}) is black in light mode`);
      }
    }
  });

  return issues;
}
