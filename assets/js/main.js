/**
 * Qeino Oy — Main Client Logic
 */

function initQeinoApp() {
  console.log("QEINO APP INITIALIZED", !!document.getElementById('mobileMenuBtn'), !!document.getElementById('navLinks'));
  const getI18nData = () => (window.qeinoI18n ? window.qeinoI18n.getData() : null);

  // 1. Mobile Menu Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', isOpen);
      mobileBtn.innerHTML = isOpen 
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
    });

    // Close menu when clicking any nav item
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
        mobileBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
      });
    });
  }

  // 2. Interactive Product Image Galleries & Lightbox
  initGallery('lidaidGallery', 'lidaidMainImg', 'lidaidMainFrame', 'lidaidHotspots');
  initGallery('tbsGallery', 'tbsMainImg', 'tbsMainFrame', 'tbsHotspots');

  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCaption = document.getElementById('lightboxCaption');
  let lastFocusedBeforeLightbox = null;
  let lightboxItems = [];
  let lightboxIndex = 0;

  function renderLightboxSlide() {
    if (!lightboxImg || !lightboxItems.length) return;
    const item = lightboxItems[lightboxIndex];
    const ui = getI18nData()?.ui;
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt || ui?.lightboxFallbackAlt || 'Suurennettu kuva';
    if (lightboxCaption) {
      const label = item.alt || ui?.lightboxFallbackCaption || 'Tuotekuva';
      lightboxCaption.textContent = lightboxItems.length > 1
        ? `${lightboxIndex + 1} / ${lightboxItems.length} — ${label}`
        : label;
    }
    const multi = lightboxItems.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !multi;
    if (lightboxNext) lightboxNext.hidden = !multi;
  }

  function openLightbox(src, alt, galleryItems = null, startIndex = 0) {
    if (!lightbox || !lightboxImg) return;
    lastFocusedBeforeLightbox = document.activeElement;
    if (Array.isArray(galleryItems) && galleryItems.length > 0) {
      lightboxItems = galleryItems;
      lightboxIndex = Math.max(0, Math.min(startIndex, galleryItems.length - 1));
    } else {
      lightboxItems = [{ src, alt: alt || 'Suurennettu kuva' }];
      lightboxIndex = 0;
    }
    renderLightboxSlide();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (lightboxClose) {
      setTimeout(() => lightboxClose.focus(), 50);
    }
  }

  function stepLightbox(delta) {
    if (lightboxItems.length <= 1) return;
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    renderLightboxSlide();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedBeforeLightbox && typeof lastFocusedBeforeLightbox.focus === 'function') {
      lastFocusedBeforeLightbox.focus();
      lastFocusedBeforeLightbox = null;
    }
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      stepLightbox(-1);
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      stepLightbox(1);
    });
  }
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepLightbox(1);
    }
  });

  function initGallery(galleryId, mainImgId, mainFrameId, hotspotLayerId) {
    const gallery = document.getElementById(galleryId);
    const mainImg = document.getElementById(mainImgId);
    const mainFrame = document.getElementById(mainFrameId);
    const hotspotLayer = hotspotLayerId ? document.getElementById(hotspotLayerId) : null;
    if (!gallery || !mainImg) return;

    const thumbs = gallery.querySelectorAll('.thumb-btn');

    if (mainFrame) {
      mainFrame.addEventListener('click', (e) => {
        if (e.target.closest('.hotspot-pin')) return;
        const items = Array.from(thumbs).map(t => ({
          src: t.getAttribute('data-full') || t.querySelector('img')?.src || mainImg.src,
          alt: t.getAttribute('aria-label') || t.querySelector('img')?.alt || mainImg.alt
        }));
        let activeIdx = Array.from(thumbs).findIndex(t => t.classList.contains('active'));
        if (activeIdx < 0) activeIdx = 0;
        openLightbox(mainImg.src, mainImg.alt, items.length ? items : null, activeIdx);
      });
    }
    thumbs.forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        thumbs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const targetSrc = btn.getAttribute('data-full');
        if (targetSrc) {
          mainImg.style.opacity = '0.3';
          mainImg.src = targetSrc;
          mainImg.onload = () => {
            mainImg.style.opacity = '1';
          };
        }

        // Show hotspot pins ONLY on the main product view (first thumbnail)
        if (hotspotLayer) {
          // Close all open tooltips
          hotspotLayer.querySelectorAll('.hotspot-pin').forEach(p => p.classList.remove('active'));
          
          if (index === 0) {
            hotspotLayer.classList.remove('is-hidden');
            hotspotLayer.removeAttribute('hidden');
            hotspotLayer.removeAttribute('aria-hidden');
          } else {
            hotspotLayer.classList.add('is-hidden');
            hotspotLayer.setAttribute('hidden', '');
            hotspotLayer.setAttribute('aria-hidden', 'true');
          }
        }
      });
    });
  }

  // 3. TBS Model Tab Switcher (TBS-231-L vs TBS-221)
  const tbsTabs = document.querySelectorAll('.tbs-model-tab');
  const tbsModelBadge = document.getElementById('tbsModelBadge');
  const tbsTargetInfo = document.getElementById('tbsTargetInfo');
  const tbsLoadInfo = document.getElementById('tbsLoadInfo');
  const tbsProductSelect = document.getElementById('inquiryProduct');
  const tbsMainImg = document.getElementById('tbsMainImg');
  const tbsManualBtn = document.getElementById('tbsManualBtn');
  const tbsManualFin = document.getElementById('tbsManualFin');
  const tbsManualSwe = document.getElementById('tbsManualSwe');
  const tbsManualEng = document.getElementById('tbsManualEng');
  const tbsFirstThumb = document.querySelector('#tbsGallery .thumb-btn:first-child');
  let activeTbsModel = 'TBS-231-L';

  function renderTbsModel(model, resetGallery = true) {
    activeTbsModel = model === 'TBS-221' ? 'TBS-221' : 'TBS-231-L';
    const data = getI18nData()?.tbsModels?.[activeTbsModel];

    if (activeTbsModel === 'TBS-231-L') {
      if (tbsModelBadge) tbsModelBadge.textContent = data?.badge || 'Malli: TBS-231-L (LED-takavalot)';
      if (tbsTargetInfo) tbsTargetInfo.textContent = data?.target || 'Suositellaan moderneille peräkärryille ja trailereille, joissa on LED-takavalot.';
      if (tbsLoadInfo) tbsLoadInfo.textContent = data?.load || 'Maks. 5 A (jopa 60W LED-valotehoa)';
      if (tbsManualBtn) tbsManualBtn.href = data?.manual || 'assets/docs/TBS-231-L_Fin.pdf';
      if (tbsManualFin) tbsManualFin.href = 'assets/docs/TBS-231-L_Fin.pdf';
      if (tbsManualSwe) tbsManualSwe.href = 'assets/docs/TBS-231-L_Swe.pdf';
      if (tbsManualEng) tbsManualEng.href = 'assets/docs/TBS-231-L_eng.pdf';
      if (tbsMainImg) tbsMainImg.alt = data?.alt || 'Takavalokytkin TBS-231-L (LED-malli)';
      if (resetGallery) {
        if (tbsProductSelect) tbsProductSelect.value = 'TBS-231-L (LED-malli)';
        if (tbsMainImg) tbsMainImg.src = 'assets/img/tbs-device.webp';
        if (tbsFirstThumb) {
          tbsFirstThumb.setAttribute('data-full', 'assets/img/tbs-device.webp');
          const thumbImg = tbsFirstThumb.querySelector('img');
          if (thumbImg) thumbImg.src = 'assets/img/tbs-device.webp';
        }
      }
    } else {
      if (tbsModelBadge) tbsModelBadge.textContent = data?.badge || 'Malli: TBS-221 (Hehkulamput)';
      if (tbsTargetInfo) tbsTargetInfo.textContent = data?.target || 'Suunniteltu perinteisille perävaunuille, joissa on tavalliset 12V hehkupolttimot.';
      if (tbsLoadInfo) tbsLoadInfo.textContent = data?.load || 'Maks. 5 A kuormitus';
      if (tbsManualBtn) tbsManualBtn.href = data?.manual || 'assets/docs/TBS-221_Fin.pdf';
      if (tbsManualFin) tbsManualFin.href = 'assets/docs/TBS-221_Fin.pdf';
      if (tbsManualSwe) tbsManualSwe.href = 'assets/docs/TBS-221_Swe.pdf';
      if (tbsManualEng) tbsManualEng.href = 'assets/docs/TBS-221_eng.pdf';
      if (tbsMainImg) tbsMainImg.alt = data?.alt || 'Takavalokytkin TBS-221 (Hehkulamppumalli)';
      if (resetGallery) {
        if (tbsProductSelect) tbsProductSelect.value = 'TBS-221 (Hehkulamppumalli)';
        if (tbsMainImg) tbsMainImg.src = 'assets/img/tbs-221.webp';
        if (tbsFirstThumb) {
          tbsFirstThumb.setAttribute('data-full', 'assets/img/tbs-221.webp');
          const thumbImg = tbsFirstThumb.querySelector('img');
          if (thumbImg) thumbImg.src = 'assets/img/tbs-221.webp';
        }
      }
    }

    if (resetGallery) {
      if (tbsProductSelect) {
        tbsProductSelect.dispatchEvent(new Event('change'));
      }

      // Reset thumbnail selection to the primary device photo and show hotspot pins
      const tbsThumbs = document.querySelectorAll('#tbsGallery .thumb-btn');
      tbsThumbs.forEach((t, i) => {
        if (i === 0) t.classList.add('active');
        else t.classList.remove('active');
      });
      const tbsHotspots = document.getElementById('tbsHotspots');
      if (tbsHotspots) {
        tbsHotspots.classList.remove('is-hidden');
        tbsHotspots.removeAttribute('hidden');
        tbsHotspots.removeAttribute('aria-hidden');
        const pins = tbsHotspots.querySelectorAll('.hotspot-pin');
        const coords = activeTbsModel === 'TBS-231-L'
          ? [
              { top: '26.2%', left: '47.2%' },
              { top: '44%', left: '66%' },
              { top: '60%', left: '63.2%' },
              { top: '84%', left: '46.5%' }
            ]
          : [
              { top: '33.5%', left: '44.5%' },
              { top: '49%', left: '60.5%' },
              { top: '62.5%', left: '57.5%' },
              { top: '85%', left: '40%' }
            ];
        pins.forEach((p, idx) => {
          p.classList.remove('active');
          p.setAttribute('aria-expanded', 'false');
          if (coords[idx]) {
            p.style.top = coords[idx].top;
            p.style.left = coords[idx].left;
          }
        });
      }
    }
  }

  if (tbsTabs.length) {
    tbsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tbsTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');
        renderTbsModel(tab.getAttribute('data-model'), true);
      });
    });
  }

  // 4. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => {
          i.classList.remove('active');
          const q = i.querySelector('.faq-question');
          if (q) q.setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // 5. Customer Type Toggle in Inquiry Form
  const typeBtns = document.querySelectorAll('.type-btn');
  const companyField = document.getElementById('companyFieldGroup');

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      const type = btn.getAttribute('data-type');
      if (companyField) {
        if (type === 'b2b') {
          companyField.style.display = 'block';
        } else {
          companyField.style.display = 'none';
        }
      }
    });
  });

  // 6. Product Quick-Select Chips & Direct CTAs to prefill Inquiry Form
  const productChips = document.querySelectorAll('.product-chip');
  const inquiryProductSelect = document.getElementById('inquiryProduct');

  function syncProductChips(val) {
    if (!productChips.length) return;
    productChips.forEach(chip => {
      const chipVal = chip.getAttribute('data-value');
      const isMatch = chipVal === val || (val && val.includes('LidAid') && chipVal === 'LidAid-latausluukunlämmitin');
      chip.classList.toggle('active', isMatch);
      chip.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
  }

  if (productChips.length && inquiryProductSelect) {
    productChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-value');
        if (val) {
          inquiryProductSelect.value = val;
          syncProductChips(val);
        }
      });
    });

    inquiryProductSelect.addEventListener('change', () => {
      syncProductChips(inquiryProductSelect.value);
    });
  }

  window.selectInquiryProduct = function(productName, isB2B = false) {
    const select = document.getElementById('inquiryProduct');
    const contactSection = document.getElementById('yhteystiedot');
    
    if (select) {
      // Match option even when productName carries a car brand suffix like "LidAid-latausluukunlämmitin (Skoda)"
      const matchOption = Array.from(select.options).find(opt => opt.value === productName)
        || Array.from(select.options).find(opt => productName && productName.startsWith(opt.value));
      if (matchOption) {
        select.value = matchOption.value;
      }
      syncProductChips(select.value);
    }
    
    if (isB2B) {
      const b2bBtn = document.querySelector('.type-btn[data-type="b2b"]');
      if (b2bBtn) b2bBtn.click();
    }
    
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 7. Form Submission (Mailto Generator)
  function buildInquiryData() {
    const ui = getI18nData()?.ui || {};
    const activeTypeBtn = document.querySelector('.type-btn.active');
    const clientType = activeTypeBtn ? activeTypeBtn.textContent.trim() : (ui.defaultClientType || 'Kuluttaja');
    const productSelect = document.getElementById('inquiryProduct');
    const selectedOpt = productSelect && productSelect.options[productSelect.selectedIndex];
    const product = selectedOpt ? selectedOpt.textContent.trim() : (productSelect?.value || ui.defaultProduct || 'Yleinen tiedustelu');
    const name = document.getElementById('inquiryName')?.value.trim() || '';
    const email = document.getElementById('inquiryEmail')?.value.trim() || '';
    const phone = document.getElementById('inquiryPhone')?.value.trim() || '';
    const company = document.getElementById('inquiryCompany')?.value.trim() || '';
    const message = document.getElementById('inquiryMessage')?.value.trim() || '';

    const subject = `${ui.subjectPrefix || 'Tiedustelu Qeino Oy'}: ${product} (${clientType})`;
    
    let body = `${ui.greeting || 'Hei Hannu / Qeino Oy,'}\n\n`;
    body += `${ui.interestLabel || 'Olen kiinnostunut seuraavasta tuotteesta / aiheesta'}: ${product}\n`;
    body += `${ui.clientTypeLabel || 'Asiakastyyppi'}: ${clientType}\n\n`;
    body += `${ui.contactInfoHeader || 'Yhteystietoni:'}\n`;
    body += `${ui.nameLabel || 'Nimi'}: ${name}\n`;
    body += `${ui.emailLabel || 'Sähköposti'}: ${email}\n`;
    body += `${ui.phoneLabel || 'Puhelin'}: ${phone}\n`;
    if (company) {
      body += `${ui.companyLabel || 'Yritys / Y-tunnus'}: ${company}\n`;
    }
    body += `\n${ui.messageHeader || 'Viesti / Tiedustelu:'}\n${message}\n\n`;
    body += `${ui.regards || 'Terveisin,'}\n${name}`;

    return { subject, body, name, email };
  }

  window.handleInquirySubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const ui = getI18nData()?.ui || {};
    const data = buildInquiryData();
    
    if (!data.name || !data.email) {
      showToast(ui.validationToast || 'Ole hyvä ja täytä vähintään nimi ja sähköpostiosoite.');
      return false;
    }

    const mailtoUrl = `mailto:qeino.fi@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    window.location.href = mailtoUrl;
    
    const successBanner = document.getElementById('inquirySuccess');
    if (successBanner) {
      successBanner.style.display = 'block';
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => {
        successBanner.style.display = 'none';
      }, 10000);
    }
    showToast(ui.mailtoToast || 'Sähköpostiohjelma avautuu valmiilla viestillä!');
    return false;
  };

  window.copyInquiryMessage = function() {
    const ui = getI18nData()?.ui || {};
    const data = buildInquiryData();
    const formatted = `${ui.copySubjectLabel || 'Aihe'}: ${data.subject}\n\n${data.body}\n\n${ui.copyRecipientLabel || 'Vastaanottaja'}: qeino.fi@gmail.com`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).then(() => {
        handleCopySuccess();
      }).catch(() => {
        fallbackCopyText(formatted);
      });
    } else {
      fallbackCopyText(formatted);
    }
  };

  function fallbackCopyText(text) {
    const ui = getI18nData()?.ui || {};
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      handleCopySuccess();
    } catch (err) {
      showToast(ui.copyFailToast || 'Kopiointi leikepöydälle ei onnistunut.');
    }
    document.body.removeChild(ta);
  }

  function handleCopySuccess() {
    const ui = getI18nData()?.ui || {};
    const copyBtnText = document.getElementById('copyBtnText');
    if (copyBtnText) {
      copyBtnText.textContent = ui.copyBtnDone || '✓ Viesti kopioitu leikepöydälle!';
      setTimeout(() => {
        const latestUi = getI18nData()?.ui || {};
        copyBtnText.textContent = latestUi.copyBtnDefault || 'Kopioi viesti leikepöydälle';
      }, 3500);
    }
    showToast(ui.copySuccessToast || 'Viesti kopioitu leikepöydälle! Voit nyt liittää sen sähköpostiisi.');
  }

  const inquiryForm = document.getElementById('inquiryForm');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', window.handleInquirySubmit);
  }

  // 8. Toast Helper
  function showToast(message) {
    let toast = document.getElementById('toastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotice';
      toast.className = 'toast-notice';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // 9. Interactive Thermally Reactive Temperature Simulator for LidAid
  const tempSlider = document.getElementById('tempSlider');
  const tempDisplay = document.getElementById('tempDisplay');
  const tempStatus = document.getElementById('tempStatus');
  const tempElementState = document.getElementById('tempElementState');
  const simElementTemp = document.getElementById('simElementTemp');
  const simPowerUsage = document.getElementById('simPowerUsage');
  const winterSimCard = document.getElementById('winterSimCard');
  const simPowerFill = document.getElementById('simPowerFill');
  const simPowerPercent = document.getElementById('simPowerPercent');
  const simPresetBtns = document.querySelectorAll('.sim-preset-btn');

  let updateSim = null;

  if (tempSlider && tempDisplay) {
    updateSim = (val) => {
      const states = getI18nData()?.simStates;
      tempDisplay.textContent = `${val > 0 ? '+' : ''}${val} °C`;

      simPresetBtns.forEach(btn => {
        const presetVal = parseInt(btn.getAttribute('data-temp'), 10);
        btn.classList.toggle('active', presetVal === val);
      });

      if (winterSimCard) {
        winterSimCard.classList.remove('sim-state-frost', 'sim-state-slush', 'sim-state-standby');
      }

      if (val > 4) {
        const s = states?.standby;
        tempDisplay.style.color = '#059669';
        if (winterSimCard) winterSimCard.classList.add('sim-state-standby');
        if (simPowerFill) {
          simPowerFill.style.width = '0%';
          simPowerFill.style.background = '#10B981';
        }
        if (simPowerPercent) simPowerPercent.textContent = s?.percent || '0 % (Lepotila • Akku suojattu)';
        if (tempStatus) tempStatus.innerHTML = `<span class="status-dot-pulse" style="background:#10B981; box-shadow:0 0 8px #10B981;"></span><span>${s?.status || 'Lauha / Kesätila: Virta katkaistu (0 W)'}</span>`;
        if (simElementTemp) simElementTemp.textContent = s?.element || 'Lepotilassa (0 W)';
        if (simPowerUsage) simPowerUsage.textContent = s?.power || '0 W (Ei kuormita akkua lainkaan)';
        if (tempElementState) tempElementState.innerHTML = s?.desc || '<strong>Automaattinen virransäästö:</strong> Kun ulkolämpötila nousee yli +4 °C, mikroprosessori katkaisee elementin virransyötön kokonaan. Akkua ei pureta koskaan turhaan.';
      } else if (val >= -4) {
        const s = states?.slush;
        tempDisplay.style.color = '#0284C7';
        if (winterSimCard) winterSimCard.classList.add('sim-state-slush');
        if (simPowerFill) {
          simPowerFill.style.width = '68%';
          simPowerFill.style.background = 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)';
        }
        if (simPowerPercent) simPowerPercent.textContent = s?.percent || '68 % (Ylläpitolämpö)';
        if (tempStatus) tempStatus.innerHTML = `<span class="status-dot-pulse" style="background:#0284C7; box-shadow:0 0 8px #0284C7;"></span><span>${s?.status || 'Pikkupakkanen / kostea sohjokeli'}</span>`;
        if (simElementTemp) simElementTemp.textContent = s?.element || '+45 °C (Ylläpitolämpö)';
        if (simPowerUsage) simPowerUsage.textContent = s?.power || '~15 W (Vain auton ollessa hereillä)';
        if (tempElementState) tempElementState.innerHTML = s?.desc || '<strong>Sohjo- ja nollakeli:</strong> Elementti tuottaa tasaisen ylläpitolämmön (+45 °C), joka pitää luukun reunan, tiivisteen ja lukitustapin täysin vapaana sohjosta ja alijäähtyneestä vedestä.';
      } else {
        const s = states?.frost;
        tempDisplay.style.color = '#1D4ED8';
        if (winterSimCard) winterSimCard.classList.add('sim-state-frost');
        if (simPowerFill) {
          simPowerFill.style.width = '100%';
          simPowerFill.style.background = 'linear-gradient(90deg, #1D4ED8 0%, #3B82F6 60%, #F59E0B 100%)';
        }
        if (simPowerPercent) simPowerPercent.textContent = s?.percent || '100 % (Täysteho sulatus)';
        if (tempStatus) tempStatus.innerHTML = `<span class="status-dot-pulse" style="background:#3B82F6; box-shadow:0 0 8px #3B82F6;"></span><span>${s?.status || 'Kova pakkanen: Täysteholämmitys'}</span>`;
        if (simElementTemp) simElementTemp.textContent = s?.element || '+65 °C (Täysteho sulatus)';
        if (simPowerUsage) simPowerUsage.textContent = s?.power || '~20 W (Vain auton ollessa hereillä)';
        if (tempElementState) tempElementState.innerHTML = s?.desc || '<strong>Täysteholämmitys:</strong> Mikroprosessori ohjaa lämmitystä portaattomasti jopa +65 °C asti estäen luukun ja latauspistoolin kiinnijäätymisen paukkupakkasillakin.';
      }
    };

    tempSlider.addEventListener('input', (e) => {
      updateSim(parseInt(e.target.value, 10));
    });

    simPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-temp'), 10);
        tempSlider.value = String(val);
        updateSim(val);
      });
    });
  }

  // 9b. Hero Dual-Product Preview Switcher (LidAid / Takavalokytkin TBS)
  const heroSwitchBtns = document.querySelectorAll('.hero-switch-btn');
  let activeHeroProduct = 'lidaid';

  function renderHeroProduct(key) {
    activeHeroProduct = key === 'tbs' ? 'tbs' : 'lidaid';
    const catalog = getI18nData()?.heroCatalog;
    const item = catalog?.[activeHeroProduct];
    if (!item) return;

    heroSwitchBtns.forEach(b => {
      const isMatch = b.getAttribute('data-hero-product') === activeHeroProduct;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });

    const imgEl = document.getElementById('heroPreviewImg');
    if (imgEl) {
      imgEl.src = item.img;
      imgEl.alt = item.alt;
    }
    const tagSpan = document.querySelector('#heroPreviewTag span');
    if (tagSpan) tagSpan.textContent = item.tag;
    const titleEl = document.getElementById('heroPreviewTitle');
    if (titleEl) titleEl.textContent = item.title;
    const descEl = document.getElementById('heroPreviewDesc');
    if (descEl) descEl.textContent = item.desc;
    const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setTxt('heroSpec1Label', item.s1l);
    setTxt('heroSpec1Val', item.s1v);
    setTxt('heroSpec2Label', item.s2l);
    setTxt('heroSpec2Val', item.s2v);
    setTxt('heroSpec3Label', item.s3l);
    setTxt('heroSpec3Val', item.s3v);
    setTxt('heroPreviewCtaText', item.cta);
    const ctaEl = document.getElementById('heroPreviewCta');
    if (ctaEl) ctaEl.setAttribute('href', item.href);
  }

  if (heroSwitchBtns.length) {
    heroSwitchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        renderHeroProduct(btn.getAttribute('data-hero-product'));
      });
    });
  }

  // 9c. 1-Click Copy Email Helper (Footer)
  window.copyEmailAddress = function() {
    const ui = getI18nData()?.ui || {};
    const email = 'qeino.fi@gmail.com';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        showToast(ui.emailCopiedToast || 'Sähköpostiosoite qeino.fi@gmail.com kopioitu!');
      }).catch(() => {
        fallbackCopyText(email);
      });
    } else {
      fallbackCopyText(email);
    }
  };

  // 10. Vehicle Compatibility Selector for LidAid
  const compatChips = document.querySelectorAll('.compat-chip');
  const compatModelName = document.getElementById('compatModelName');
  const compatModelText = document.getElementById('compatModelText');
  const compatSelectBtn = document.getElementById('compatSelectBtn');
  let activeCompatBrand = 'skoda';

  function renderCompatBrand(brand) {
    activeCompatBrand = brand || 'skoda';
    const table = getI18nData()?.compatData;
    const data = table?.[activeCompatBrand] || table?.other;
    if (!data) return;

    compatChips.forEach(c => {
      const isMatch = c.getAttribute('data-brand') === activeCompatBrand;
      c.classList.toggle('active', isMatch);
      c.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    if (compatModelName) compatModelName.textContent = data.title;
    if (compatModelText) compatModelText.textContent = data.desc;
    if (compatSelectBtn) {
      const span = compatSelectBtn.querySelector('span');
      if (span) span.textContent = data.btnText;
      compatSelectBtn.setAttribute('onclick', `selectInquiryProduct('${data.productVal}')`);
    }
  }

  if (compatChips.length) {
    compatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        renderCompatBrand(chip.getAttribute('data-brand'));
      });
    });
  }

  // 11. Live EV Model Search
  const evSearchInput = document.getElementById('evSearchInput');
  if (evSearchInput && compatChips.length) {
    const searchMap = [
      { brand: 'skoda', terms: ['skoda', 'enyaq', 'superb', 'octavia', 'iv', 'elroq', 'kodiaq'] },
      { brand: 'vw', terms: ['vw', 'volkswagen', 'id.3', 'id.4', 'id.5', 'id.7', 'buzz', 'passat', 'golf', 'gte', 'id3', 'id4', 'id5', 'id7'] },
      { brand: 'cupra', terms: ['cupra', 'born', 'tavascan', 'terramar', 'formentor', 'leon', 'seat'] },
      { brand: 'audi', terms: ['audi', 'q4', 'q8', 'e-tron', 'etron', 'tfsi', 'gt'] },
      { brand: 'bmw', terms: ['bmw', 'ix3', 'i4', 'ix', 'i5', 'i7', 'ix1', 'i3', '330e', '530e', '225xe'] },
      { brand: 'hyundai', terms: ['hyundai', 'kia', 'ioniq', 'kona', 'ev6', 'ev9', 'niro', 'ev'] }
    ];

    evSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;

      let matchedBrand = null;
      for (const item of searchMap) {
        if (item.terms.some(t => q.includes(t) || t.includes(q))) {
          matchedBrand = item.brand;
          break;
        }
      }

      if (!matchedBrand && q.length >= 3) {
        matchedBrand = 'other';
      }

      if (matchedBrand) {
        const targetChip = Array.from(compatChips).find(c => c.getAttribute('data-brand') === matchedBrand);
        if (targetChip && !targetChip.classList.contains('active')) {
          targetChip.click();
        }
      }
    });
  }

  // 12. Interactive Hotspot Touch & Click Toggle
  const hotspotPins = document.querySelectorAll('.hotspot-pin');
  hotspotPins.forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation(); // Do not trigger lightbox modal click
      const wasActive = pin.classList.contains('active');
      hotspotPins.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-expanded', 'false');
      });
      if (!wasActive) {
        pin.classList.add('active');
        pin.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', () => {
    hotspotPins.forEach(p => {
      p.classList.remove('active');
      p.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hotspotPins.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // 13. Custom Video Showcase Play Overlays
  document.querySelectorAll('.video-wrap').forEach(wrap => {
    const video = wrap.querySelector('video');
    const overlay = wrap.querySelector('.video-play-overlay');
    if (!video || !overlay) return;

    overlay.addEventListener('click', () => {
      overlay.classList.add('is-playing');
      video.play().catch(() => {
        // Fallback if autoplay/play is interrupted
        overlay.classList.remove('is-playing');
      });
    });

    video.addEventListener('play', () => {
      overlay.classList.add('is-playing');
    });

    video.addEventListener('ended', () => {
      overlay.classList.remove('is-playing');
    });
  });

  // 14. Scroll-Progress Hairline, Frosted Header, Scroll-Spy Nav & Back-to-Top
  const siteHeader = document.querySelector('.site-header');
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const backToTopBtn = document.getElementById('backToTopBtn');
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const observedSections = navAnchors
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function updateScrollUI() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

    if (scrollProgressBar) {
      scrollProgressBar.style.width = `${pct.toFixed(1)}%`;
    }
    if (siteHeader) {
      siteHeader.classList.toggle('scrolled', scrollTop > 24);
    }
    if (backToTopBtn) {
      backToTopBtn.classList.toggle('visible', scrollTop > 600);
    }
  }

  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if ('IntersectionObserver' in window && observedSections.length) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navAnchors.forEach(a => {
            const isActive = a.getAttribute('href') === `#${id}`;
            a.classList.toggle('active', isActive);
            if (isActive) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0.01 });

    observedSections.forEach(sec => spyObserver.observe(sec));
  }

  // 15. Tactile Scroll-Reveal Choreography (Disabled cleanly for prefers-reduced-motion)
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealGroups = [
      '.trust-item',
      '.review-card',
      '.process-step-card',
      '.b2b-card',
      '.story-quote-card',
      '.contact-shell'
    ];
    const revealEls = document.querySelectorAll(revealGroups.join(', '));
    revealEls.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        return; // Already in initial viewport — never hide above-the-fold content
      }
      el.classList.add('reveal-up');
      el.style.transitionDelay = `${(idx % 3) * 70}ms`;
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -24px 0px' });

    document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));
  }

  // 16. Trilingual Sync (FI / SV / EN)
  function syncActiveGalleryImage(galleryId, mainImgId) {
    const activeThumb = document.querySelector(`#${galleryId} .thumb-btn.active`);
    const mainImg = document.getElementById(mainImgId);
    if (!activeThumb || !mainImg) return;
    const fullSrc = activeThumb.getAttribute('data-full');
    if (fullSrc && mainImg.getAttribute('src') !== fullSrc) {
      mainImg.src = fullSrc;
      const thumbAlt = activeThumb.getAttribute('aria-label') || activeThumb.querySelector('img')?.alt;
      if (thumbAlt) mainImg.alt = thumbAlt;
    }
  }

  window.addEventListener('qeino:langchange', () => {
    renderHeroProduct(activeHeroProduct);
    renderCompatBrand(activeCompatBrand);
    renderTbsModel(activeTbsModel, false);
    syncActiveGalleryImage('lidaidGallery', 'lidaidMainImg');
    syncActiveGalleryImage('tbsGallery', 'tbsMainImg');
    if (updateSim && tempSlider) {
      updateSim(parseInt(tempSlider.value, 10));
    }
  });

  if (window.qeinoI18n) {
    window.qeinoI18n.initLangSwitcher();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQeinoApp);
} else {
  initQeinoApp();
}
