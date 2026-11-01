# Qeino Oy — Verkkosivusto & Sähköinen Tuote-esite

Moderni, nopea ja kevyt yhden sivun tuote-esitesivusto **Qeino Oy:lle**.

Sivusto esittelee Qeino Oy:n suomalaiset autosähköinnovaatiot:
1. **LidAid-latausluukunlämmitin** sähkö- ja hybridiautoille
2. **Perävaunun takavalokytkin (TBS-231-L / TBS-221)**
3. **Webaston kauko-ohjain (CSW-1)**
4. **Qeinon syntytarina** (Jani Raespuron ja Hannu Alhovuoren innovaatio)
5. **Jälleenmyyjät ja B2B-kumppanuus**
6. **Usein kysytyt kysymykset (UKK)**
7. **Interaktiivinen tilaus- ja yhteydenottolomake**

Sivusto noudattaa Qeinon virallista graafista ohjeistoa (Libre Franklin -fontti, viralliset värit `#304B9A`, `#3C3C3B`, `#F2F2F2` ja vektorilogo).

---

## 🚀 Julkaisu GitHub Pages -palvelussa

Sivusto on rakennettu standardeilla verkkoteknologioilla (HTML5, moderni CSS3, vanilja-JavaScript), joten se toimii suoraan ilman erillistä build-vaihetta.

### Vaiheet:
1. Luo Qeinon omilla GitHub-tunnuksilla uusi julkinen tai yksityinen repositorio (esim. `qeino-web` tai `qeino.github.io`).
2. Alusta git ja lataa tiedostot repoon:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Qeino website"
   git branch -M main
   git remote add origin https://github.com/QEINO-KAYTTAJA/REPO-NIMI.git
   git push -u origin main
   ```
3. Mene GitHubissa repositorion asetuksiin: **Settings -> Pages**.
4. Valitse **Build and deployment -> Branch: `main` / `root`** ja paina **Save**.
5. Sivusto on hetken kuluttua livenä verkossa osoitteessa:  
   `https://[kayttaja].github.io/[repo]/` (tai omalla domainilla `www.qeino.fi`).

---

## 📁 Tiedostorakenne

- `index.html` — Sivuston pääsivu ja kaikki sisältöosiot
- `assets/`
  - `css/style.css` — Tyylitiedosto ja responsiivinen asettelu
  - `js/main.js` — Galleriat, mallinvaihto, yhteydenottolomakkeen logiikka
  - `img/` — Vektorilogot, kuvakkeet ja optimoidut, retusoidut tuotekuvat
  - `video/` — Esittelyvideot (LidAid-talvitesti ja takavalokytkimen toiminta)
  - `docs/` — Asennus- ja käyttöohjeet ladattavina PDF-tiedostoina
- `Aineistoja/` — Alkuperäinen lähdemateriaaliarkisto

---

## ✏️ Sisällön muokkaaminen

- **Hinnat**: Voit päivittää tuotehintojen tekstit suoraan `index.html`-tiedostosta kohdasta `.product-pricing-bar`.
- **Yhteystiedot**: Hannu Alhovuori / Qeino Oy, Pohjanniityntie 15, 04130 Sipoo, p. 044 306 9752, qeino.fi@gmail.com.
