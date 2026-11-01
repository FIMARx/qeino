/**
 * Qeino Oy — Main Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
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

  // 2. Interactive Product Image Galleries
  initGallery('lidaidGallery', 'lidaidMainImg');
  initGallery('tbsGallery', 'tbsMainImg');

  function initGallery(galleryId, mainImgId) {
    const gallery = document.getElementById(galleryId);
    const mainImg = document.getElementById(mainImgId);
    if (!gallery || !mainImg) return;

    const thumbs = gallery.querySelectorAll('.thumb-btn');
    thumbs.forEach(btn => {
      btn.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const targetSrc = btn.getAttribute('data-full');
        if (targetSrc) {
          mainImg.style.opacity = '0.5';
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

  // 7. Form Submission (Mailto Generator) & Clipboard Copy
  const inquiryForm = document.getElementById('inquiryForm');
  const copyBtn = document.getElementById('copyInquiryBtn');

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

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = buildInquiryData();
      
      if (!data.name || !data.email) {
        showToast('Ole hyvä ja täytä vähintään nimi ja sähköpostiosoite.');
        return;
      }

      const mailtoUrl = `mailto:qeino.fi@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
      window.location.href = mailtoUrl;
      showToast('Sähköpostiohjelma avautuu viestiluonnoksella!');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const data = buildInquiryData();
      const fullText = `Vastaanottaja: qeino.fi@gmail.com\nAihe: ${data.subject}\n\n${data.body}`;
      
      navigator.clipboard.writeText(fullText).then(() => {
        showToast('Viestiluonnos kopioitu leikepöydälle!');
      }).catch(() => {
        showToast('Kopiointi epäonnistui, voit lähettää viestin suoraan sähköpostilla.');
      });
    });
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

  if (tempSlider && tempDisplay) {
    tempSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      tempDisplay.textContent = `${val} °C`;
      
      if (val > 4) {
        if (tempStatus) tempStatus.innerHTML = '<span style="color:#10B981;">● Ulkolämpötila yli +4 °C</span>';
        if (tempElementState) tempElementState.innerHTML = '<strong>Lepoasennossa:</strong> Lämmitys katkaistu automaattisesti virransäästön varmistamiseksi.';
      } else if (val >= -5) {
        if (tempStatus) tempStatus.innerHTML = '<span style="color:#0284C7;">● Pikkupakkanen / kostea</span>';
        if (tempElementState) tempElementState.innerHTML = '<strong>Aktiivinen:</strong> Elementti säätyy n. +45 °C pitäen mekanismin vapaana jäästä ja sohjosta.';
      } else {
        if (tempStatus) tempStatus.innerHTML = '<span style="color:#3B82F6;">● Kova pakkanen</span>';
        if (tempElementState) tempElementState.innerHTML = '<strong>Täysteholämmitys:</strong> Mikroprosessori ohjaa lämmitystä portaattomasti jopa +65 °C asti estäen luukun ja latauspistoolin kiinnijäätymisen.';
      }
    });
  }
});
