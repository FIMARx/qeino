// Comprehensive multi-browser & mobile device test matrix for Qeino Oy website.
// Modeled after DigiKaveri's strict end-to-end device audit harness.
//
// Usage:
//   node tests/e2e/matrix.mjs                 (Runs core mobile + desktop devices)
//   node tests/e2e/matrix.mjs --full          (Runs all 13 devices in devices.mjs)
//   node tests/e2e/matrix.mjs --device=fold5  (Runs specific device)
//   node tests/e2e/matrix.mjs --shots         (Saves viewport screenshots to tests/e2e/out/)

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { launchBrowser, sleep } from "./lib.mjs";
import { DEVICES } from "./devices.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const url = args.url || "http://127.0.0.1:8080/";
const devices = args.device
  ? DEVICES.filter((d) => String(args.device).split(",").includes(d.id))
  : args.full
  ? DEVICES
  : DEVICES.filter((d) => d.core);

const outDir = join(process.cwd(), "tests", "e2e", "out");
if (args.shots) mkdirSync(outDir, { recursive: true });

console.log("================================================================================");
console.log("  QEINO OY — AUTOMATED E2E & MOBILE AUDIT MATRIX");
console.log(`  Target: ${url}`);
console.log(`  Profiles: ${devices.length} device(s)`);
console.log("================================================================================\n");

let totalIssues = 0;
let totalChecks = 0;
let passedChecks = 0;
const results = [];

const b = await launchBrowser({ url });

