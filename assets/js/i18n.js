/**
 * Qeino Oy — Trilingual Internationalization Engine (FI | SV | EN)
 * Keeps Finnish (fi) as the native HTML default, snapshots exact FI DOM on init,
 * and seamlessly translates all static + dynamic UI content to Swedish (sv) and English (en).
 */
(function () {
  'use strict';

  const SUPPORTED = ['fi', 'sv', 'en'];
  const STORAGE_KEY = 'qeino_lang';
  let currentLang = 'fi';
  let fiSnapshotCaptured = false;
  const fiTextSnapshot = new Map();
  const fiHtmlSnapshot = new Map();
  const fiAttrSnapshot = new Map();

  // =========================================================================
  // 1. DYNAMIC COMPONENT DATA TABLES (Used by main.js)
  // =========================================================================
  const dynamicData = {
    fi: {
      heroCatalog: {
        lidaid: {
          img: 'assets/img/lidaid-device.webp?v=2',
          alt: 'LidAid-latausluukunlämmitin ohjainlaite',
          tag: '−15 °C testattu',
          title: 'LidAid-latausluukunlämmitin',
          desc: 'Mikroprosessoriohjattu automaattilämmitin pitää sähköauton ja hybridin latausluukun ja pistokkeen sulana kovissakin pakkasissa.',
          s1l: 'Virrankulutus', s1v: '~20 W',
          s2l: 'Säätöalue', s2v: '+45...+65°C',
          s3l: 'Katkaisu', s3v: '> +4°C autom.',
          href: '#lidaid',
          cta: 'Tutustu LidAidiin tarkemmin'
        },
        tbs: {
          img: 'assets/img/tbs-device.webp',
          alt: 'Perävaunun takavalokytkin TBS-231-L ohjainyksikkö',
          tag: 'PRH-mallisuojattu',
          title: 'Perävaunun takavalokytkin (TBS)',
          desc: 'Mallisuojattu kytkinlaite muuttaa perävaunun omat takavalot tehokkaiksi peruutusvaloiksi ilman häikäisevää takasumuvaloa.',
          s1l: 'Käyttöjännite', s1v: '12 VDC',
          s2l: 'Kuormitus', s2v: 'Maks. 5 A',
          s3l: 'Mallit', s3v: 'LED & Hehku',
          href: '#takavalokytkin',
          cta: 'Tutustu takavalokytkimeen'
        }
      },
      tbsModels: {
        'TBS-231-L': {
          badge: 'Malli: TBS-231-L (LED-takavalot)',
          target: 'Suositellaan moderneille peräkärryille ja trailereille, joissa on LED-takavalot.',
          load: 'Maks. 5 A (jopa 60W LED-valotehoa)',
          alt: 'Takavalokytkin TBS-231-L (LED-malli)',
          manual: 'assets/docs/TBS-231-L_Fin.pdf'
        },
        'TBS-221': {
          badge: 'Malli: TBS-221 (Hehkulamput)',
          target: 'Suunniteltu perinteisille perävaunuille, joissa on tavalliset 12V hehkupolttimot.',
          load: 'Maks. 5 A kuormitus',
          alt: 'Takavalokytkin TBS-221 (Hehkulamppumalli)',
          manual: 'assets/docs/TBS-221_Fin.pdf'
        }
      },
      simStates: {
        standby: {
          percent: '0 % (Lepotila • Akku suojattu)',
          status: 'Lauha / Kesätila: Virta katkaistu (0 W)',
          element: 'Lepotilassa (0 W)',
          power: '0 W (Ei kuormita akkua lainkaan)',
          desc: '<strong>Automaattinen virransäästö:</strong> Kun ulkolämpötila nousee yli +4 °C, mikroprosessori katkaisee elementin virransyötön kokonaan. Akkua ei pureta koskaan turhaan.'
        },
        slush: {
          percent: '68 % (Ylläpitolämpö)',
          status: 'Pikkupakkanen / kostea sohjokeli',
          element: '+45 °C (Ylläpitolämpö)',
          power: '~15 W (Vain auton ollessa hereillä)',
          desc: '<strong>Sohjo- ja nollakeli:</strong> Elementti tuottaa tasaisen ylläpitolämmön (+45 °C), joka pitää luukun reunan, tiivisteen ja lukitustapin täysin vapaana sohjosta ja alijäähtyneestä vedestä.'
        },
        frost: {
          percent: '100 % (Täysteho sulatus)',
          status: 'Kova pakkanen: Täysteholämmitys',
          element: '+65 °C (Täysteho sulatus)',
          power: '~20 W (Vain auton ollessa hereillä)',
          desc: '<strong>Täysteholämmitys:</strong> Mikroprosessori ohjaa lämmitystä portaattomasti jopa +65 °C asti estäen luukun ja latauspistoolin kiinnijäätymisen paukkupakkasillakin.'
        }
      },
      compatData: {
        skoda: {
          title: 'Skoda Enyaq iV (50, 60, 80, 85, vRS) & Superb / Octavia iV',
          desc: 'Enyaqissa latausluukun salpamekanismi on erittäin altis nuoskalumen ja alijäähtyneen veden jäätymiselle. LidAidin ultraohut lämpökalvo asennetaan suoraan luukun sisäpintaan vesivalumareitin taakse. Kytkentä tapahtuu turvallisesti auton 12V herätevirtaan — ei vaikuta korkeajänniteakkuun eikä auton tehdastakuuseen.',
          productVal: 'LidAid-latausluukunlämmitin (Skoda)',
          btnText: 'Valitse LidAid Skodalle & pyydä tarjous'
        },
        vw: {
          title: 'Volkswagen ID.3, ID.4, ID.5, ID.7, ID. Buzz & Passat / Golf GTE',
          desc: 'VW MEB-pohjaisissa sähköautoissa (ID-sarja) latausluukku kerää herkästi sohjoa ajoviiman mukana. LidAidin termostaattiohjattu lämmitin pitää luukun reunan ja lukitustapin täysin sulana ilman pelkoa 12V akun tyhjenemisestä.',
          productVal: 'LidAid-latausluukunlämmitin (Volkswagen)',
          btnText: 'Valitse LidAid Volkswagenille & pyydä tarjous'
        },
        cupra: {
          title: 'Cupra Born, Tavascan, Terramar & Formentor / Leon e-Hybrid',
          desc: 'Cupran sähkö- ja hybridimalleissa latausluukun tiiviste ja lukitusjousi toimivat luotettavasti läpi talven. Ohut silikonielementti mahtuu huomaamattomasti luukun kotelon sisälle ilman pintamuutoksia.',
          productVal: 'LidAid-latausluukunlämmitin (Cupra / SEAT)',
          btnText: 'Valitse LidAid Cupralle & pyydä tarjous'
        },
        audi: {
          title: 'Audi Q4 e-tron, Q8 e-tron, e-tron GT & TFSI e -lataushybridit',
          desc: 'Täysin yhteensopiva Audin sähköisen luukunmekanismin kanssa. Lämmitin ehkäisee servo- ja lukitusmoottorin ylikuormittumisen, kun jää ei pääse estämään luukun avausliikettä.',
          productVal: 'LidAid-latausluukunlämmitin (Audi)',
          btnText: 'Valitse LidAid Audille & pyydä tarjous'
        },
        bmw: {
          title: 'BMW iX3, i4, iX, i5, i7, iX1 & 330e, 530e, 225xe -mallit',
          desc: 'BMW:n sähköisissä luukuissa LidAid suojaa luukun mekaanisen painallussalvan jäätymiseltä. Älykäs mikrokontrolleri kytkeytyy automaattisesti pois päältä lämpötilan noustessa yli +4 °C.',
          productVal: 'LidAid-latausluukunlämmitin (BMW)',
          btnText: 'Valitse LidAid BMW:lle & pyydä tarjous'
        },
        hyundai: {
          title: 'Hyundai Ioniq 5 / 6, Kona Electric & Kia EV6 / EV9, Niro EV',
          desc: 'Korealaisissa 800V-arkkitehtuurin autoissa LidAid kytkeytyy erilliseen 12V apujärjestelmään, joten pikalatausominaisuudet tai ajoakun takuu säilyvät 100 % koskemattomina.',
          productVal: 'LidAid-latausluukunlämmitin (Hyundai / Kia)',
          btnText: 'Valitse LidAid Hyundai/Kialle & pyydä tarjous'
        },
        other: {
          title: 'Kaikki muut Type 2 & CCS -sähköautot ja ladattavat hybridit',
          desc: 'LidAid on universaalisti asennettavissa käytännössä mihin tahansa 12V sähköjärjestelmällä varustettuun sähköautoon tai hybridiin.',
          productVal: 'LidAid-latausluukunlämmitin (Muu automalli)',
          btnText: 'Valitse LidAid autollesi & pyydä tarjous'
        }
      },
      ui: {
        defaultClientType: 'Kuluttaja',
        defaultProduct: 'Yleinen tiedustelu',
        subjectPrefix: 'Tiedustelu Qeino Oy',
        greeting: 'Hei Hannu / Qeino Oy,',
        interestLabel: 'Olen kiinnostunut seuraavasta tuotteesta / aiheesta',
        clientTypeLabel: 'Asiakastyyppi',
        contactInfoHeader: 'Yhteystietoni:',
        nameLabel: 'Nimi',
        emailLabel: 'Sähköposti',
        phoneLabel: 'Puhelin',
        companyLabel: 'Yritys / Y-tunnus',
        messageHeader: 'Viesti / Tiedustelu:',
        regards: 'Terveisin,',
        copySubjectLabel: 'Aihe',
        copyRecipientLabel: 'Vastaanottaja',
        validationToast: 'Ole hyvä ja täytä vähintään nimi ja sähköpostiosoite.',
        mailtoToast: 'Sähköpostiohjelma avautuu valmiilla viestillä!',
        copyFailToast: 'Kopiointi leikepöydälle ei onnistunut.',
        copyBtnDone: '✓ Viesti kopioitu leikepöydälle!',
        copyBtnDefault: 'Kopioi viesti leikepöydälle',
        copySuccessToast: 'Viesti kopioitu leikepöydälle! Voit nyt liittää sen sähköpostiisi.',
        emailCopiedToast: 'Sähköpostiosoite qeino.fi@gmail.com kopioitu!',
        lightboxFallbackAlt: 'Suurennettu kuva',
        lightboxFallbackCaption: 'Tuotekuva'
      }
    },

    sv: {
      heroCatalog: {
        lidaid: {
          img: 'assets/img/lidaid-device.webp?v=2',
          alt: 'LidAid laddluckevärmare styrenhet',
          tag: 'Testad vid −15 °C',
          title: 'LidAid laddluckevärmare',
          desc: 'Mikroprocessorstyrd automatisk värmare som håller elbilens och laddhybridens laddlucka och kontakt isfria även i sträng kyla.',
          s1l: 'Effekt', s1v: '~20 W',
          s2l: 'Reglerområde', s2v: '+45...+65°C',
          s3l: 'Frånslag', s3v: '> +4°C autom.',
          href: '#lidaid',
          cta: 'Läs mer om LidAid'
        },
        tbs: {
          img: 'assets/img/tbs-device.webp',
          alt: 'Släpvagns bakljusbrytare TBS-231-L styrenhet',
          tag: 'Mönsterskyddad i Finland',
          title: 'Släpvagnens bakljusbrytare (TBS)',
          desc: 'Mönsterskyddad brytarenhet som förvandlar släpets egna bakljus till effektiva backljus utan att bilens bländande bakre dimljus tänds.',
          s1l: 'Driftspänning', s1v: '12 VDC',
          s2l: 'Belastning', s2v: 'Max 5 A',
          s3l: 'Modeller', s3v: 'LED & Glöd',
          href: '#takavalokytkin',
          cta: 'Läs mer om TBS-brytaren'
        }
      },
      tbsModels: {
        'TBS-231-L': {
          badge: 'Modell: TBS-231-L (LED-bakljus)',
          target: 'Rekommenderas för moderna släpvagnar och trailers utrustade med LED-bakljus.',
          load: 'Max 5 A (upp till 60 W LED-belysning)',
          alt: 'Bakljusbrytare TBS-231-L (LED-modell)',
          manual: 'assets/docs/TBS-231-L_Swe.pdf'
        },
        'TBS-221': {
          badge: 'Modell: TBS-221 (Glödlampor)',
          target: 'Utvecklad för traditionella släpvagnar med vanliga 12 V glödlampor.',
          load: 'Max 5 A belastning',
          alt: 'Bakljusbrytare TBS-221 (Glödlampsmodell)',
          manual: 'assets/docs/TBS-221_Swe.pdf'
        }
      },
      simStates: {
        standby: {
          percent: '0 % (Viloläge • Batteriskydd)',
          status: 'Milt väder / Sommarläge: Ström bruten (0 W)',
          element: 'I viloläge (0 W)',
          power: '0 W (Belastar inte batteriet alls)',
          desc: '<strong>Automatisk strömbesparing:</strong> När utomhustemperaturen stiger över +4 °C bryter mikroprocessorn strömmen till värmeelementet helt. Batteriet laddas aldrig ur i onödan.'
        },
        slush: {
          percent: '68 % (Underhållsvärme)',
          status: 'Lätt frost / fuktigt slaskväder',
          element: '+45 °C (Underhållsvärme)',
          power: '~15 W (Endast när bilen är vaken)',
          desc: '<strong>Slask och nollgradigt:</strong> Elementet ger en jämn underhållsvärme (+45 °C) som håller luckans kant, tätning och låspinne helt fria från blötsnö och underkylt vatten.'
        },
        frost: {
          percent: '100 % (Full avfrostning)',
          status: 'Sträng kyla: Full värmeeffekt',
          element: '+65 °C (Full avfrostning)',
          power: '~20 W (Endast när bilen är vaken)',
          desc: '<strong>Full värmeeffekt:</strong> Mikroprocessorn reglerar värmen steglöst upp till +65 °C och förhindrar att laddluckan och laddhandtaget fryser fast även i smällkall vinter.'
        }
      },
      compatData: {
        skoda: {
          title: 'Skoda Enyaq iV (50, 60, 80, 85, vRS) & Superb / Octavia iV',
          desc: 'På Enyaq är laddluckans låsmekanism mycket utsatt för blötsnö och underkylt regn som fryser till is. LidAids ultratunna värmefolie monteras direkt på luckans insida bakom vattenavrinningen. Ansluts säkert till bilens 12 V-styrsignal — påverkar varken högvoltsbatteriet eller nybilsgarantin.',
          productVal: 'LidAid-latausluukunlämmitin (Skoda)',
          btnText: 'Välj LidAid för Skoda & begär offert'
        },
        vw: {
          title: 'Volkswagen ID.3, ID.4, ID.5, ID.7, ID. Buzz & Passat / Golf GTE',
          desc: 'I VW:s MEB-baserade elbilar (ID-serien) samlas lätt slask runt laddluckan i fartvinden. LidAids termostatstyrda värmare håller luckans kant och låspinne helt isfria utan risk att tömma 12 V-batteriet.',
          productVal: 'LidAid-latausluukunlämmitin (Volkswagen)',
          btnText: 'Välj LidAid för Volkswagen & begär offert'
        },
        cupra: {
          title: 'Cupra Born, Tavascan, Terramar & Formentor / Leon e-Hybrid',
          desc: 'På Cupras el- och hybridmodeller håller LidAid laddluckans tätning och låsfjäder driftsäkra hela vintern. Det tunna silikonelementet ryms diskret inuti luckhuset utan synliga ändringar.',
          productVal: 'LidAid-latausluukunlämmitin (Cupra / SEAT)',
          btnText: 'Välj LidAid för Cupra & begär offert'
        },
        audi: {
          title: 'Audi Q4 e-tron, Q8 e-tron, e-tron GT & TFSI e laddhybrider',
          desc: 'Helt kompatibel med Audis elektriska laddlucka. Värmaren förhindrar att servo- och låsmotorn överbelastas genom att hålla mekanismen fri från is.',
          productVal: 'LidAid-latausluukunlämmitin (Audi)',
          btnText: 'Välj LidAid för Audi & begär offert'
        },
        bmw: {
          title: 'BMW iX3, i4, iX, i5, i7, iX1 & 330e, 530e, 225xe',
          desc: 'På BMW:s modeller skyddar LidAid laddluckans mekaniska trycklås mot fastfrysning. Den smarta mikrokontrollern stänger automatiskt av sig när temperaturen stiger över +4 °C.',
          productVal: 'LidAid-latausluukunlämmitin (BMW)',
          btnText: 'Välj LidAid för BMW & begär offert'
        },
        hyundai: {
          title: 'Hyundai Ioniq 5 / 6, Kona Electric & Kia EV6 / EV9, Niro EV',
          desc: 'I koreanska 800 V-bilar ansluts LidAid till det separata 12 V-systemet, så snabbladdning och batterigaranti förblir 100 % opåverkade.',
          productVal: 'LidAid-latausluukunlämmitin (Hyundai / Kia)',
          btnText: 'Välj LidAid för Hyundai/Kia & begär offert'
        },
        other: {
          title: 'Alla övriga Type 2 & CCS elbilar och laddhybrider',
          desc: 'LidAid har en universell design och kan installeras i praktiskt taget alla elbilar och laddhybrider med 12 V-system.',
          productVal: 'LidAid-latausluukunlämmitin (Muu automalli)',
          btnText: 'Välj LidAid för din bil & begär offert'
        }
      },
      ui: {
        defaultClientType: 'Privatkund',
        defaultProduct: 'Allmän förfrågan',
        subjectPrefix: 'Förfrågan Qeino Oy',
        greeting: 'Hej Hannu / Qeino Oy,',
        interestLabel: 'Jag är intresserad av följande produkt / ärende',
        clientTypeLabel: 'Kundtyp',
        contactInfoHeader: 'Mina kontaktuppgifter:',
        nameLabel: 'Namn',
        emailLabel: 'E-post',
        phoneLabel: 'Telefon',
        companyLabel: 'Företag / Org.nr',
        messageHeader: 'Meddelande / Förfrågan:',
        regards: 'Vänliga hälsningar,',
        copySubjectLabel: 'Ämne',
        copyRecipientLabel: 'Mottagare',
        validationToast: 'Vänligen fyll i minst ditt namn och din e-postadress.',
        mailtoToast: 'Ditt e-postprogram öppnas med ett färdigt meddelande!',
        copyFailToast: 'Kunde inte kopiera till urklipp.',
        copyBtnDone: '✓ Meddelandet kopierat!',
        copyBtnDefault: 'Kopiera meddelande till urklipp',
        copySuccessToast: 'Meddelandet kopierat! Klistra in det direkt i din e-post.',
        emailCopiedToast: 'E-postadressen qeino.fi@gmail.com kopierad!',
        lightboxFallbackAlt: 'Förstorad bild',
        lightboxFallbackCaption: 'Produktbild'
      }
    },

    en: {
      heroCatalog: {
        lidaid: {
          img: 'assets/img/lidaid-device.webp?v=2',
          alt: 'LidAid EV charge port heater controller unit',
          tag: '−15 °C tested',
          title: 'LidAid Charge Port Heater',
          desc: 'Microprocessor-controlled automatic heater that keeps EV and plug-in hybrid charge flaps and connectors ice-free even in extreme Arctic cold.',
          s1l: 'Power draw', s1v: '~20 W',
          s2l: 'Temp range', s2v: '+45...+65°C',
          s3l: 'Auto shut-off', s3v: '> +4°C auto',
          href: '#lidaid',
          cta: 'Explore LidAid in detail'
        },
        tbs: {
          img: 'assets/img/tbs-device.webp',
          alt: 'Trailer taillight switch TBS-231-L controller unit',
          tag: 'Design-Protected in Finland',
          title: 'Trailer Taillight Switch (TBS)',
          desc: 'Design-protected Finnish switch unit that turns your trailer’s own taillights into effective reversing lights without blinding rear fog-light glare.',
          s1l: 'Voltage', s1v: '12 VDC',
          s2l: 'Max load', s2v: 'Max 5 A',
          s3l: 'Models', s3v: 'LED & Bulb',
          href: '#takavalokytkin',
          cta: 'Explore the TBS switch'
        }
      },
      tbsModels: {
        'TBS-231-L': {
          badge: 'Model: TBS-231-L (LED Taillights)',
          target: 'Recommended for modern utility and boat trailers equipped with LED taillights.',
          load: 'Max 5 A (up to 60 W LED lighting)',
          alt: 'Trailer Taillight Switch TBS-231-L (LED model)',
          manual: 'assets/docs/TBS-231-L_eng.pdf'
        },
        'TBS-221': {
          badge: 'Model: TBS-221 (Incandescent Bulbs)',
          target: 'Designed for traditional trailers equipped with standard 12 V incandescent bulbs.',
          load: 'Max 5 A load',
          alt: 'Trailer Taillight Switch TBS-221 (Bulb model)',
          manual: 'assets/docs/TBS-221_eng.pdf'
        }
      },
      simStates: {
        standby: {
          percent: '0 % (Standby • Battery Protected)',
          status: 'Mild / Summer Mode: Power Off (0 W)',
          element: 'Standby (0 W)',
          power: '0 W (Zero battery drain)',
          desc: '<strong>Automatic Power Saving:</strong> Whenever ambient temperature rises above +4 °C, the microprocessor cuts heater power completely. Your 12 V battery is never drained unnecessarily.'
        },
        slush: {
          percent: '68 % (Maintenance Heat)',
          status: 'Light Frost / Wet Slush Conditions',
          element: '+45 °C (Maintenance Heat)',
          power: '~15 W (Only while vehicle is awake)',
          desc: '<strong>Slush & Freezing Rain:</strong> The element delivers steady maintenance heat (+45 °C), keeping the flap edges, weather seal, and latch pin completely clear of wet snow and freezing sleet.'
        },
        frost: {
          percent: '100 % (Full Defrost Power)',
          status: 'Severe Frost: Full Heating Active',
          element: '+65 °C (Full Defrost)',
          power: '~20 W (Only while vehicle is awake)',
          desc: '<strong>Full Heating Output:</strong> The microprocessor regulates the flexible silicone element steplessly up to +65 °C, preventing the flap and charging plug from freezing shut even in sub-Arctic cold.'
        }
      },
      compatData: {
        skoda: {
          title: 'Skoda Enyaq iV (50, 60, 80, 85, vRS) & Superb / Octavia iV',
          desc: 'On the Enyaq, the charge flap latch mechanism is notoriously prone to freezing in wet snow and sleet. LidAid’s ultra-thin heating film installs cleanly inside the flap cavity behind the water channel. Connects safely to the vehicle’s 12 V wake-up feed — zero effect on the HV battery or factory warranty.',
          productVal: 'LidAid-latausluukunlämmitin (Skoda)',
          btnText: 'Select LidAid for Skoda & request quote'
        },
        vw: {
          title: 'Volkswagen ID.3, ID.4, ID.5, ID.7, ID. Buzz & Passat / Golf GTE',
          desc: 'On VW MEB-platform EVs (ID. series), road spray and slush easily pack around the charge port flap. LidAid’s thermostat-controlled heater keeps the flap perimeter and locking pin completely ice-free without risking 12 V battery drain.',
          productVal: 'LidAid-latausluukunlämmitin (Volkswagen)',
          btnText: 'Select LidAid for Volkswagen & request quote'
        },
        cupra: {
          title: 'Cupra Born, Tavascan, Terramar & Formentor / Leon e-Hybrid',
          desc: 'For Cupra EVs and plug-in hybrids, LidAid keeps the flap seal and spring latch operating effortlessly all winter long. The slim silicone heating element tucks invisibly inside the housing with zero exterior modifications.',
          productVal: 'LidAid-latausluukunlämmitin (Cupra / SEAT)',
          btnText: 'Select LidAid for Cupra & request quote'
        },
        audi: {
          title: 'Audi Q4 e-tron, Q8 e-tron, e-tron GT & TFSI e Plug-in Hybrids',
          desc: 'Fully compatible with Audi’s motorized and push-latch charge flaps. Prevents servo and actuator overload by keeping ice from jamming the opening mechanism.',
          productVal: 'LidAid-latausluukunlämmitin (Audi)',
          btnText: 'Select LidAid for Audi & request quote'
        },
        bmw: {
          title: 'BMW iX3, i4, iX, i5, i7, iX1 & 330e, 530e, 225xe',
          desc: 'On BMW models, LidAid protects the push-to-open flap latch from freezing solid. The intelligent microcontroller shuts off automatically whenever temperatures climb above +4 °C.',
          productVal: 'LidAid-latausluukunlämmitin (BMW)',
          btnText: 'Select LidAid for BMW & request quote'
        },
        hyundai: {
          title: 'Hyundai Ioniq 5 / 6, Kona Electric & Kia EV6 / EV9, Niro EV',
          desc: 'On Korean 800 V EVs, LidAid connects exclusively to the separate 12 V auxiliary circuit, keeping ultra-fast charging and traction battery warranties 100 % untouched.',
          productVal: 'LidAid-latausluukunlämmitin (Hyundai / Kia)',
          btnText: 'Select LidAid for Hyundai/Kia & request quote'
        },
        other: {
          title: 'All Other Type 2 & CCS Electric Vehicles and Plug-in Hybrids',
          desc: 'LidAid installs universally in virtually any EV or plug-in hybrid with a 12 V auxiliary system.',
          productVal: 'LidAid-latausluukunlämmitin (Muu automalli)',
          btnText: 'Select LidAid for your car & request quote'
        }
      },
      ui: {
        defaultClientType: 'Private Customer',
        defaultProduct: 'General Inquiry',
        subjectPrefix: 'Inquiry Qeino Oy',
        greeting: 'Hello Hannu / Qeino Oy,',
        interestLabel: 'I am interested in the following product / topic',
        clientTypeLabel: 'Customer Type',
        contactInfoHeader: 'My Contact Details:',
        nameLabel: 'Name',
        emailLabel: 'Email',
        phoneLabel: 'Phone',
        companyLabel: 'Company / VAT ID',
        messageHeader: 'Message / Inquiry:',
        regards: 'Best regards,',
        copySubjectLabel: 'Subject',
        copyRecipientLabel: 'Recipient',
        validationToast: 'Please enter at least your name and email address.',
        mailtoToast: 'Your email client is opening with a pre-filled message!',
        copyFailToast: 'Could not copy to clipboard.',
        copyBtnDone: '✓ Message copied to clipboard!',
        copyBtnDefault: 'Copy message to clipboard',
        copySuccessToast: 'Message copied to clipboard! Paste it directly into your email.',
        emailCopiedToast: 'Email address qeino.fi@gmail.com copied!',
        lightboxFallbackAlt: 'Enlarged image',
        lightboxFallbackCaption: 'Product photo'
      }
    }
  };

  // =========================================================================
  // 2. STATIC DOM TRANSLATION MAPS (SV & EN)
  // Each entry: [selector, value] or [selector, index, value]
  // =========================================================================
  const staticTranslations = {
    sv: {
      meta: {
        title: 'Qeino Oy | Smart och hållbar fordonselektronik från Finland',
        description: 'Qeino Oy utvecklar och tillverkar innovativ fordonselektronik för nordiska extremförhållanden. Upptäck LidAid laddluckevärmare och den mönsterskyddade bakljusbrytaren för släpvagnar.'
      },
      text: [
        ['.skip-link', 'Hoppa till huvudinnehåll'],
        ['.top-info-address', 'Pohjanniityntie 15, 04130 Sibbo, Finland'],
        ['.top-phone-num', '+358 44 306 9752'],
        ['.top-info-badge', 'Finsk ingenjörskonst'],
        ['#navLinks li:nth-child(1) a', 'LidAid'],
        ['#navLinks li:nth-child(2) a', 'Bakljusbrytare'],
        ['#navLinks li:nth-child(3) a', 'I media'],
        ['#navLinks li:nth-child(4) a', 'Beställning'],
        ['#navLinks li:nth-child(5) a', 'Vår historia'],
        ['#navLinks li:nth-child(6) a', 'Återförsäljare'],
        ['#navLinks li:nth-child(7) a', 'FAQ'],
        ['#navLinks li:nth-child(8) a', 'Kontakt'],
        ['.header-cta .btn span', 'Kontakta oss'],

        // Hero
        ['.hero-desc', 'Qeino Oy utvecklar och tillverkar finsk elektronik som gör elbilsägandet och släpvagnskörningen bekymmersfri. Inget krångel – bara pålitlig, hållbar ingenjörskonst från Sibbo.'],
        ['.hero-actions .btn-primary span', 'Utforska LidAid'],
        ['.hero-actions .btn-secondary span', 'Släpets bakljusbrytare'],
        ['.hero-location-tag', 'Sibbo, Finland'],
        ['.hero-switch-btn[data-hero-product="lidaid"]', 'LidAid-värmare'],
        ['.hero-switch-btn[data-hero-product="tbs"]', 'Bakljusbrytare TBS'],

        // Trust Ribbon
        ['.trust-ribbon .trust-item:nth-child(1) h3', '2 års fabriksgaranti'],
        ['.trust-ribbon .trust-item:nth-child(1) p', 'Finskt kvalitetsarbete direkt från tillverkaren i Sibbo.'],
        ['.trust-ribbon .trust-item:nth-child(2) h3', '14 dagars nöjdhetsgaranti'],
        ['.trust-ribbon .trust-item:nth-child(2) p', 'Full returrätt enligt konsumentskyddslagen.'],
        ['.trust-ribbon .trust-item:nth-child(3) h3', 'I lager i Sibbo'],
        ['.trust-ribbon .trust-item:nth-child(3) p', 'Skickas inom 1–2 vardagar med spårningskod.'],
        ['.trust-ribbon .trust-item:nth-child(4) h3', 'Säker för 12 V-batteriet'],
        ['.trust-ribbon .trust-item:nth-child(4) p', 'Smart automatisk avstängning över +4 °C skyddar batteriet.'],

        // LidAid Section
        ['#lidaid .section-title', 'LidAid laddluckevärmare'],
        ['#lidaid .section-subtitle', 'Sluta banka på laddluckan eller tina den med varmluftspistol. Den smarta termostatstyrda värmaren ser till att laddluckan och kontakten öppnas mjukt varje vintermorgon.'],
        ['#lidaidHotspots .hotspot-pin:nth-child(1) strong', 'Huvudbrytare (ON / OFF)'],
        ['#lidaidHotspots .hotspot-pin:nth-child(1) em', 'Manuell förbikoppling och strömbrytare'],
        ['#lidaidHotspots .hotspot-pin:nth-child(2) strong', 'LED-indikatorer'],
        ['#lidaidHotspots .hotspot-pin:nth-child(2) em', 'Visar beredskapsläge och aktiv uppvärmning'],
        ['#lidaidHotspots .hotspot-pin:nth-child(3) strong', 'Temperaturreglage'],
        ['#lidaidHotspots .hotspot-pin:nth-child(3) em', 'Steglös justering +45 ... +65 °C'],
        ['#lidaidHotspots .hotspot-pin:nth-child(4) strong', 'Kabelhärva & NTC-givare'],
        ['#lidaidHotspots .hotspot-pin:nth-child(4) em', '12 V styrsignal och exakt temperaturgivare'],
        ['#zoomBadge span', 'Förstora bild'],
        ['#lidaid .media-quote-text', '"Uppfinnaren från Sibbo löste elbilisternas vinterplåga – termostatstyrd värmare håller laddluckan fungerande även i sträng kyla."'],
        ['#lidaid .media-article-link span', 'Läs hela artikeln i Ilta-Sanomat (FI)'],
        ['#lidaid .product-lead-text', 'Ett mikroprocessorstyrt värmesystem utvecklat och fälttestat i Finland för elbilar och laddhybrider.'],
        ['#lidaid .product-desc-body', 'LidAid monteras helt dolt i laddluckans inre struktur. Det tunna, flexibla silikonelementet värmer luckans låsmekanism och tätningar utan några synliga ingrepp i bilens kaross. Enheten övervakar utomhustemperaturen och aktiveras automatiskt först när kylan kommer.'],

        // Compatibility
        ['.compat-header-title span', 'Kompatibilitet med olika bilmärken'],
        ['.compat-badge', 'Passar alla Type 2 / CCS-bilar'],
        ['.compat-chip[data-brand="other"]', 'Alla andra märken'],
        ['.compat-result-footer .compat-tag:nth-child(1) span', '12 V styrsignal'],
        ['.compat-result-footer .compat-tag:nth-child(2) span', 'Montering ca 30–45 min'],

        // Winter Sim
        ['.sim-header-title span', 'Vinterväder- & termostatsimulator'],
        ['.sim-badge', 'Interaktivt test'],
        ['.sim-desc', 'Testa med reglaget eller snabbvalen hur mikroprocessorn styr värmeeffekten och skyddar laddluckan:'],
        ['.sim-preset-btn[data-temp="-25"]', '−25 °C Lappland'],
        ['.sim-preset-btn[data-temp="-15"]', '−15 °C Köldknäpp'],
        ['.sim-preset-btn[data-temp="-2"]', '−2 °C Blötsnö'],
        ['.sim-preset-btn[data-temp="10"]', '+10 °C Vår'],
        ['.sim-temp-meta', 'Simulerad utomhustemperatur'],
        ['.sim-gauge-head > span:first-child', 'Värmeelementets effekt'],
        ['.sim-feedback-item:nth-child(1) .sim-kpi-label', 'Värmeelement'],
        ['.sim-feedback-item:nth-child(2) .sim-kpi-label', 'Batteriskydd & effekt'],

        // LidAid Video
        ['#lidaid .video-title', 'Testvideo: Luckan vattenbegjuten över natten vid −15 °C'],
        ['#lidaid .video-badge', 'Äkta fälttest'],
        ['#lidaid .video-yt-link span', 'Se på YouTube ↗'],
        ['#lidaid .video-play-label', 'Spela vintertest (0:42)'],

        // LidAid Specs & Package & Pricing
        ['#lidaid .specs-title span', 'Tekniska data (LidAid)'],
        ['#lidaid .specs-list li:nth-child(1) .spec-name', 'Driftspänning'],
        ['#lidaid .specs-list li:nth-child(2) .spec-name', 'Viloström'],
        ['#lidaid .specs-list li:nth-child(3) .spec-name', 'Värmeeffekt'],
        ['#lidaid .specs-list li:nth-child(3) .spec-val', 'I snitt ~20 W (element 50 W)'],
        ['#lidaid .specs-list li:nth-child(4) .spec-name', 'Temperaturområde'],
        ['#lidaid .specs-list li:nth-child(5) .spec-name', 'Drifttemperatur'],
        ['#lidaid .specs-list li:nth-child(6) .spec-name', 'Kapslingens mått'],
        ['#lidaid .package-header h3', 'Förpackningens innehåll (Plug-and-play)'],
        ['#lidaid .price-label', 'Pris & Beställning'],
        ['#lidaid .price-amount', 'Begär offert'],
        ['#lidaid .price-subtext', 'För privatkunder & återförsäljare direkt från tillverkaren'],
        ['#lidaid .pricing-action-box .btn-primary span', 'Beställ / Begär offert'],
        ['#lidaidManualBtn span', 'Ladda ner manual (PDF)'],
        ['#lidaid .manual-group-label', 'Officiella installations- och bruksanvisningar:'],

        // TBS Section
        ['#takavalokytkin .section-title', 'Släpvagnens bakljusbrytare (TBS)'],
        ['#takavalokytkin .section-subtitle', 'Mönsterskyddad finsk brytarenhet som låter dig tända släpvagnens bakljus som praktiskt backljus utan att dragbilens bakre dimljus tänds och bländar.'],
        ['.model-selector-label', 'Välj släpvagnens ljustyp:'],
        ['.tbs-model-tab[data-model="TBS-231-L"] .tbs-tab-sub', 'För LED-bakljus • Max 5 A'],
        ['.tbs-model-tab[data-model="TBS-221"] .tbs-tab-sub', 'För glödlampor • Max 5 A'],
        ['#tbsHotspots .hotspot-pin:nth-child(1) strong', 'Huvudbrytare (ON / OFF)'],
        ['#tbsHotspots .hotspot-pin:nth-child(1) em', 'Trafiksäkrad manöverbrytare'],
        ['#tbsHotspots .hotspot-pin:nth-child(2) strong', 'Kopplingsschema på locket'],
        ['#tbsHotspots .hotspot-pin:nth-child(2) em', 'Färgkodade anslutningar direkt på höljet'],
        ['#tbsHotspots .hotspot-pin:nth-child(3) strong', 'QC PASSED-sigill'],
        ['#tbsHotspots .hotspot-pin:nth-child(3) em', '100 % eltestad enhet från fabriken'],
        ['#tbsHotspots .hotspot-pin:nth-child(4) strong', 'Anslutningskablage'],
        ['#tbsHotspots .hotspot-pin:nth-child(4) em', '12 V inkoppling utan 13-polig kontakt'],
        ['#takavalokytkin .zoom-hint span', 'Förstora bild'],
        ['#takavalokytkin .product-lead-text', 'Trygg och enkel backning på mörka gårdar, stugvägar och arbetsplatser.'],
        ['#takavalokytkin .product-desc-body', 'TBS bakljusbrytare löser det klassiska problemet: när du backar med släpvagn i mörker ser du ingenting bakåt. Med brytaren kan du använda släpets egna bakljus som arbets- och backbelysning utan att bilens eget bländande dimbakljus tänds.'],
        ['#takavalokytkin .video-title', 'Demovideo: Bakljusen tänds med varningsblinkers i mörker'],
        ['#takavalokytkin .video-badge', 'Äkta fälttest'],
        ['#takavalokytkin .video-play-label', 'Spela demonstration (0:17)'],
        ['.patent-tag', 'PRH • FINSK UPPFINNING'],
        ['.patent-seal-content h3', 'Mönsterskyddad brytarteknologi'],
        ['.patent-seal-content p', 'Skyddad finsk uppfinning: Styr backljuset via blinkerssignaler utan mjukvaruändringar i bilen eller dyr dragning av 13-polig kabelsats.'],
        ['#takavalokytkin .specs-heading', 'Tekniska data'],
        ['#takavalokytkin .specs-list li:nth-child(1) .spec-name', 'Driftspänning'],
        ['#takavalokytkin .specs-list li:nth-child(1) .spec-val', '12 VDC (24 V med förkopplingsmotstånd)'],
        ['#takavalokytkin .specs-list li:nth-child(2) .spec-name', 'Belastningskapacitet'],
        ['#takavalokytkin .specs-list li:nth-child(3) .spec-name', 'Rekommenderad för'],
        ['#takavalokytkin .specs-list li:nth-child(4) .spec-name', 'Manöverbrytare'],
        ['#takavalokytkin .specs-list li:nth-child(4) .spec-val', 'Tvåläges vippbrytare (ON / OFF)'],
        ['#takavalokytkin .specs-list li:nth-child(5) .spec-name', 'Tillverkningsland'],
        ['#takavalokytkin .specs-list li:nth-child(5) .spec-val', 'Finland (Sibbo)'],
        ['#takavalokytkin .package-header h3', 'Förpackningens innehåll (Plug-and-play)'],
        ['#takavalokytkin .price-label', 'Pris & Beställning'],
        ['#takavalokytkin .price-amount', 'Begär offert'],
        ['#takavalokytkin .price-subtext', 'Finns direkt från uppfinnaren och hos auktoriserade återförsäljare'],
        ['#takavalokytkin .pricing-action-box .btn-primary span', 'Beställ / Begär offert'],
        ['#tbsManualBtnText', 'Ladda ner manual (PDF)'],
        ['#takavalokytkin .manual-group-label', 'Officiella installations- och bruksanvisningar:'],

        // Media & Field Testing
        ['#kokemuksia .section-title', 'Testad i nordiska vinterförhållanden'],
        ['#kokemuksia .section-subtitle', 'Testad i nordiska förhållanden. Läs artikeln i Ilta-Sanomat (länk nedan).'],
        ['.press-sub-badge', 'Motorredaktionen'],
        ['.press-quote', '”Uppfinnaren från Sibbo löste elbilisternas vinterplåga – den termostatstyrda värmaren håller laddluckan fungerande även i smällkall kyla.”'],
        ['.press-author', 'Journalist Tommi Lempinen, Ilta-Sanomat'],
        ['.press-link span', 'Läs hela artikeln på IS.fi (FI)'],

        // Order Process
        ['#tilausohje .section-title', 'Hur går beställningen till?'],
        ['#tilausohje .section-subtitle', 'Inga krångliga konton eller webbshoppar. Du får personlig service och snabb leverans direkt från tillverkaren i Finland.'],
        ['.process-step-card:nth-child(1) h3', '1. Välj produkt & kontakta oss'],
        ['.process-step-card:nth-child(2) h3', '2. Bekräftelse & tydlig faktura'],
        ['.process-step-card:nth-child(2) p', 'Vi bekräftar beställningen via e-post. För privatkunder säker banköverföring eller MobilePay, för företag officiell e-faktura (14 dagar netto).'],
        ['.process-step-card:nth-child(3) h3', '3. Snabb leverans från Sibbo'],
        ['.process-step-card:nth-child(3) p', 'Paketet skickas inom 1–2 vardagar med spårningskod. Kompletta monteringstillbehör och tydliga instruktioner ingår.'],

        // Founder Story
        ['#tarina .section-title', 'Berättelsen bakom Qeino'],
        ['.csw-badge', 'Finns även'],
        ['.csw-content strong', 'Fjärrstyrning för Webasto & Eberspächer (CSW-1):'],
        ['.csw-content span', 'Styr bilens bränslevärmare direkt med bilens egen originalnyckel utan dyra tilläggsdosor. Tillverkad och testad i Sibbo.'],
        ['.story-quote-card blockquote', '"Jag tröttnade på att banka med knytnäven och tina laddluckan med varmluftspistol kalla vintermorgnar. Jag visste att det måste gå att lösa smart, pålitligt och utan att äventyra bilens garanti."'],

        // B2B
        ['#jalleenmyyjat .section-title', 'Vi samarbetar även med bilhandlare och verkstäder'],
        ['#jalleenmyyjat .section-subtitle', 'Qeinos produkter har väckt stort intresse i fordonsbranschen. Vi erbjuder återförsäljare och verkstäder konkurrenskraftiga grossistpriser och direkt teknisk support.'],
        ['.b2b-card:nth-child(1) .b2b-partner-tag', 'Verkstäder & Installatörer'],
        ['.b2b-card:nth-child(1) h3', 'Bilverkstäder & Monteringsfirmor'],
        ['.b2b-card:nth-child(1) p', 'Erbjud elbilsägare en lösning som verkligen fungerar. En snabb 30–45 minuters installation ger bra merförsäljning och nöjda kunder.'],
        ['.b2b-card:nth-child(1) .b2b-perks-list li:nth-child(1) span', 'God återförsäljarmarginal och mängdrabatter'],
        ['.b2b-card:nth-child(1) .b2b-perks-list li:nth-child(2) span', 'Färdiga kabelsatser och modellspecifika guider'],
        ['.b2b-card:nth-child(1) .b2b-perks-list li:nth-child(3) span', 'Direkt telefonsupport från uppfinnaren vid frågor'],
        ['.b2b-card:nth-child(1) .btn span', 'Begär grossistprislista'],
        ['.b2b-card:nth-child(2) .b2b-partner-tag', 'Släpvagnar & Återförsäljare'],
        ['.b2b-card:nth-child(2) h3', 'Släpvagnshandlare & Tillverkare'],
        ['.b2b-card:nth-child(2) p', 'Utrusta nya och begagnade släpvagnar med den mönsterskyddade bakljusbrytaren. Ett starkt säljargument för kunder som värdesätter säkerhet vid backning i mörker.'],
        ['.b2b-card:nth-child(2) .b2b-perks-list li:nth-child(1) span', 'Mönsterskyddad finsk uppfinning — inga billiga kopior'],
        ['.b2b-card:nth-child(2) .b2b-perks-list li:nth-child(2) span', 'Snabb leverans direkt från lagret i Sibbo'],
        ['.b2b-card:nth-child(2) .b2b-perks-list li:nth-child(3) span', 'Färdigt marknadsmaterial och broschyrer till butiken'],
        ['.b2b-card:nth-child(2) .btn span', 'Bli återförsäljare'],

        // FAQ
        ['#ukk .section-title', 'Frågor och svar'],
        ['#ukk .section-subtitle', 'Här hittar du svar på de vanligaste frågorna om installation, funktion och garantier.'],
        ['.faq-item:nth-child(1) .faq-question > span:first-child', 'Laddar LidAid ur bilens batteri om bilen står länge i kylan?'],
        ['.faq-item:nth-child(1) .faq-answer p', 'Nej. LidAid kopplas till bilens 12 V-styrsignal och fungerar därför endast när bilen är "vaken" eller laddas. Dessutom stänger mikroprocessorn automatiskt av uppvärmningen när utomhustemperaturen överstiger +4 °C. Om bilen står parkerad längre än två dygn rekommenderar vi att använda en 12 V batteriladdare.'],
        ['.faq-item:nth-child(2) .faq-question > span:first-child', 'Hur väljer jag rätt modell av bakljusbrytaren (TBS-231-L eller TBS-221)?'],
        ['.faq-item:nth-child(3) .faq-question > span:first-child', 'Får bakljusbrytaren användas i vanlig vägtrafik?'],
        ['.faq-item:nth-child(3) .faq-answer p', 'Bakljusbrytaren är inte godkänd för allmän vägtrafik. Enheten får endast slås på utanför allmän väg, till exempel på stugväg, byggarbetsplats, gårdsplan eller parkområde. Vid körning på landsväg ska enheten vara avstängd.'],
        ['.faq-item:nth-child(4) .faq-question > span:first-child', 'Fungerar bakljusbrytaren i ett 24-voltssystem?'],
        ['.faq-item:nth-child(4) .faq-answer p', 'Enheten är konstruerad för personbilars 12-voltssystem. Den kan dock installeras i ett 24-voltssystem genom att lägga till ett 1 W förkopplingsmotstånd på 300 ohm i plusledningen.'],

        // Contact
        ['#yhteystiedot .section-title', 'Kontakt och beställningsförfrågningar'],
        ['#yhteystiedot .section-subtitle', 'Vi svarar gärna på frågor om produkter, priser, installation och återförsäljning. Ring uppfinnaren direkt eller skicka ett meddelande.'],
        ['.contact-brand-pill > span:last-child', 'Direktkontakt med uppfinnaren • Sibbo'],
        ['.company-desc-text', 'Ett finskt innovationsföretag specialiserat på fordonselektronik. Alla enheter utvecklas, monteras och testas i Sibbo, Finland.'],
        ['.contact-list .contact-item:nth-child(1) .title', 'Telefon & WhatsApp'],
        ['.contact-list .contact-item:nth-child(1) .val', '+358 44 306 9752'],
        ['.contact-list .contact-item:nth-child(1) .subtext', 'Hannu Alhovuori (Grundare & Uppfinnare)'],
        ['.contact-list .contact-item:nth-child(2) .title', 'E-post'],
        ['.contact-list .contact-item:nth-child(3) .title', 'Besöks- och postadress'],
        ['.contact-list .contact-item:nth-child(3) .val', 'Pohjanniityntie 15, 04130 Sibbo, Finland'],
        ['.contact-list .contact-item:nth-child(4) .title', 'Öppettider'],
        ['.contact-list .contact-item:nth-child(4) .val', 'Vardagar 16:00 – 18:00 (EET)'],

        ['.form-title', 'Skicka förfrågan eller beställning'],
        ['.form-subtitle', 'Välj produkt nedan och fyll i dina uppgifter — vi svarar personligen under samma vardag.'],
        ['.type-btn[data-type="consumer"] span', 'Privatkund'],
        ['.type-btn[data-type="b2b"] span', 'Företag / Återförsäljare'],
        ['label[for="inquiryCompany"]', 'Företagsnamn och FO-/org.nummer'],
        ['.product-chip[data-value="LidAid-latausluukunlämmitin"]', 'LidAid-värmare'],
        ['.product-chip[data-value="TBS-231-L (LED-malli)"]', 'TBS-231-L (LED)'],
        ['.product-chip[data-value="TBS-221 (Hehkulamppumalli)"]', 'TBS-221 (Glödlampa)'],
        ['.product-chip[data-value="Webaston kauko-ohjain CSW-1"]', 'CSW-1 Webasto'],
        ['.product-chip[data-value="Jälleenmyynti & tukkuhinnasto"]', 'Återförsäljning'],
        ['.product-chip[data-value="Yleinen tiedustelu"]', 'Annat ärende'],
        ['#inquiryProduct option[value="LidAid-latausluukunlämmitin"]', 'LidAid laddluckevärmare (För elbilar)'],
        ['#inquiryProduct option[value="TBS-231-L (LED-malli)"]', 'Bakljusbrytare TBS-231-L (För LED-bakljus)'],
        ['#inquiryProduct option[value="TBS-221 (Hehkulamppumalli)"]', 'Bakljusbrytare TBS-221 (För glödlampor)'],
        ['#inquiryProduct option[value="Webaston kauko-ohjain CSW-1"]', 'Webasto fjärrstyrning CSW-1 (Webasto / Eber)'],
        ['#inquiryProduct option[value="Jälleenmyynti & tukkuhinnasto"]', 'Återförsäljning & grossistprislista (B2B)'],
        ['#inquiryProduct option[value="Yleinen tiedustelu"]', 'Annan fråga eller monteringsstöd'],
        ['label[for="inquiryPhone"]', 'Telefonnummer'],
        ['.form-row .label-hint', 'valfritt'],
        ['label[for="inquiryMessage"]', 'Meddelande eller fråga'],
        ['.form-group:has(#inquiryMessage) .label-hint', 'Bilmodell, antal m.m.'],
        ['#inquirySubmitBtn span', 'Öppna i e-post & skicka'],
        ['#copyBtnText', 'Kopiera meddelande till urklipp'],
        ['.form-trust-row .trust-badge-item:nth-child(1) span', 'Konfidentiell hantering'],
        ['.form-trust-row .trust-badge-item:nth-child(2) span', 'Svar normalt samma dag'],
        ['#inquirySuccess strong', 'Ditt e-postprogram öppnas med ett färdigt utkast!'],

        // Footer & Mobile Bar
        ['.footer-brand p', 'Finsk fordonselektronik och ingenjörskonst. Innovativa lösningar för elbilar, nordisk vinter och släpvagnar.'],
        ['.footer-is-link span', 'Läs artikeln om LidAid i Ilta-Sanomat (FI)'],
        ['.footer-col:nth-child(2) h2', 'Snabblänkar'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(1) a', 'LidAid laddluckevärmare'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(2) a', 'Bakljusbrytare TBS'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(3) a', 'I media & tester'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(4) a', 'Så här beställer du'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(5) a', 'Berättelsen om Qeino'],
        ['#footerLidAidManual', 'LidAid bruksanvisning (PDF)'],
        ['.footer-col:nth-child(3) h2', 'Kontaktuppgifter'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(2)', 'Pohjanniityntie 15, 04130 Sibbo, Finland'],
        ['.footer-copy-email-btn span', 'Kopiera e-postadress'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(6) a', 'Återförsäljarsamarbete'],
        ['.footer-bottom > div:first-child', '© 2026 Qeino Oy. Alla rättigheter förbehållna.'],
        ['.made-in-finland span', '🇫🇮 Finsk kvalitet och design'],
        ['.mobile-bar-btn.call-btn span', 'Ring uppfinnaren'],
        ['.mobile-bar-btn.quote-btn span', 'Begär offert']
      ],
      html: [
        ['.hero-title', 'Smarta lösningar för bilkörning <span class="highlight">i kyla och mörker</span>'],
        ['.hero-badges .hero-badge-item:nth-child(1) .hero-badge-text', '100 % designad &amp;<br>testad i Finland'],
        ['.hero-badges .hero-badge-item:nth-child(2) .hero-badge-text', 'Tål sträng nordisk<br>kyla (−40 °C)'],
        ['.hero-badges .hero-badge-item:nth-child(3) .hero-badge-text', 'Säker &amp; enkel för<br>12 V-system'],
        ['#lidaid .benefit-item:nth-child(1) span', '<strong>Helt automatisk:</strong> Stängs av automatiskt när temperaturen överstiger +4 °C.'],
        ['#lidaid .benefit-item:nth-child(2) span', '<strong>Säkert 12 V-system:</strong> Påverkar varken högvoltsbatteriet eller bilens fabriksgaranti.'],
        ['#lidaid .benefit-item:nth-child(3) span', '<strong>Justerbar temperatur:</strong> Steglös inställning +45 °C ... +65 °C efter behov.'],
        ['#lidaid .package-item:nth-child(1) > div', '<strong>LidAid styrenhet</strong> i aluminiumkapsling med steglös reglering'],
        ['#lidaid .package-item:nth-child(2) > div', '<strong>Flexibelt silikonelement</strong> med fästtejp och givaryta'],
        ['#lidaid .package-item:nth-child(3) > div', '<strong>Komplett kabelsats</strong>, anslutningsdon och säkringshållare'],
        ['#lidaid .package-item:nth-child(4) > div', '<strong>Tydlig monteringsanvisning</strong> (FI / EN) med kopplingsschema'],
        ['#lidaid .package-item:nth-child(5) > div', '<strong>2 års fabriksgaranti</strong> och direkt telefonsupport från uppfinnaren'],
        ['#takavalokytkin .benefit-item:nth-child(1) span', '<strong>Mönsterskyddad teknik:</strong> Förhindrar att bilens bakre dimljus tänds och bländar i speglarna.'],
        ['#takavalokytkin .benefit-item:nth-child(2) span', '<strong>Två modellval:</strong> Optimerad separat för LED-ljus (TBS-231-L) och traditionella glödlampor (TBS-221).'],
        ['#takavalokytkin .benefit-item:nth-child(3) span', '<strong>Enkel montering:</strong> Installeras dolt bakom bagageutrymmets klädsel direkt vid bakljuskontakterna med medföljande tillbehör.'],
        ['#takavalokytkin .package-item:nth-child(1) > div', '<strong>TBS-brytarenhet</strong> i vald LED- eller glödlampsmodell'],
        ['#takavalokytkin .package-item:nth-child(2) > div', '<strong>Färdig fordonskabelsats</strong> med skyddshölje och märkta ledare'],
        ['#takavalokytkin .package-item:nth-child(3) > div', '<strong>Strömtjuvar</strong> och ringkabelsko för jordning'],
        ['#takavalokytkin .package-item:nth-child(4) > div', '<strong>Detaljerad svensk installations- och kopplingsanvisning</strong>'],
        ['#takavalokytkin .package-item:nth-child(5) > div', '<strong>2 års tillverkargaranti</strong> och direkt teknisk monteringssupport'],
        ['.process-step-card:nth-child(1) p', 'Fyll i kontaktformuläret nedan eller ring uppfinnaren direkt (<a href="tel:+358443069752">+358 44 306 9752</a>). Ange produkt samt din bil- eller släpvagnsmodell.'],
        ['.process-guarantee-bar .guarantee-pill:nth-child(1) span', '<strong>2 års tillverkargaranti</strong> på alla produkter'],
        ['.process-guarantee-bar .guarantee-pill:nth-child(2) span', '<strong>14 dagars nöjdhetsgaranti</strong> och full returrätt'],
        ['.process-guarantee-bar .guarantee-pill:nth-child(3) span', '<strong>Direkt support från uppfinnaren:</strong> <a href="tel:+358443069752">+358 44 306 9752</a>'],
        ['#tarina .story-text > p:nth-of-type(1)', 'Qeino Oy föddes ur ett verkligt behov och en finsk ingenjörsanda som aldrig nöjer sig med halvdana lösningar. När köld, blötsnö och underkylt regn gjorde morgonladdningen av elbilen till en kamp inleddes produktutvecklingen.'],
        ['#tarina .story-text > p:nth-of-type(2)', 'Företagets grundare <strong>Hannu Alhovuori</strong> har över 40 års erfarenhet av elektronik, fordonselektronik och industriell konstruktion. Varje enhet från Qeino konstrueras, monteras och testas noggrant i Sibbo för att tåla tuffa nordiska förhållanden.'],
        ['#tarina .story-text > p:nth-of-type(3)', 'Vi tillverkar ingen slit-och-släng-massproduktion – våra enheter är reparerbara, hållbara och genomtänkta elinnovationer.'],
        ['.story-author-tag', '<strong>Hannu Alhovuori</strong> — Grundare &amp; Elingenjör, Qeino Oy'],
        ['.faq-item:nth-child(2) .faq-answer p', 'Valet beror på släpvagnens bakljus: Om släpet har moderna <strong>LED-bakljus</strong> väljer du <strong>TBS-231-L</strong>. Om släpet har traditionella <strong>glödlampor</strong> väljer du <strong>TBS-221</strong>.'],
        ['.contact-obsidian-footer .obsidian-perk:nth-child(1) span', '<strong>2 års fabriksgaranti</strong> &amp; 14 dagars returrätt'],
        ['.contact-obsidian-footer .obsidian-perk:nth-child(2) span', '<strong>Leverans inom 1–2 vardagar</strong> med spårningskod'],
        ['.contact-obsidian-footer .obsidian-perk:nth-child(3) span', '<strong>Inga mellanhänder</strong> — direkt support av elingenjören'],
        ['label[for="inquiryProduct"]', 'Välj produkt eller ärende <span class="required-star">*</span>'],
        ['label[for="inquiryName"]', 'Namn <span class="required-star">*</span>'],
        ['label[for="inquiryEmail"]', 'E-postadress <span class="required-star">*</span>'],
        ['#inquirySuccess p', 'Mottagare: <strong>qeino.fi@gmail.com</strong>. Om du använder webbmejl (t.ex. Gmail), klicka på "Kopiera meddelande till urklipp" ovan och klistra in direkt.'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(3)', 'Tel: <a href="tel:+358443069752">+358 44 306 9752</a>'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(4)', 'E-post: <a href="mailto:qeino.fi@gmail.com">qeino.fi@gmail.com</a>']
      ],
      tailText: [
        // Elements containing an icon/dot child + trailing text node
        ['.hero-section .teaser', '01 / Finsk fordonselektronik'],
        ['.status-pill', 'I produktion & i lager'],
        ['#lidaid .teaser', '02 / Vinterlösning för elbilar'],
        ['#takavalokytkin .teaser', '03 / Mönsterskyddad fordonselektronik'],
        ['#kokemuksia .teaser', '04 / I media & tester'],
        ['#tilausohje .teaser', '05 / Smidig leverans'],
        ['#tarina .teaser', '06 / Finsk uppfinningsrikedom'],
        ['#jalleenmyyjat .teaser', '07 / B2B & Återförsäljning'],
        ['#ukk .teaser', '08 / Vanliga frågor'],
        ['#yhteystiedot .teaser', '09 / Kontakta oss']
      ],
      attrs: [
        ['.logo-link', 'aria-label', 'Qeino Oy Startsida'],
        ['header nav', 'aria-label', 'Huvudmeny'],
        ['#mobileMenuBtn', 'aria-label', 'Öppna meny'],
        ['.hero-product-switch', 'aria-label', 'Förhandsgranska huvudprodukter'],
        ['.trust-ribbon', 'aria-label', 'Garantier och leveranslöften'],
        ['#lidaidMainImg', 'alt', 'LidAid laddluckevärmare styrenhet'],
        ['#lidaidHotspots', 'aria-label', 'Produktens tekniska komponenter'],
        ['#lidaidHotspots .hotspot-pin:nth-child(1)', 'aria-label', 'Komponent: Huvudbrytare'],
        ['#lidaidHotspots .hotspot-pin:nth-child(2)', 'aria-label', 'Komponent: LED-indikatorer'],
        ['#lidaidHotspots .hotspot-pin:nth-child(3)', 'aria-label', 'Komponent: Temperaturreglage'],
        ['#lidaidHotspots .hotspot-pin:nth-child(4)', 'aria-label', 'Komponent: Kabelhärva och NTC-givare'],
        ['#zoomBadge', 'aria-label', 'Förstora LidAid produktbild'],
        ['#lidaidGallery .thumb-btn:nth-child(1)', 'aria-label', 'LidAid styrenhet'],
        ['#lidaidGallery .thumb-btn:nth-child(1) img', 'alt', 'LidAid styrenhet'],
        ['#lidaidGallery .thumb-btn:nth-child(2)', 'data-full', 'assets/img/lidaid-kaavio-sv.webp?v=4'],
        ['#lidaidGallery .thumb-btn:nth-child(2)', 'aria-label', 'LidAid kopplingsschema'],
        ['#lidaidGallery .thumb-btn:nth-child(2) img', 'src', 'assets/img/lidaid-kaavio-sv.webp?v=4'],
        ['#lidaidGallery .thumb-btn:nth-child(2) img', 'alt', 'LidAid kopplingsschema'],
        ['#lidaidGallery .thumb-btn:nth-child(3)', 'aria-label', 'LidAid monteringstillbehör'],
        ['#lidaidGallery .thumb-btn:nth-child(3) img', 'alt', 'LidAid monteringstillbehör'],
        ['#evSearchInput', 'placeholder', 'Sök din bilmodell (t.ex. Enyaq, ID.4, Born, Ioniq 5...)'],
        ['#evSearchInput', 'aria-label', 'Sök din bilmodell'],
        ['#compatChips', 'aria-label', 'Välj bilmärke'],
        ['.sim-presets', 'aria-label', 'Snabbval för väderförhållanden'],
        ['#tempSlider', 'aria-label', 'Justera simulatorns utomhustemperatur'],
        ['#lidaid .video-yt-link', 'title', 'Öppna officiell testvideo på YouTube'],
        ['#lidaid video', 'aria-label', 'Fälttestvideo för LidAid laddluckevärmare vid −15 °C'],
        ['#lidaid .video-play-overlay', 'aria-label', 'Spela LidAid vintertestvideo'],
        ['#lidaidManualBtn', 'href', 'assets/docs/LidAid_manual_en.pdf'],
        ['#footerLidAidManual', 'href', 'assets/docs/LidAid_manual_en.pdf'],
        ['.model-selector', 'aria-label', 'Välj modell av bakljusbrytare'],
        ['#tbsHotspots', 'aria-label', 'Bakljusbrytarens komponenter'],
        ['#tbsHotspots .hotspot-pin:nth-child(1)', 'aria-label', 'Komponent: ON / OFF-brytare'],
        ['#tbsHotspots .hotspot-pin:nth-child(2)', 'aria-label', 'Komponent: Kopplingsschema på locket'],
        ['#tbsHotspots .hotspot-pin:nth-child(3)', 'aria-label', 'Komponent: QC PASSED-sigill'],
        ['#tbsHotspots .hotspot-pin:nth-child(4)', 'aria-label', 'Komponent: Anslutningskablage'],
        ['#takavalokytkin .zoom-hint', 'aria-label', 'Förstora TBS bakljusbrytares produktbild'],
        ['#tbsGallery .thumb-btn:nth-child(1)', 'aria-label', 'Bakljusbrytare enhet'],
        ['#tbsGallery .thumb-btn:nth-child(1) img', 'alt', 'Bakljusbrytare enhet'],
        ['#tbsGallery .thumb-btn:nth-child(2)', 'aria-label', 'Bakljusbrytare kretskort'],
        ['#tbsGallery .thumb-btn:nth-child(2) img', 'alt', 'Bakljusbrytare kretskort'],
        ['#tbsGallery .thumb-btn:nth-child(3)', 'data-full', 'assets/img/tbs-kytkenta-sv.webp?v=4'],
        ['#tbsGallery .thumb-btn:nth-child(3)', 'aria-label', 'Bakljusbrytare kopplingsschema'],
        ['#tbsGallery .thumb-btn:nth-child(3) img', 'src', 'assets/img/tbs-kytkenta-sv.webp?v=4'],
        ['#tbsGallery .thumb-btn:nth-child(3) img', 'alt', 'Bakljusbrytare kopplingsschema'],
        ['#takavalokytkin video', 'aria-label', 'Demovideo för släpvagnens bakljusbrytare i mörker'],
        ['#takavalokytkin .video-play-overlay', 'aria-label', 'Spela demovideo för bakljusbrytaren'],
        ['.press-link', 'aria-label', 'Läs hela artikeln i Ilta-Sanomat'],
        ['.customer-type-toggle', 'aria-label', 'Kundtyp'],
        ['#inquiryCompany', 'placeholder', 'T.ex. Bilservice AB, 556123-4567'],
        ['#productQuickChips', 'aria-label', 'Snabbval för produkt'],
        ['#inquiryName', 'placeholder', 'Förnamn Efternamn'],
        ['#inquiryPhone', 'placeholder', '+46 70 123 45 67'],
        ['#inquiryEmail', 'placeholder', 'namn@foretag.se'],
        ['#inquiryMessage', 'placeholder', 'Ange din bil- eller släpvagnsmodell, önskat antal eller din fråga...'],
        ['#mobileStickyBar', 'aria-label', 'Snabbkontakt'],
        ['.mobile-bar-btn.call-btn', 'aria-label', 'Ring uppfinnaren +358 44 306 9752'],
        ['.mobile-bar-btn.quote-btn', 'aria-label', 'Gå till kontaktformuläret'],
        ['#backToTopBtn', 'aria-label', 'Tillbaka till toppen'],
        ['#lightboxModal', 'aria-label', 'Bildförstoring'],
        ['#lightboxClose', 'aria-label', 'Stäng förstoring'],
        ['#lightboxPrev', 'aria-label', 'Föregående bild'],
        ['#lightboxNext', 'aria-label', 'Nästa bild'],
        ['#lightboxImg', 'alt', 'Förstorad produktbild']
      ]
    },

    en: {
      meta: {
        title: 'Qeino Oy | Smart & Durable Automotive Electronics from Finland',
        description: 'Qeino Oy designs and manufactures innovative automotive electronics built for extreme Nordic conditions. Discover the LidAid EV charge port heater and design-protected trailer taillight switch.'
      },
      text: [
        ['.skip-link', 'Skip to main content'],
        ['.top-info-address', 'Pohjanniityntie 15, 04130 Sipoo, Finland'],
        ['.top-phone-num', '+358 44 306 9752'],
        ['.top-info-badge', 'Finnish Engineering'],
        ['#navLinks li:nth-child(1) a', 'LidAid'],
        ['#navLinks li:nth-child(2) a', 'Taillight Switch'],
        ['#navLinks li:nth-child(3) a', 'Media'],
        ['#navLinks li:nth-child(4) a', 'How to Order'],
        ['#navLinks li:nth-child(5) a', 'Our Story'],
        ['#navLinks li:nth-child(6) a', 'Resellers'],
        ['#navLinks li:nth-child(7) a', 'FAQ'],
        ['#navLinks li:nth-child(8) a', 'Contact'],
        ['.header-cta .btn span', 'Contact Us'],

        // Hero
        ['.hero-desc', 'Qeino Oy designs and builds Finnish automotive electronics that make winter EV charging and dark-night trailer reversing effortless. Zero gimmicks — just reliable, repairable engineering from Sipoo, Finland.'],
        ['.hero-actions .btn-primary span', 'Explore LidAid'],
        ['.hero-actions .btn-secondary span', 'Trailer Taillight Switch'],
        ['.hero-location-tag', 'Sipoo, Finland'],
        ['.hero-switch-btn[data-hero-product="lidaid"]', 'LidAid Heater'],
        ['.hero-switch-btn[data-hero-product="tbs"]', 'TBS Taillight Switch'],

        // Trust Ribbon
        ['.trust-ribbon .trust-item:nth-child(1) h3', '2-Year Factory Warranty'],
        ['.trust-ribbon .trust-item:nth-child(1) p', 'Finnish build quality direct from the manufacturer in Sipoo.'],
        ['.trust-ribbon .trust-item:nth-child(2) h3', '14-Day Return Guarantee'],
        ['.trust-ribbon .trust-item:nth-child(2) p', 'Full consumer-protection right of return.'],
        ['.trust-ribbon .trust-item:nth-child(3) h3', 'In Stock in Finland'],
        ['.trust-ribbon .trust-item:nth-child(3) p', 'Dispatched in 1–2 business days with parcel tracking.'],
        ['.trust-ribbon .trust-item:nth-child(4) h3', '12 V Battery Safe'],
        ['.trust-ribbon .trust-item:nth-child(4) p', 'Smart automatic shut-off above +4 °C protects your battery.'],

        // LidAid Section
        ['#lidaid .section-title', 'LidAid Charge Port Heater'],
        ['#lidaid .section-subtitle', 'Stop pounding frozen charging flaps or thawing them with a heat gun. Our smart thermostat-controlled heater guarantees your charge door and plug open smoothly every winter morning.'],
        ['#lidaidHotspots .hotspot-pin:nth-child(1) strong', 'Main Switch (ON / OFF)'],
        ['#lidaidHotspots .hotspot-pin:nth-child(1) em', 'Manual override and power disconnect'],
        ['#lidaidHotspots .hotspot-pin:nth-child(2) strong', 'Status LEDs'],
        ['#lidaidHotspots .hotspot-pin:nth-child(2) em', 'Indicates standby and active heating'],
        ['#lidaidHotspots .hotspot-pin:nth-child(3) strong', 'Temperature Dial'],
        ['#lidaidHotspots .hotspot-pin:nth-child(3) em', 'Stepless control +45 ... +65 °C'],
        ['#lidaidHotspots .hotspot-pin:nth-child(4) strong', 'Harness & NTC Sensor'],
        ['#lidaidHotspots .hotspot-pin:nth-child(4) em', '12 V wake-up wire & precision thermal sensor'],
        ['#zoomBadge span', 'Enlarge photo'],
        ['#lidaid .media-quote-text', '"An inventor from Sipoo solved the winter nightmare of EV drivers — a thermostat-controlled heater keeps the charge flap working even in biting sub-zero cold."'],
        ['#lidaid .media-article-link span', 'Read full article in Ilta-Sanomat (FI)'],
        ['#lidaid .product-lead-text', 'A Finnish-engineered, field-proven microprocessor heating system for electric vehicles and plug-in hybrids.'],
        ['#lidaid .product-desc-body', 'LidAid installs discreetly inside the charge flap cavity. Its ultra-thin, flexible silicone heating element warms the latch mechanism and weather seals with zero visible modifications to the bodywork. The controller monitors ambient temperature and activates automatically only in freezing weather.'],

        // Compatibility
        ['.compat-header-title span', 'Vehicle Compatibility Guide'],
        ['.compat-badge', 'Fits all Type 2 / CCS vehicles'],
        ['.compat-chip[data-brand="other"]', 'All Other Brands'],
        ['.compat-result-footer .compat-tag:nth-child(1) span', '12 V wake-up feed'],
        ['.compat-result-footer .compat-tag:nth-child(2) span', 'Install time ~30–45 min'],

        // Winter Sim
        ['.sim-header-title span', 'Winter Weather & Thermostat Simulator'],
        ['.sim-badge', 'Interactive Demo'],
        ['.sim-desc', 'Drag the slider or tap a weather preset to see how the microprocessor regulates heat output and protects your charge flap:'],
        ['.sim-preset-btn[data-temp="-25"]', '−25 °C Lapland'],
        ['.sim-preset-btn[data-temp="-15"]', '−15 °C Deep Freeze'],
        ['.sim-preset-btn[data-temp="-2"]', '−2 °C Wet Slush'],
        ['.sim-preset-btn[data-temp="10"]', '+10 °C Spring'],
        ['.sim-temp-meta', 'Simulated Ambient Temp'],
        ['.sim-gauge-head > span:first-child', 'Heating Element Output'],
        ['.sim-feedback-item:nth-child(1) .sim-kpi-label', 'Heating Element'],
        ['.sim-feedback-item:nth-child(2) .sim-kpi-label', 'Battery Protection & Draw'],

        // LidAid Video
        ['#lidaid .video-title', 'Field Test: Charge flap soaked overnight at −15 °C'],
        ['#lidaid .video-badge', 'Real Field Test'],
        ['#lidaid .video-yt-link span', 'Watch on YouTube ↗'],
        ['#lidaid .video-play-label', 'Play winter test (0:42)'],

        // LidAid Specs & Package & Pricing
        ['#lidaid .specs-title span', 'Technical Specifications (LidAid)'],
        ['#lidaid .specs-list li:nth-child(1) .spec-name', 'Operating Voltage'],
        ['#lidaid .specs-list li:nth-child(2) .spec-name', 'Standby Current'],
        ['#lidaid .specs-list li:nth-child(3) .spec-name', 'Heating Power'],
        ['#lidaid .specs-list li:nth-child(3) .spec-val', 'Average ~20 W (50 W element)'],
        ['#lidaid .specs-list li:nth-child(4) .spec-name', 'Temperature Range'],
        ['#lidaid .specs-list li:nth-child(5) .spec-name', 'Ambient Rating'],
        ['#lidaid .specs-list li:nth-child(6) .spec-name', 'Enclosure Dimensions'],
        ['#lidaid .package-header h3', 'In the Box (Plug-and-Play Kit)'],
        ['#lidaid .price-label', 'Pricing & Orders'],
        ['#lidaid .price-amount', 'Request a Quote'],
        ['#lidaid .price-subtext', 'Consumer orders & dealer batches direct from the manufacturer'],
        ['#lidaid .pricing-action-box .btn-primary span', 'Order / Request Quote'],
        ['#lidaidManualBtn span', 'Download Manual (PDF)'],
        ['#lidaid .manual-group-label', 'Official installation & user manuals:'],

        // TBS Section
        ['#takavalokytkin .section-title', 'Trailer Taillight Switch (TBS)'],
        ['#takavalokytkin .section-subtitle', 'Design-protected Finnish switch unit that turns your trailer’s taillights into handy reversing lights — without activating the tow vehicle’s blinding rear fog light.'],
        ['.model-selector-label', 'Choose your trailer’s light type:'],
        ['.tbs-model-tab[data-model="TBS-231-L"] .tbs-tab-sub', 'For LED Taillights • Max 5 A'],
        ['.tbs-model-tab[data-model="TBS-221"] .tbs-tab-sub', 'For Incandescent Bulbs • Max 5 A'],
        ['#tbsHotspots .hotspot-pin:nth-child(1) strong', 'Main Switch (ON / OFF)'],
        ['#tbsHotspots .hotspot-pin:nth-child(1) em', 'Road-safe manual activation toggle'],
        ['#tbsHotspots .hotspot-pin:nth-child(2) strong', 'Lid Wiring Legend'],
        ['#tbsHotspots .hotspot-pin:nth-child(2) em', 'Color-coded connections printed right on the lid'],
        ['#tbsHotspots .hotspot-pin:nth-child(3) strong', 'QC PASSED Seal'],
        ['#tbsHotspots .hotspot-pin:nth-child(3) em', '100 % electrically bench-tested at the factory'],
        ['#tbsHotspots .hotspot-pin:nth-child(4) strong', '12 V Wiring Harness'],
        ['#tbsHotspots .hotspot-pin:nth-child(4) em', 'Connects directly — no 13-pin socket required'],
        ['#takavalokytkin .zoom-hint span', 'Enlarge photo'],
        ['#takavalokytkin .product-lead-text', 'Safe, stress-free trailer reversing in dark driveways, cottage roads, and job sites.'],
        ['#takavalokytkin .product-desc-body', 'The TBS taillight switch solves a classic frustration: backing up a trailer in the dark with zero rear visibility. The unit lets you switch on the trailer’s own taillights as reversing and work lights without turning on your car’s blinding rear fog lamp.'],
        ['#takavalokytkin .video-title', 'Demo Video: Triggering trailer lights via hazard flashers at night'],
        ['#takavalokytkin .video-badge', 'Real Field Test'],
        ['#takavalokytkin .video-play-label', 'Play demonstration (0:17)'],
        ['.patent-tag', 'PRH • DESIGN-PROTECTED FINNISH INVENTION'],
        ['.patent-seal-content h3', 'Design-Protected Switching Technology'],
        ['.patent-seal-content p', 'Protected Finnish design: Triggers trailer reversing lights via turn-signal pulses with zero car coding or expensive 13-pin harness re-wiring.'],
        ['#takavalokytkin .specs-heading', 'Technical Specifications'],
        ['#takavalokytkin .specs-list li:nth-child(1) .spec-name', 'Operating Voltage'],
        ['#takavalokytkin .specs-list li:nth-child(1) .spec-val', '12 VDC (24 V with series resistor)'],
        ['#takavalokytkin .specs-list li:nth-child(2) .spec-name', 'Load Capacity'],
        ['#takavalokytkin .specs-list li:nth-child(3) .spec-name', 'Recommended For'],
        ['#takavalokytkin .specs-list li:nth-child(4) .spec-name', 'Control Switch'],
        ['#takavalokytkin .specs-list li:nth-child(4) .spec-val', 'Two-position toggle switch (ON / OFF)'],
        ['#takavalokytkin .specs-list li:nth-child(5) .spec-name', 'Made In'],
        ['#takavalokytkin .specs-list li:nth-child(5) .spec-val', 'Finland (Sipoo)'],
        ['#takavalokytkin .package-header h3', 'In the Box (Plug-and-Play Kit)'],
        ['#takavalokytkin .price-label', 'Pricing & Orders'],
        ['#takavalokytkin .price-amount', 'Request a Quote'],
        ['#takavalokytkin .price-subtext', 'Available direct from the inventor and authorized dealers'],
        ['#takavalokytkin .pricing-action-box .btn-primary span', 'Order / Request Quote'],
        ['#tbsManualBtnText', 'Download Manual (PDF)'],
        ['#takavalokytkin .manual-group-label', 'Official installation & user manuals:'],

        // Media & Field Testing
        ['#kokemuksia .section-title', 'Proven in Arctic Finnish Winters'],
        ['#kokemuksia .section-subtitle', 'Tested in Finnish winter conditions. Read the Ilta-Sanomat feature article (link below).'],
        ['.press-sub-badge', 'Automotive Desk'],
        ['.press-quote', '“An inventor from Sipoo solved the winter agony of EV owners — a thermostat-controlled heater keeps the charge flap operating even in severe frost.”'],
        ['.press-author', 'Journalist Tommi Lempinen, Ilta-Sanomat'],
        ['.press-link span', 'Read full article on IS.fi (FI)'],

        // Order Process
        ['#tilausohje .section-title', 'How Ordering Works'],
        ['#tilausohje .section-subtitle', 'No account sign-ups or complicated checkout funnels. Get direct engineering advice and fast dispatch straight from our workshop in Finland.'],
        ['.process-step-card:nth-child(1) h3', '1. Pick a product & reach out'],
        ['.process-step-card:nth-child(2) h3', '2. Confirmation & clear invoice'],
        ['.process-step-card:nth-child(2) p', 'We confirm your order by email. Consumers pay safely via bank transfer or MobilePay; businesses receive an official e-invoice (14 days net).'],
        ['.process-step-card:nth-child(3) h3', '3. Fast dispatch from Sipoo'],
        ['.process-step-card:nth-child(3) p', 'Parcels ship within 1–2 business days with full tracking. Includes complete mounting hardware and clear English installation instructions.'],

        // Founder Story
        ['#tarina .section-title', 'The Story Behind Qeino'],
        ['.csw-badge', 'Also Available'],
        ['.csw-content strong', 'Webasto & Eberspächer Remote Control (CSW-1):'],
        ['.csw-content span', 'Trigger your vehicle’s auxiliary heater directly using your original factory car key — no bulky extra fobs. Built and tested in Sipoo.'],
        ['.story-quote-card blockquote', '"I got tired of banging frozen charge doors with my fist and thawing them with a heat gun on sub-zero mornings. I knew there had to be a smarter, rock-solid way that never compromises the car’s warranty."'],

        // B2B
        ['#jalleenmyyjat .section-title', 'Partnering with Dealerships & Workshops'],
        ['#jalleenmyyjat .section-subtitle', 'Qeino products have drawn strong demand across the automotive industry. We offer dealers and service centers competitive wholesale pricing and direct engineer support.'],
        ['.b2b-card:nth-child(1) .b2b-partner-tag', 'Service Centers & Installers'],
        ['.b2b-card:nth-child(1) h3', 'Auto Workshops & EV Installers'],
        ['.b2b-card:nth-child(1) p', 'Offer EV owners a winter upgrade that genuinely works. A straightforward 30–45 minute installation creates strong service revenue and delighted customers.'],
        ['.b2b-card:nth-child(1) .b2b-perks-list li:nth-child(1) span', 'Strong dealer margins and volume discounts'],
        ['.b2b-card:nth-child(1) .b2b-perks-list li:nth-child(2) span', 'Pre-terminated harnesses & model-specific guides'],
        ['.b2b-card:nth-child(1) .b2b-perks-list li:nth-child(3) span', 'Direct phone hotline to the inventor during installs'],
        ['.b2b-card:nth-child(1) .btn span', 'Request Wholesale Pricing'],
        ['.b2b-card:nth-child(2) .b2b-partner-tag', 'Trailers & Resellers'],
        ['.b2b-card:nth-child(2) h3', 'Trailer Dealers & Manufacturers'],
        ['.b2b-card:nth-child(2) p', 'Equip new and used trailers with the design-protected taillight switch. A standout safety upgrade for customers reversing trailers in the dark.'],
        ['.b2b-card:nth-child(2) .b2b-perks-list li:nth-child(1) span', 'Design-protected Finnish invention — zero cheap knock-offs'],
        ['.b2b-card:nth-child(2) .b2b-perks-list li:nth-child(2) span', 'Rapid stock dispatch straight from Sipoo, Finland'],
        ['.b2b-card:nth-child(2) .b2b-perks-list li:nth-child(3) span', 'Ready-to-use showroom brochures & product sheets'],
        ['.b2b-card:nth-child(2) .btn span', 'Become a Reseller'],

        // FAQ
        ['#ukk .section-title', 'Frequently Asked Questions'],
        ['#ukk .section-subtitle', 'Find clear answers to the most common questions about installation, operation, and warranties.'],
        ['.faq-item:nth-child(1) .faq-question > span:first-child', 'Does LidAid drain the car’s battery if parked in the cold for days?'],
        ['.faq-item:nth-child(1) .faq-answer p', 'No. LidAid connects to the car’s 12 V wake-up feed, so it only operates while the vehicle is awake or actively charging. In addition, the microprocessor automatically cuts heating whenever ambient temperature rises above +4 °C. If the car remains parked for more than two days, we recommend using a 12 V battery charger.'],
        ['.faq-item:nth-child(2) .faq-question > span:first-child', 'How do I choose the right TBS model (TBS-231-L vs. TBS-221)?'],
        ['.faq-item:nth-child(3) .faq-question > span:first-child', 'Can the trailer taillight switch be used on public roads?'],
        ['.faq-item:nth-child(3) .faq-answer p', 'The taillight switch is not approved for public highway driving. It may only be switched on off public roads — such as cottage lanes, construction sites, private yards, or loading areas. Keep the switch OFF during normal road driving.'],
        ['.faq-item:nth-child(4) .faq-question > span:first-child', 'Does the TBS taillight switch work on 24 V electrical systems?'],
        ['.faq-item:nth-child(4) .faq-answer p', 'The unit is designed for 12 V passenger-vehicle systems. However, it can easily be installed on a 24 V system by placing a 1 W, 300-ohm series resistor on the positive supply wire.'],

        // Contact
        ['#yhteystiedot .section-title', 'Contact & Order Inquiries'],
        ['#yhteystiedot .section-subtitle', 'We’re happy to answer questions about products, pricing, installation, and dealerships. Call the inventor directly or send us a message below.'],
        ['.contact-brand-pill > span:last-child', 'Direct Line to the Inventor • Sipoo'],
        ['.company-desc-text', 'A Finnish automotive electronics engineering company. Every single unit is designed, assembled, and bench-tested in Sipoo, Finland.'],
        ['.contact-list .contact-item:nth-child(1) .title', 'Phone & WhatsApp'],
        ['.contact-list .contact-item:nth-child(1) .val', '+358 44 306 9752'],
        ['.contact-list .contact-item:nth-child(1) .subtext', 'Hannu Alhovuori (Founder & Inventor)'],
        ['.contact-list .contact-item:nth-child(2) .title', 'Email'],
        ['.contact-list .contact-item:nth-child(3) .title', 'Workshop & Postal Address'],
        ['.contact-list .contact-item:nth-child(3) .val', 'Pohjanniityntie 15, 04130 Sipoo, Finland'],
        ['.contact-list .contact-item:nth-child(4) .title', 'Service Hours'],
        ['.contact-list .contact-item:nth-child(4) .val', 'Mon–Fri 16:00 – 18:00 (EET)'],

        ['.form-title', 'Send an Inquiry or Order Request'],
        ['.form-subtitle', 'Select a product below and leave your details — we reply personally within the same business day.'],
        ['.type-btn[data-type="consumer"] span', 'Private Customer'],
        ['.type-btn[data-type="b2b"] span', 'Business / Reseller'],
        ['label[for="inquiryCompany"]', 'Company Name & VAT / Business ID'],
        ['.product-chip[data-value="LidAid-latausluukunlämmitin"]', 'LidAid Heater'],
        ['.product-chip[data-value="TBS-231-L (LED-malli)"]', 'TBS-231-L (LED)'],
        ['.product-chip[data-value="TBS-221 (Hehkulamppumalli)"]', 'TBS-221 (Bulb)'],
        ['.product-chip[data-value="Webaston kauko-ohjain CSW-1"]', 'CSW-1 Webasto'],
        ['.product-chip[data-value="Jälleenmyynti & tukkuhinnasto"]', 'Wholesale / B2B'],
        ['.product-chip[data-value="Yleinen tiedustelu"]', 'Other Topic'],
        ['#inquiryProduct option[value="LidAid-latausluukunlämmitin"]', 'LidAid Charge Port Heater (For EVs)'],
        ['#inquiryProduct option[value="TBS-231-L (LED-malli)"]', 'Taillight Switch TBS-231-L (For LED Lights)'],
        ['#inquiryProduct option[value="TBS-221 (Hehkulamppumalli)"]', 'Taillight Switch TBS-221 (For Bulbs)'],
        ['#inquiryProduct option[value="Webaston kauko-ohjain CSW-1"]', 'Webasto Remote Control CSW-1 (Webasto / Eber)'],
        ['#inquiryProduct option[value="Jälleenmyynti & tukkuhinnasto"]', 'Reseller & Wholesale Pricing (B2B)'],
        ['#inquiryProduct option[value="Yleinen tiedustelu"]', 'General Question or Installation Support'],
        ['label[for="inquiryPhone"]', 'Phone Number'],
        ['.form-row .label-hint', 'optional'],
        ['label[for="inquiryMessage"]', 'Message or Question'],
        ['.form-group:has(#inquiryMessage) .label-hint', 'Car model, quantity, etc.'],
        ['#inquirySubmitBtn span', 'Open in Email & Send'],
        ['#copyBtnText', 'Copy message to clipboard'],
        ['.form-trust-row .trust-badge-item:nth-child(1) span', 'Confidential handling'],
        ['.form-trust-row .trust-badge-item:nth-child(2) span', 'Reply usually same business day'],
        ['#inquirySuccess strong', 'Your email app is opening with a pre-filled message!'],

        // Footer & Mobile Bar
        ['.footer-brand p', 'Finnish automotive electrical engineering. Smart, durable solutions for electric vehicles, sub-zero winters, and trailers.'],
        ['.footer-is-link span', 'Read the LidAid feature in Ilta-Sanomat (FI)'],
        ['.footer-col:nth-child(2) h2', 'Quick Links'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(1) a', 'LidAid Charge Port Heater'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(2) a', 'TBS Taillight Switch'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(3) a', 'Media & Field Testing'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(4) a', 'How Ordering Works'],
        ['.footer-col:nth-child(2) .footer-links li:nth-child(5) a', 'The Story of Qeino'],
        ['#footerLidAidManual', 'LidAid User Manual (PDF)'],
        ['.footer-col:nth-child(3) h2', 'Contact Details'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(2)', 'Pohjanniityntie 15, 04130 Sipoo, Finland'],
        ['.footer-copy-email-btn span', 'Copy email address'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(6) a', 'Reseller Partnerships'],
        ['.footer-bottom > div:first-child', '© 2026 Qeino Oy. All rights reserved.'],
        ['.made-in-finland span', '🇫🇮 Finnish Quality & Engineering'],
        ['.mobile-bar-btn.call-btn span', 'Call Inventor'],
        ['.mobile-bar-btn.quote-btn span', 'Request Quote']
      ],
      html: [
        ['.hero-title', 'Smart automotive solutions for <span class="highlight">extreme cold &amp; darkness</span>'],
        ['.hero-badges .hero-badge-item:nth-child(1) .hero-badge-text', '100 % Designed &amp;<br>Tested in Finland'],
        ['.hero-badges .hero-badge-item:nth-child(2) .hero-badge-text', 'Built for Arctic<br>Winters (−40 °C)'],
        ['.hero-badges .hero-badge-item:nth-child(3) .hero-badge-text', 'Safe &amp; Easy<br>12 V Integration'],
        ['#lidaid .benefit-item:nth-child(1) span', '<strong>Fully Automatic:</strong> Shuts off automatically whenever ambient temperature exceeds +4 °C.'],
        ['#lidaid .benefit-item:nth-child(2) span', '<strong>Safe 12 V System:</strong> Zero impact on the high-voltage battery or vehicle factory warranty.'],
        ['#lidaid .benefit-item:nth-child(3) span', '<strong>Adjustable Temperature:</strong> Stepless +45 °C ... +65 °C dial tailored to your vehicle.'],
        ['#lidaid .package-item:nth-child(1) > div', '<strong>LidAid Controller Unit</strong> in durable enclosure with stepless temp dial'],
        ['#lidaid .package-item:nth-child(2) > div', '<strong>Flexible Silicone Heating Element</strong> with adhesive backing &amp; NTC sensor'],
        ['#lidaid .package-item:nth-child(3) > div', '<strong>Complete Wiring Kit</strong>, splice connectors, and inline fuse holder'],
        ['#lidaid .package-item:nth-child(4) > div', '<strong>Clear Illustrated Installation Manual</strong> (English &amp; Finnish) with wiring diagram'],
        ['#lidaid .package-item:nth-child(5) > div', '<strong>2-Year Factory Warranty</strong> and direct phone support from the inventor'],
        ['#takavalokytkin .benefit-item:nth-child(1) span', '<strong>Design-Protected Technology:</strong> Prevents the car’s rear fog lamp from blinding your mirrors while reversing.'],
        ['#takavalokytkin .benefit-item:nth-child(2) span', '<strong>Two Dedicated Models:</strong> Engineered separately for LED taillights (TBS-231-L) and incandescent bulbs (TBS-221).'],
        ['#takavalokytkin .benefit-item:nth-child(3) span', '<strong>Simple Installation:</strong> Mounts cleanly behind trunk trim straight to taillight wires using included hardware.'],
        ['#takavalokytkin .package-item:nth-child(1) > div', '<strong>TBS Switch Unit</strong> in your chosen LED or incandescent bulb model'],
        ['#takavalokytkin .package-item:nth-child(2) > div', '<strong>Pre-wired Automotive Harness</strong> with protective sleeve &amp; labeled leads'],
        ['#takavalokytkin .package-item:nth-child(3) > div', '<strong>Quick-splice Connectors</strong> and ring ground terminal'],
        ['#takavalokytkin .package-item:nth-child(4) > div', '<strong>Step-by-step English Installation &amp; Wiring Manual</strong>'],
        ['#takavalokytkin .package-item:nth-child(5) > div', '<strong>2-Year Manufacturer Warranty</strong> and direct technical install support'],
        ['.process-step-card:nth-child(1) p', 'Fill in the inquiry form below or call the inventor directly (<a href="tel:+358443069752">+358 44 306 9752</a>). Let us know the product and your vehicle or trailer model.'],
        ['.process-guarantee-bar .guarantee-pill:nth-child(1) span', '<strong>2-Year Manufacturer Warranty</strong> on every device'],
        ['.process-guarantee-bar .guarantee-pill:nth-child(2) span', '<strong>14-Day Satisfaction Guarantee</strong> &amp; full right of return'],
        ['.process-guarantee-bar .guarantee-pill:nth-child(3) span', '<strong>Direct Support from the Inventor:</strong> <a href="tel:+358443069752">+358 44 306 9752</a>'],
        ['#tarina .story-text > p:nth-of-type(1)', 'Qeino Oy was born out of real-world frustration and Finnish engineering grit that refuses half-baked fixes. When sub-zero cold, slush, and freezing rain turned morning EV charging into a battle, development began.'],
        ['#tarina .story-text > p:nth-of-type(2)', 'Founder <strong>Hannu Alhovuori</strong> brings over 40 years of hands-on experience in electronics, automotive electrics, and industrial design. Every Qeino unit is engineered, assembled, and individually tested in Sipoo to endure harsh Nordic winters.'],
        ['#tarina .story-text > p:nth-of-type(3)', 'We never build disposable mass-market gadgets — our devices are repairable, rugged, and thoughtfully crafted electrical innovations.'],
        ['.story-author-tag', '<strong>Hannu Alhovuori</strong> — Founder &amp; Electrical Engineer, Qeino Oy'],
        ['.faq-item:nth-child(2) .faq-answer p', 'Simply match your trailer’s taillights: If your trailer uses modern <strong>LED taillights</strong>, choose <strong>TBS-231-L</strong>. If it uses traditional <strong>incandescent bulbs</strong>, choose <strong>TBS-221</strong>.'],
        ['.contact-obsidian-footer .obsidian-perk:nth-child(1) span', '<strong>2-Year Factory Warranty</strong> &amp; 14-day return right'],
        ['.contact-obsidian-footer .obsidian-perk:nth-child(2) span', '<strong>Dispatched in 1–2 business days</strong> with parcel tracking'],
        ['.contact-obsidian-footer .obsidian-perk:nth-child(3) span', '<strong>No middlemen</strong> — direct support from the electrical engineer'],
        ['label[for="inquiryProduct"]', 'Select product or topic <span class="required-star">*</span>'],
        ['label[for="inquiryName"]', 'Full Name <span class="required-star">*</span>'],
        ['label[for="inquiryEmail"]', 'Email Address <span class="required-star">*</span>'],
        ['#inquirySuccess p', 'Recipient: <strong>qeino.fi@gmail.com</strong>. If you use webmail (e.g., Gmail), click "Copy message to clipboard" above and paste it straight in.'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(3)', 'Phone: <a href="tel:+358443069752">+358 44 306 9752</a>'],
        ['.footer-col:nth-child(3) .footer-links li:nth-child(4)', 'Email: <a href="mailto:qeino.fi@gmail.com">qeino.fi@gmail.com</a>']
      ],
      tailText: [
        ['.hero-section .teaser', '01 / Finnish Automotive Innovation'],
        ['.status-pill', 'In Production & Available'],
        ['#lidaid .teaser', '02 / Winter EV Solution'],
        ['#takavalokytkin .teaser', '03 / Design-Protected Innovation'],
        ['#kokemuksia .teaser', '04 / Media & Field Testing'],
        ['#tilausohje .teaser', '05 / Hassle-Free Delivery'],
        ['#tarina .teaser', '06 / Finnish Invention'],
        ['#jalleenmyyjat .teaser', '07 / B2B & Resellers'],
        ['#ukk .teaser', '08 / Frequently Asked'],
        ['#yhteystiedot .teaser', '09 / Get in Touch']
      ],
      attrs: [
        ['.logo-link', 'aria-label', 'Qeino Oy Home'],
        ['header nav', 'aria-label', 'Main navigation'],
        ['#mobileMenuBtn', 'aria-label', 'Open menu'],
        ['.hero-product-switch', 'aria-label', 'Preview flagship products'],
        ['.trust-ribbon', 'aria-label', 'Warranties and shipping guarantees'],
        ['#lidaidMainImg', 'alt', 'LidAid charge port heater controller unit'],
        ['#lidaidHotspots', 'aria-label', 'Technical hardware callouts'],
        ['#lidaidHotspots .hotspot-pin:nth-child(1)', 'aria-label', 'Component: Main power switch'],
        ['#lidaidHotspots .hotspot-pin:nth-child(2)', 'aria-label', 'Component: Status LEDs'],
        ['#lidaidHotspots .hotspot-pin:nth-child(3)', 'aria-label', 'Component: Temperature dial'],
        ['#lidaidHotspots .hotspot-pin:nth-child(4)', 'aria-label', 'Component: Wiring harness and NTC sensor'],
        ['#zoomBadge', 'aria-label', 'Enlarge LidAid product photo'],
        ['#lidaidGallery .thumb-btn:nth-child(1)', 'aria-label', 'LidAid controller unit'],
        ['#lidaidGallery .thumb-btn:nth-child(1) img', 'alt', 'LidAid controller unit'],
        ['#lidaidGallery .thumb-btn:nth-child(2)', 'data-full', 'assets/img/lidaid-kaavio-en.webp?v=4'],
        ['#lidaidGallery .thumb-btn:nth-child(2)', 'aria-label', 'LidAid wiring diagram'],
        ['#lidaidGallery .thumb-btn:nth-child(2) img', 'src', 'assets/img/lidaid-kaavio-en.webp?v=4'],
        ['#lidaidGallery .thumb-btn:nth-child(2) img', 'alt', 'LidAid wiring diagram'],
        ['#lidaidGallery .thumb-btn:nth-child(3)', 'aria-label', 'LidAid mounting kit'],
        ['#lidaidGallery .thumb-btn:nth-child(3) img', 'alt', 'LidAid mounting kit'],
        ['#evSearchInput', 'placeholder', 'Search your car model (e.g., Enyaq, ID.4, Born, Ioniq 5...)'],
        ['#evSearchInput', 'aria-label', 'Search your car model'],
        ['#compatChips', 'aria-label', 'Select car brand'],
        ['.sim-presets', 'aria-label', 'Weather scenario presets'],
        ['#tempSlider', 'aria-label', 'Adjust simulated ambient temperature'],
        ['#lidaid .video-yt-link', 'title', 'Open official field-test video on YouTube'],
        ['#lidaid video', 'aria-label', 'LidAid charge port heater winter field test at −15 °C'],
        ['#lidaid .video-play-overlay', 'aria-label', 'Play LidAid winter test video'],
        ['#lidaidManualBtn', 'href', 'assets/docs/LidAid_manual_en.pdf'],
        ['#footerLidAidManual', 'href', 'assets/docs/LidAid_manual_en.pdf'],
        ['.model-selector', 'aria-label', 'Choose taillight switch model'],
        ['#tbsHotspots', 'aria-label', 'Taillight switch hardware callouts'],
        ['#tbsHotspots .hotspot-pin:nth-child(1)', 'aria-label', 'Component: ON / OFF toggle switch'],
        ['#tbsHotspots .hotspot-pin:nth-child(2)', 'aria-label', 'Component: Lid wiring legend'],
        ['#tbsHotspots .hotspot-pin:nth-child(3)', 'aria-label', 'Component: QC PASSED seal'],
        ['#tbsHotspots .hotspot-pin:nth-child(4)', 'aria-label', 'Component: 12 V wiring harness'],
        ['#takavalokytkin .zoom-hint', 'aria-label', 'Enlarge TBS taillight switch photo'],
        ['#tbsGallery .thumb-btn:nth-child(1)', 'aria-label', 'Taillight switch unit'],
        ['#tbsGallery .thumb-btn:nth-child(1) img', 'alt', 'Taillight switch unit'],
        ['#tbsGallery .thumb-btn:nth-child(2)', 'aria-label', 'Taillight switch PCB'],
        ['#tbsGallery .thumb-btn:nth-child(2) img', 'alt', 'Taillight switch PCB'],
        ['#tbsGallery .thumb-btn:nth-child(3)', 'data-full', 'assets/img/tbs-kytkenta-en.webp?v=4'],
        ['#tbsGallery .thumb-btn:nth-child(3)', 'aria-label', 'Taillight switch wiring diagram'],
        ['#tbsGallery .thumb-btn:nth-child(3) img', 'src', 'assets/img/tbs-kytkenta-en.webp?v=4'],
        ['#tbsGallery .thumb-btn:nth-child(3) img', 'alt', 'Taillight switch wiring diagram'],
        ['#takavalokytkin video', 'aria-label', 'Trailer taillight switch nighttime demonstration video'],
        ['#takavalokytkin .video-play-overlay', 'aria-label', 'Play taillight switch demo video'],
        ['.press-link', 'aria-label', 'Read full article in Ilta-Sanomat'],
        ['.customer-type-toggle', 'aria-label', 'Customer type'],
        ['#inquiryCompany', 'placeholder', 'e.g., Nordic Auto Service Ltd, FI12345678'],
        ['#productQuickChips', 'aria-label', 'Quick product selector'],
        ['#inquiryName', 'placeholder', 'First & Last Name'],
        ['#inquiryPhone', 'placeholder', '+358 40 123 4567'],
        ['#inquiryEmail', 'placeholder', 'name@company.com'],
        ['#inquiryMessage', 'placeholder', 'Tell us your car or trailer model, quantity needed, or your question...'],
        ['#mobileStickyBar', 'aria-label', 'Quick contact'],
        ['.mobile-bar-btn.call-btn', 'aria-label', 'Call inventor +358 44 306 9752'],
        ['.mobile-bar-btn.quote-btn', 'aria-label', 'Go to inquiry form'],
        ['#backToTopBtn', 'aria-label', 'Back to top'],
        ['#lightboxModal', 'aria-label', 'Image preview'],
        ['#lightboxClose', 'aria-label', 'Close preview'],
        ['#lightboxPrev', 'aria-label', 'Previous photo'],
        ['#lightboxNext', 'aria-label', 'Next photo'],
        ['#lightboxImg', 'alt', 'Enlarged product photo']
      ]
    }
  };

  // Helper: replace the trailing text node of an element while preserving child icons/dots
  function setTrailingText(el, newText) {
    if (!el) return;
    const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
    if (textNodes.length > 0) {
      textNodes[textNodes.length - 1].textContent = ' ' + newText;
    } else {
      el.appendChild(document.createTextNode(' ' + newText));
    }
  }

  function getTrailingText(el) {
    if (!el) return '';
    const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
    return textNodes.length > 0 ? textNodes[textNodes.length - 1].textContent.trim() : '';
  }

  let fiMetaSnapshot = null;
  const fiTailSnapshot = new Map();

  function captureFinnishSnapshot() {
    if (fiSnapshotCaptured) return;
    fiSnapshotCaptured = true;

    const descMeta = document.querySelector('meta[name="description"]');
    fiMetaSnapshot = {
      title: document.title,
      description: descMeta ? descMeta.getAttribute('content') : ''
    };

    const ref = staticTranslations.en;
    ref.text.forEach(([sel]) => {
      const el = document.querySelector(sel);
      if (el) fiTextSnapshot.set(sel, el.textContent);
    });
    ref.html.forEach(([sel]) => {
      const el = document.querySelector(sel);
      if (el) fiHtmlSnapshot.set(sel, el.innerHTML);
    });
    ref.tailText.forEach(([sel]) => {
      const el = document.querySelector(sel);
      if (el) fiTailSnapshot.set(sel, getTrailingText(el));
    });
    ref.attrs.forEach(([sel, attr]) => {
      const el = document.querySelector(sel);
      if (el) fiAttrSnapshot.set(`${sel}|||${attr}`, el.getAttribute(attr));
    });
  }

  function applyStaticLanguage(lang) {
    captureFinnishSnapshot();

    document.documentElement.setAttribute('lang', lang);
    const descMeta = document.querySelector('meta[name="description"]');

    if (lang === 'fi') {
      if (fiMetaSnapshot) {
        document.title = fiMetaSnapshot.title;
        if (descMeta) descMeta.setAttribute('content', fiMetaSnapshot.description);
      }
      fiTextSnapshot.forEach((val, sel) => {
        const el = document.querySelector(sel);
        if (el) el.textContent = val;
      });
      fiHtmlSnapshot.forEach((val, sel) => {
        const el = document.querySelector(sel);
        if (el) el.innerHTML = val;
      });
      fiTailSnapshot.forEach((val, sel) => {
        const el = document.querySelector(sel);
        if (el) setTrailingText(el, val);
      });
      fiAttrSnapshot.forEach((val, key) => {
        const [sel, attr] = key.split('|||');
        const el = document.querySelector(sel);
        if (el && val !== null) el.setAttribute(attr, val);
      });
    } else {
      const pack = staticTranslations[lang];
      if (!pack) return;
      document.title = pack.meta.title;
      if (descMeta) descMeta.setAttribute('content', pack.meta.description);

      pack.text.forEach(([sel, val]) => {
        const el = document.querySelector(sel);
        if (el) el.textContent = val;
      });
      pack.html.forEach(([sel, val]) => {
        const el = document.querySelector(sel);
        if (el) el.innerHTML = val;
      });
      pack.tailText.forEach(([sel, val]) => {
        const el = document.querySelector(sel);
        if (el) setTrailingText(el, val);
      });
      pack.attrs.forEach(([sel, attr, val]) => {
        const el = document.querySelector(sel);
        if (el) el.setAttribute(attr, val);
      });
    }

    // Update active state on language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const isMatch = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
  }

  function detectBrowserLang() {
    try {
      const langs = Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : (navigator.language ? [navigator.language] : []);

      if (!langs.length) return 'fi';

      for (const raw of langs) {
        if (!raw) continue;
        const base = String(raw).toLowerCase().split(/[-_]/)[0];
        if (SUPPORTED.includes(base)) {
          return base;
        }
      }

      // Non-Finnish / non-Swedish international browser -> default to English
      return 'en';
    } catch (_) {
      return 'fi';
    }
  }

  function detectInitialLang() {
    // 1. Explicit URL parameter (?lang=fi|sv|en) always wins
    try {
      const params = new URLSearchParams(window.location.search);
      const qLang = (params.get('lang') || '').toLowerCase();
      if (SUPPORTED.includes(qLang)) return qLang;
    } catch (_) {}

    // 2. Saved manual user preference
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
      if (SUPPORTED.includes(saved)) return saved;
    } catch (_) {}

    // 3. Smart browser/OS language auto-detection
    return detectBrowserLang();
  }

  function setLang(lang, options = {}) {
    const normalized = SUPPORTED.includes(lang) ? lang : 'fi';
    currentLang = normalized;

    if (options.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch (_) {}
    }

    if (options.updateUrl !== false && window.history && window.history.replaceState) {
      try {
        const url = new URL(window.location.href);
        if (normalized === 'fi') {
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('lang', normalized);
        }
        window.history.replaceState(null, '', url.toString());
      } catch (_) {}
    }

    applyStaticLanguage(normalized);

    window.dispatchEvent(new CustomEvent('qeino:langchange', {
      detail: { lang: normalized }
    }));
  }

  function getLang() {
    return currentLang;
  }

  function getData(lang) {
    const l = SUPPORTED.includes(lang) ? lang : currentLang;
    return dynamicData[l] || dynamicData.fi;
  }

  function initLangSwitcher() {
    captureFinnishSnapshot();

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetLang = btn.getAttribute('data-lang');
        if (targetLang && targetLang !== currentLang) {
          setLang(targetLang, { updateUrl: true, persist: true });
        }
      });
    });

    const initial = detectInitialLang();
    if (initial !== 'fi') {
      // Auto-detected or URL-specified: do not overwrite saved manual preference
      setLang(initial, { updateUrl: false, persist: false });
    } else {
      // Ensure buttons reflect FI state cleanly
      document.querySelectorAll('.lang-btn').forEach(btn => {
        const isFi = btn.getAttribute('data-lang') === 'fi';
        btn.classList.toggle('active', isFi);
        btn.setAttribute('aria-pressed', isFi ? 'true' : 'false');
      });
    }
  }

  window.qeinoI18n = {
    getLang,
    setLang,
    getData,
    initLangSwitcher
  };
})();
