import { launchBrowser } from './lib.mjs';
import { DEVICES } from './devices.mjs';
import { writeFileSync } from 'fs';

async function main() {
  const b = await launchBrowser();
  try {
    const desktop = DEVICES.find((d) => d.id === 'desktop');
    await b.emulate(desktop);
    await b.goto('http://127.0.0.1:8080/');
    await new Promise((r) => setTimeout(r, 600));

    const sections = ['hero', 'lidaid', 'takavalokytkin', 'tilausohje', 'syntytarina', 'yhteystiedot'];
    for (const sec of sections) {
      await b.ev(`document.getElementById('${sec}')?.scrollIntoView({ behavior: 'instant', block: 'start' })`);
      await new Promise((r) => setTimeout(r, 400));
      const res = await b.send('Page.captureScreenshot', { format: 'png' });
      if (res?.result?.data) {
        writeFileSync(`C:/Users/nuori/.gemini/antigravity/brain/e7594966-5ebd-44e1-a338-03b002d7bdfe/sec_${sec}.png`, Buffer.from(res.result.data, 'base64'));
      }
    }
    const s21u = DEVICES.find((d) => d.id === 's21u');
    await b.emulate(s21u);
    await b.goto('http://127.0.0.1:8080/');
    await new Promise((r) => setTimeout(r, 600));

    for (const sec of sections) {
      await b.ev(`document.getElementById('${sec}')?.scrollIntoView({ behavior: 'instant', block: 'start' })`);
      await new Promise((r) => setTimeout(r, 400));
      const res = await b.send('Page.captureScreenshot', { format: 'png' });
      if (res?.result?.data) {
        writeFileSync(`C:/Users/nuori/.gemini/antigravity/brain/e7594966-5ebd-44e1-a338-03b002d7bdfe/s21u_${sec}.png`, Buffer.from(res.result.data, 'base64'));
      }
    }

    await b.ev(`document.getElementById('inquiryForm')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
    await new Promise((r) => setTimeout(r, 400));
    const resForm = await b.send('Page.captureScreenshot', { format: 'png' });
    if (resForm?.result?.data) {
      writeFileSync(`C:/Users/nuori/.gemini/antigravity/brain/e7594966-5ebd-44e1-a338-03b002d7bdfe/s21u_form_card.png`, Buffer.from(resForm.result.data, 'base64'));
    }

    console.log('Saved all desktop and mobile section screenshots successfully!');
  } finally {
    await b.close();
  }
}
main();
