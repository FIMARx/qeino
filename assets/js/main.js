/**
 * Qeino Oy — Main Client Logic
 */

function initQeinoApp() {
  console.log("QEINO APP INITIALIZED", !!document.getElementById('mobileMenuBtn'), !!document.getElementById('navLinks'));
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
  initGallery('lidaidGallery', 'lidaidMainImg', 'lidaidMainFrame');
  initGallery('tbsGallery', 'tbsMainImg', 'tbsMainFrame');

  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Suurennettu kuva';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });

  function initGallery(galleryId, mainImgId, mainFrameId) {
    const gallery = document.getElementById(galleryId);
    const mainImg = document.getElementById(mainImgId);
    const mainFrame = document.getElementById(mainFrameId);
    if (!gallery || !mainImg) return;

    if (mainFrame) {
      mainFrame.addEventListener('click', () => {
        openLightbox(mainImg.src, mainImg.alt);
      });
    }

    const thumbs = gallery.querySelectorAll('.thumb-btn');
    thumbs.forEach(btn => {
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
      });
    });
  }

  // 3. TBS Model Tab Switcher (TBS-231-L vs TBS-221)
  const tbsTabs = document.querySelectorAll('.tbs-model-tab');
  const tbsModelBadge = document.getElementById('tbsModelBadge');
  const tbsTargetInfo = document.getElementById('tbsTargetInfo');
  const tbsLoadInfo = document.getElementById('tbsLoadInfo');
  const tbsProductSelect = document.getElementById('inquiryProduct');

  if (tbsTabs.length) {
    tbsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tbsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const model = tab.getAttribute('data-model');
        
        if (model === 'TBS-231-L') {
          if (tbsModelBadge) tbsModelBadge.textContent = 'Malli: TBS-231-L (LED-takavalot)';
          if (tbsTargetInfo) tbsTargetInfo.textContent = 'Suositellaan moderneille peräkärryille ja trailereille, joissa on LED-takavalot.';
          if (tbsLoadInfo) tbsLoadInfo.textContent = 'Maks. 5 A (jopa 60W LED-valotehoa)';
          if (tbsProductSelect) tbsProductSelect.value = 'TBS-231-L (LED-malli)';
        } else {
          if (tbsModelBadge) tbsModelBadge.textContent = 'Malli: TBS-221 (Hehkulamput)';
          if (tbsTargetInfo) tbsTargetInfo.textContent = 'Suunniteltu perinteisille perävaunuille, joissa on tavalliset 12V hehkupolttimot.';
          if (tbsLoadInfo) tbsLoadInfo.textContent = 'Maks. 5 A kuormitus';
          if (tbsProductSelect) tbsProductSelect.value = 'TBS-221 (Hehkulamppumalli)';
        }
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
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 5. Customer Type Toggle in Inquiry Form
  const typeBtns = document.querySelectorAll('.type-btn');
  const companyField = document.getElementById('companyFieldGroup');

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

  // 6. Direct CTAs to prefill Inquiry Form
  window.selectInquiryProduct = function(productName, isB2B = false) {
    const select = document.getElementById('inquiryProduct');
    const contactSection = document.getElementById('yhteystiedot');
    
    if (select) {
      select.value = productName;
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
    const activeTypeBtn = document.querySelector('.type-btn.active');
    const clientType = activeTypeBtn ? activeTypeBtn.textContent.trim() : 'Kuluttaja';
    const product = document.getElementById('inquiryProduct')?.value || 'Yleinen tiedustelu';
    const name = document.getElementById('inquiryName')?.value.trim() || '';
    const email = document.getElementById('inquiryEmail')?.value.trim() || '';
    const phone = document.getElementById('inquiryPhone')?.value.trim() || '';
    const company = document.getElementById('inquiryCompany')?.value.trim() || '';
    const message = document.getElementById('inquiryMessage')?.value.trim() || '';

    const subject = `Tiedustelu Qeino Oy: ${product} (${clientType})`;
    
    let body = `Hei Hannu / Qeino Oy,\n\n`;
    body += `Olen kiinnostunut seuraavasta tuotteesta / aiheesta: ${product}\n`;
    body += `Asiakastyyppi: ${clientType}\n\n`;
    body += `Yhteystietoni:\n`;
    body += `Nimi: ${name}\n`;
    body += `Sähköposti: ${email}\n`;
    body += `Puhelin: ${phone}\n`;
    if (company) {
      body += `Yritys / Y-tunnus: ${company}\n`;
    }
    body += `\nViesti / Tiedustelu:\n${message}\n\n`;
    body += `Terveisin,\n${name}`;

    return { subject, body, name, email };
  }

  window.handleInquirySubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const data = buildInquiryData();
    
    if (!data.name || !data.email) {
      showToast('Ole hyvä ja täytä vähintään nimi ja sähköpostiosoite.');
      return false;
    }

    const mailtoUrl = `mailto:qeino.fi@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    window.location.href = mailtoUrl;
    
    const successBanner = document.getElementById('inquirySuccess');
    if (successBanner) {
      successBanner.style.display = 'block';
      setTimeout(() => {
        successBanner.style.display = 'none';
      }, 7000);
    }
    showToast('Sähköpostiohjelma avautuu!');
    return false;
  };

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
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // 9. Interactive Temperature Simulator for LidAid
  const tempSlider = document.getElementById('tempSlider');
  const tempDisplay = document.getElementById('tempDisplay');
  const tempStatus = document.getElementById('tempStatus');
  const tempElementState = document.getElementById('tempElementState');
  const simElementTemp = document.getElementById('simElementTemp');
  const simPowerUsage = document.getElementById('simPowerUsage');

  if (tempSlider && tempDisplay) {
    const updateSim = (val) => {
      tempDisplay.textContent = `${val > 0 ? '+' : ''}${val} °C`;
      
      if (val > 4) {
        tempDisplay.style.color = '#059669';
        if (tempStatus) tempStatus.innerHTML = '<span class="status-dot-pulse" style="background:#10B981; box-shadow:0 0 8px #10B981;"></span><span>Lauha / Kesätila: Virta katkaistu (0 W)</span>';
        if (simElementTemp) simElementTemp.textContent = 'Lepotilassa (0 W)';
        if (simPowerUsage) simPowerUsage.textContent = '0 W (Ei kuormita akkua lainkaan)';
        if (tempElementState) tempElementState.innerHTML = '<strong>Automaattinen virransäästö:</strong> Kun ulkolämpötila nousee yli +4 °C, mikroprosessori katkaisee elementin virransyötön kokonaan. Akkua ei pureta koskaan turhaan.';
      } else if (val >= -4) {
        tempDisplay.style.color = '#0284C7';
        if (tempStatus) tempStatus.innerHTML = '<span class="status-dot-pulse" style="background:#0284C7; box-shadow:0 0 8px #0284C7;"></span><span>Pikkupakkanen / kostea sohjokeli</span>';
        if (simElementTemp) simElementTemp.textContent = '+45 °C (Ylläpitolämpö)';
        if (simPowerUsage) simPowerUsage.textContent = '~15 W (Vain auton ollessa hereillä)';
        if (tempElementState) tempElementState.innerHTML = '<strong>Sohjo- ja nollakeli:</strong> Elementti tuottaa tasaisen ylläpitolämmön (+45 °C), joka pitää luukun reunan, tiivisteen ja lukitustapin täysin vapaana sohjosta ja alijäähtyneestä vedestä.';
      } else {
        tempDisplay.style.color = '#1D4ED8';
        if (tempStatus) tempStatus.innerHTML = '<span class="status-dot-pulse" style="background:#3B82F6; box-shadow:0 0 8px #3B82F6;"></span><span>Kova pakkanen: Täysteholämmitys</span>';
        if (simElementTemp) simElementTemp.textContent = '+65 °C (Täysteho sulatus)';
        if (simPowerUsage) simPowerUsage.textContent = '~20 W (Vain auton ollessa hereillä)';
        if (tempElementState) tempElementState.innerHTML = '<strong>Täysteholämmitys:</strong> Mikroprosessori ohjaa lämmitystä portaattomasti jopa +65 °C asti estäen luukun ja latauspistoolin kiinnijäätymisen paukkupakkasillakin.';
      }
    };

    tempSlider.addEventListener('input', (e) => {
      updateSim(parseInt(e.target.value, 10));
    });
  }

  // 10. Vehicle Compatibility Selector for LidAid
  const compatData = {
    skoda: {
      title: "Skoda Enyaq iV (50, 60, 80, 85, vRS) & Superb / Octavia iV",
      desc: "Enyaqissa latausluukun salpamekanismi on erittäin altis nuoskalumen ja alijäähtyneen veden jäätymiselle. LidAidin ultraohut lämpökalvo asennetaan suoraan luukun sisäpintaan vesivalumareitin taakse. Kytkentä tapahtuu turvallisesti auton 12V herätevirtaan — ei vaikuta korkeajänniteakkuun eikä auton tehdastakuuseen.",
      productVal: "LidAid-latausluukunlämmitin (Skoda)",
      btnText: "Valitse LidAid Skodalle & pyydä tarjous"
    },
    vw: {
      title: "Volkswagen ID.3, ID.4, ID.5, ID.7, ID. Buzz & Passat / Golf GTE",
      desc: "VW MEB-pohjaisissa sähköautoissa (ID-sarja) latausluukku kerää herkästi sohjoa ajoviiman mukana. LidAidin termostaattiohjattu lämmitin pitää luukun reunan ja lukitustapin täysin sulana ilman pelkoa 12V akun tyhjenemisestä.",
      productVal: "LidAid-latausluukunlämmitin (Volkswagen)",
      btnText: "Valitse LidAid Volkswagenille & pyydä tarjous"
    },
    cupra: {
      title: "Cupra Born, Tavascan, Terramar & Formentor / Leon e-Hybrid",
      desc: "Cupran sähkö- ja hybridimalleissa latausluukun tiiviste ja lukitusjousi toimivat luotettavasti läpi talven. Ohut silikonielementti mahtuu huomaamattomasti luukun kotelon sisälle ilman pintamuutoksia.",
      productVal: "LidAid-latausluukunlämmitin (Cupra / SEAT)",
      btnText: "Valitse LidAid Cupralle & pyydä tarjous"
    },
    audi: {
      title: "Audi Q4 e-tron, Q8 e-tron, e-tron GT & TFSI e -lataushybridit",
      desc: "Täysin yhteensopiva Audin sähköisen luukunmekanismin kanssa. Lämmitin ehkäisee servo- ja lukitusmoottorin ylikuormittumisen, kun jää ei pääse estämään luukun avausliikettä.",
      productVal: "LidAid-latausluukunlämmitin (Audi)",
      btnText: "Valitse LidAid Audille & pyydä tarjous"
    },
    bmw: {
      title: "BMW iX3, i4, iX, i5, i7, iX1 & 330e, 530e, 225xe -mallit",
      desc: "BMW:n sähköisissä luukuissa LidAid suojaa luukun mekaanisen painallussalvan jäätymiseltä. Älykäs mikrokontrolleri kytkeytyy automaattisesti pois päältä lämpötilan noustessa yli +4 °C.",
      productVal: "LidAid-latausluukunlämmitin (BMW)",
      btnText: "Valitse LidAid BMW:lle & pyydä tarjous"
    },
    hyundai: {
      title: "Hyundai Ioniq 5 / 6, Kona Electric & Kia EV6 / EV9, Niro EV",
      desc: "Korealaisissa 800V-arkkitehtuurin autoissa LidAid kytkeytyy erilliseen 12V apujärjestelmään, joten pikalatausominaisuudet tai ajoakun takuu säilyvät 100 % koskemattomina.",
      productVal: "LidAid-latausluukunlämmitin (Hyundai / Kia)",
      btnText: "Valitse LidAid Hyundai/Kialle & pyydä tarjous"
    },
    other: {
      title: "Kaikki muut Type 2 & CCS -sähköautot ja ladattavat hybridit",
      desc: "LidAid on universaalisti asennettavissa käytännössä mihin tahansa 12V sähköjärjestelmällä varustettuun sähköautoon tai hybridiin (mm. Tesla Model 3/Y/S, Volvo EX40/EX30, Polestar 2/3/4, Mercedes-Benz EQ, Renault, Peugeot, Ford, Nissan ym.).",
      productVal: "LidAid-latausluukunlämmitin (Muu automalli)",
      btnText: "Valitse LidAid autollesi & pyydä tarjous"
    }
  };

  const compatChips = document.querySelectorAll('.compat-chip');
  const compatModelName = document.getElementById('compatModelName');
  const compatModelText = document.getElementById('compatModelText');
  const compatSelectBtn = document.getElementById('compatSelectBtn');

  if (compatChips.length) {
    compatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        compatChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-selected', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');

        const brand = chip.getAttribute('data-brand');
        const data = compatData[brand] || compatData.other;

        if (compatModelName) compatModelName.textContent = data.title;
        if (compatModelText) compatModelText.textContent = data.desc;
        if (compatSelectBtn) {
          const span = compatSelectBtn.querySelector('span');
          if (span) span.textContent = data.btnText;
          compatSelectBtn.setAttribute('onclick', `selectInquiryProduct('${data.productVal}')`);
        }
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
      hotspotPins.forEach(p => p.classList.remove('active'));
      if (!wasActive) {
        pin.classList.add('active');
      }
    });
  });

  document.addEventListener('click', () => {
    hotspotPins.forEach(p => p.classList.remove('active'));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQeinoApp);
} else {
  initQeinoApp();
}