try {
  for (const d of devices) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`▶ TESTING: ${d.name} (${d.w}x${d.h} @${d.dpr}x${d.touch ? ", touch" : ""}) [ID: ${d.id}]`);
    console.log(`--------------------------------------------------------------------------------`);

    await b.emulate(d);
    await b.goto(url);

    const deviceIssues = [];
    const record = (issues, context = "") => {
      for (const iss of issues) {
        const item = context ? `[${context}] ${iss}` : iss;
        deviceIssues.push(item);
        console.log(`   ✖ ${item}`);
      }
    };

    const check = (title, condition, extra = "") => {
      totalChecks++;
      if (condition) {
        passedChecks++;
        console.log(`   ✔ ${title}`);
      } else {
        totalIssues++;
        const msg = `FAIL: ${title}${extra ? ` — ${extra}` : ""}`;
        deviceIssues.push(msg);
        console.log(`   ✖ ${msg}`);
      }
    };

    const click = async (sel) => {
      return b.realClick(sel);
    };

    // 1. Initial Page Layout & Contrast Audit (Top of page)
    const initialAudit = await b.audit({ touch: d.touch });
    record(initialAudit, "Initial Viewport");
    check(`${d.id}: Zero layout/contrast issues at top`, initialAudit.length === 0);

    // 2. Mobile Menu Navigation (Mobile viewports <= 768px)
    if (d.w <= 768) {
      console.log(`   ... Testing Mobile Menu Toggle ...`);
      const menuBtnBox = await b.ev(`(() => {
        const el = document.getElementById('mobileMenuBtn');
        return el ? { w: el.offsetWidth, h: el.offsetHeight } : null;
      })()`);
      check(`${d.id}: Mobile menu button exists with touch size >= 36px`, menuBtnBox && menuBtnBox.w >= 36 && menuBtnBox.h >= 36, `${menuBtnBox?.w}x${menuBtnBox?.h}`);

      await click('#mobileMenuBtn');
      await sleep(350);

      const isMenuOpen = await b.ev(`document.getElementById('navLinks')?.classList.contains('open')`);
      check(`${d.id}: Mobile menu opens on click`, isMenuOpen === true);

      // Audit with menu open
      const menuAudit = await b.audit({ touch: d.touch });
      record(menuAudit, "Mobile Menu Open");

      // Close menu
      await click('#mobileMenuBtn');
      await sleep(350);
      const isMenuClosed = !(await b.ev(`document.getElementById('navLinks')?.classList.contains('open')`));
      check(`${d.id}: Mobile menu closes on toggle`, isMenuClosed === true);
    }

    // 3. LidAid Gallery Thumbnails Switching
    console.log(`   ... Testing LidAid Gallery Thumbnails ...`);
    const lidThumbsCount = await b.ev(`document.querySelectorAll('#lidaidGallery .thumb-btn').length`);
    check(`${d.id}: LidAid gallery has 3 thumbnails`, lidThumbsCount === 3);

    // Click 2nd thumbnail (lidaid-angle)
    await click('#lidaidGallery .thumb-btn:nth-child(2)');
    await sleep(350);
    const lidSrc2 = await b.ev(`document.getElementById('lidaidMainImg')?.getAttribute('src')`);
    check(`${d.id}: LidAid switches to angle image`, lidSrc2 && lidSrc2.includes('lidaid-angle.webp'), lidSrc2);

    // Click 3rd thumbnail (liittimet)
    await click('#lidaidGallery .thumb-btn:nth-child(3)');
    await sleep(350);
    const lidSrc3 = await b.ev(`document.getElementById('lidaidMainImg')?.getAttribute('src')`);
    check(`${d.id}: LidAid switches to liittimet image`, lidSrc3 && lidSrc3.includes('liittimet.webp'), lidSrc3);

    // Click 1st thumbnail (lidaid-device)
    await click('#lidaidGallery .thumb-btn:nth-child(1)');
    await sleep(350);
    const lidSrc1 = await b.ev(`document.getElementById('lidaidMainImg')?.getAttribute('src')`);
    check(`${d.id}: LidAid switches back to device image`, lidSrc1 && lidSrc1.includes('lidaid-device.webp'), lidSrc1);

    // 4. Lightbox Modal Inspection
    console.log(`   ... Testing Lightbox Modal Zoom ...`);
    await click('#lidaidMainFrame');
    await sleep(350);

    const isLightboxOpen = await b.ev(`document.getElementById('lightboxModal')?.classList.contains('open')`);
    const lbImgSrc = await b.ev(`document.getElementById('lightboxImg')?.getAttribute('src')`);
    check(`${d.id}: Lightbox opens with full-size product image`, isLightboxOpen && lbImgSrc && lbImgSrc.includes('lidaid-device.webp'));

    // Close lightbox via Escape key
    await b.pressKey('Escape');
    await sleep(250);
    const isLightboxClosed = !(await b.ev(`document.getElementById('lightboxModal')?.classList.contains('open')`));
    check(`${d.id}: Lightbox closes via Escape key`, isLightboxClosed === true);

    // 4b. LidAid Vehicle Compatibility Selector
    console.log(`   ... Testing Vehicle Compatibility Selector & Live EV Search ...`);
    await click('.compat-chip[data-brand="vw"]');
    await sleep(250);
    const vwModel = await b.ev(`document.getElementById('compatModelName')?.textContent.trim()`);
    check(`${d.id}: Compatibility selector switches to Volkswagen`, vwModel && vwModel.includes('Volkswagen ID'), vwModel);

    await click('.compat-chip[data-brand="hyundai"]');
    await sleep(250);
    const hyundaiModel = await b.ev(`document.getElementById('compatModelName')?.textContent.trim()`);
    check(`${d.id}: Compatibility selector switches to Hyundai/Kia`, hyundaiModel && hyundaiModel.includes('Hyundai Ioniq'), hyundaiModel);

    await click('.compat-chip[data-brand="skoda"]');
    await sleep(250);

    // Live EV Search Input Test
    await b.ev(`(() => {
      const input = document.getElementById('evSearchInput');
      if (input) {
        input.value = 'id.4';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await sleep(250);
    const searchVwActive = await b.ev(`document.querySelector('.compat-chip[data-brand="vw"]')?.classList.contains('active')`);
    check(`${d.id}: EV search 'id.4' activates Volkswagen`, searchVwActive === true);

    await b.ev(`(() => {
      const input = document.getElementById('evSearchInput');
      if (input) {
        input.value = 'enyaq';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await sleep(250);
    const searchSkodaActive = await b.ev(`document.querySelector('.compat-chip[data-brand="skoda"]')?.classList.contains('active')`);
    check(`${d.id}: EV search 'enyaq' activates Skoda`, searchSkodaActive === true);

    // Interactive Winter Simulator Test
    console.log(`   ... Testing Interactive Winter Simulator & Hotspots ...`);
    await b.ev(`(() => {
      const slider = document.getElementById('tempSlider');
      if (slider) {
        slider.value = '10';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await sleep(200);
    const simCutoffText = await b.ev(`document.getElementById('simPowerUsage')?.textContent.trim()`);
    check(`${d.id}: Winter simulator responds to +10 °C cutoff`, simCutoffText && simCutoffText.includes('0 W'), simCutoffText);

    // Reset slider to -15 °C
    await b.ev(`(() => {
      const slider = document.getElementById('tempSlider');
      if (slider) {
        slider.value = '-15';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`);
    await sleep(200);

    // Hotspot Click Test
    await click('#lidaidHotspots .hotspot-pin');
    await sleep(200);
    const hotspotActive = await b.ev(`document.querySelector('#lidaidHotspots .hotspot-pin')?.classList.contains('active')`);
    check(`${d.id}: LidAid hotspot activates on click`, hotspotActive === true);

    // Close hotspot
    await b.ev(`document.body.click()`);
    await sleep(150);

    // 5. Scroll down to Takavalokytkin & TBS Model Selector
    console.log(`   ... Testing TBS Model Switcher, Demonstration Video & Patent Seal ...`);
    const lidaidVideoSrc = await b.ev(`document.querySelector('#lidaid .video-wrap video source')?.getAttribute('src')`);
    const tbsVideoSrc = await b.ev(`document.querySelector('#takavalokytkin .video-wrap video source')?.getAttribute('src')`);
    check(`${d.id}: LidAid demonstration video is embedded`, lidaidVideoSrc && lidaidVideoSrc.includes('lidaid-demo.mp4'), lidaidVideoSrc);
    check(`${d.id}: TBS demonstration video is embedded`, tbsVideoSrc && tbsVideoSrc.includes('tbs-demo.mp4'), tbsVideoSrc);

    const patentText = await b.ev(`document.querySelector('.patent-seal-card')?.textContent.trim()`);
    check(`${d.id}: Patent seal badge is rendered`, patentText && patentText.includes('Patentoitu'), patentText);

    const packageCards = await b.ev(`document.querySelectorAll('.package-contents-card').length`);
    check(`${d.id}: In-The-Box package cards rendered for both products`, packageCards >= 2, String(packageCards));

    const pressBannerText = await b.ev(`document.querySelector('.press-feature-banner')?.textContent.trim()`);
    check(`${d.id}: Ilta-Sanomat press banner is rendered`, pressBannerText && pressBannerText.includes('ILTA-SANOMAT'), pressBannerText);

    // Schema.org structured data check
    const jsonLdValid = await b.ev(`(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      if (!script) return false;
      try {
        const json = JSON.parse(script.textContent);
        return json['@context'] === 'https://schema.org' && Array.isArray(json['@graph']);
      } catch (e) {
        return false;
      }
    })()`);
    check(`${d.id}: Schema.org JSON-LD structured data is present & valid`, jsonLdValid === true);

    // Mobile sticky bar responsive visibility check
    const mobileBarDisplay = await b.ev(`getComputedStyle(document.getElementById('mobileStickyBar')).display`);
    if (d.w <= 768) {
      check(`${d.id}: Mobile quick-contact bar is visible on mobile`, mobileBarDisplay === 'flex', mobileBarDisplay);
    } else {
      check(`${d.id}: Mobile quick-contact bar is hidden on desktop`, mobileBarDisplay === 'none', mobileBarDisplay);
    }
    // Switch to TBS-221
    await click('.tbs-model-tab[data-model="TBS-221"]');
    await sleep(350);

    const badgeText221 = await b.ev(`document.getElementById('tbsModelBadge')?.textContent.trim()`);
    const selectVal221 = await b.ev(`document.getElementById('inquiryProduct')?.value`);
    check(`${d.id}: TBS model switcher updates badge to TBS-221`, badgeText221 && badgeText221.includes('TBS-221'), badgeText221);
    check(`${d.id}: TBS model switcher prefills form select with TBS-221`, selectVal221 && selectVal221.includes('TBS-221'), selectVal221);

    // Switch back to TBS-231-L
    await click('.tbs-model-tab[data-model="TBS-231-L"]');
    await sleep(350);
    const badgeText231 = await b.ev(`document.getElementById('tbsModelBadge')?.textContent.trim()`);
    check(`${d.id}: TBS model switcher updates badge to TBS-231-L`, badgeText231 && badgeText231.includes('TBS-231-L'), badgeText231);

    // Switch TBS thumbnails
    await click('#tbsGallery .thumb-btn:nth-child(2)');
    await sleep(350);
    const tbsSrc2 = await b.ev(`document.getElementById('tbsMainImg')?.getAttribute('src')`);
    check(`${d.id}: TBS gallery switches to PCB image`, tbsSrc2 && tbsSrc2.includes('tbs-pcb.webp'), tbsSrc2);

    await click('#tbsGallery .thumb-btn:nth-child(3)');
    await sleep(350);
    const tbsSrc3 = await b.ev(`document.getElementById('tbsMainImg')?.getAttribute('src')`);
    check(`${d.id}: TBS gallery switches to kytkentäkaavio schematic`, tbsSrc3 && tbsSrc3.includes('tbs-kytkenta.webp'), tbsSrc3);

    await click('#tbsGallery .thumb-btn:nth-child(1)');
    await sleep(350);
    const tbsSrc1 = await b.ev(`document.getElementById('tbsMainImg')?.getAttribute('src')`);
    check(`${d.id}: TBS gallery switches back to device image`, tbsSrc1 && tbsSrc1.includes('tbs-device.webp'), tbsSrc1);

    // 6. FAQ Accordion Toggle (Click item 2 which is collapsed by default)
    console.log(`   ... Testing FAQ Accordion ...`);
    await click('.faq-item:nth-child(2) .faq-question');
    await sleep(350);
    const secondFaqActive = await b.ev(`document.querySelector('.faq-item:nth-child(2)')?.classList.contains('active')`);
    check(`${d.id}: FAQ question expands on click`, secondFaqActive === true);

    // 7. Contact Form Customer Type Toggle
    console.log(`   ... Testing Contact Form Customer Switcher ...`);
    const initialCompanyDisplay = await b.ev(`getComputedStyle(document.getElementById('companyFieldGroup')).display`);
    check(`${d.id}: Company field is hidden for consumers by default`, initialCompanyDisplay === 'none');

    await click('.type-btn[data-type="b2b"]');
    await sleep(350);
    const b2bCompanyDisplay = await b.ev(`getComputedStyle(document.getElementById('companyFieldGroup')).display`);
    check(`${d.id}: Company field is visible for B2B/jälleenmyyjät`, b2bCompanyDisplay !== 'none');

    await click('.type-btn[data-type="consumer"]');
    await sleep(350);
    const consumerCompanyDisplay = await b.ev(`getComputedStyle(document.getElementById('companyFieldGroup')).display`);
    check(`${d.id}: Company field is hidden again when returning to consumer`, consumerCompanyDisplay === 'none');

    // 8. Full Page Audit at the bottom
    await b.ev(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(350);
    const scrolledAudit = await b.audit({ touch: d.touch });
    record(scrolledAudit, "Bottom of page");
    check(`${d.id}: Zero layout/contrast issues at bottom of page`, scrolledAudit.length === 0);

    // 9. Check Console Errors and Uncaught Exceptions
    const errors = b.getErrors().filter((e) => !/live feed not connected|favicon/.test(e));
    check(`${d.id}: Zero console errors or unhandled exceptions`, errors.length === 0, errors.join(" ; "));

    // 10. Optional Screenshot
    if (args.shots) {
      const shotFile = join(outDir, `${d.id}.png`);
      await b.shot(shotFile);
      console.log(`   [Shot saved: ${shotFile}]`);
    }

    results.push({
      id: d.id,
      name: d.name,
      viewport: `${d.w}x${d.h}`,
      touch: d.touch,
      issuesCount: deviceIssues.length
    });
  }
} finally {
  await b.close();
}

console.log("\n================================================================================");
console.log("  TEST MATRIX SUMMARY");
console.log("================================================================================");
console.table(results);

console.log(`Total assertions evaluated: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed / Issues: ${totalIssues}`);

if (totalIssues > 0) {
  console.log(`\n❌ MATRIX FAILED: ${totalIssues} issue(s) detected.`);
  process.exit(1);
} else {
  console.log(`\n✅ ALL DEVICE CHECKS PASSED PERFECTLY across all tested viewports!`);
  process.exit(0);
}
