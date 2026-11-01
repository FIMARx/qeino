// Browser testing library driving Chromium / Edge over Chrome DevTools Protocol (CDP).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditPage } from "./audit.mjs";

const CANDIDATES = [
  process.env.EDGE_PATH,
  process.env.CHROME_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/microsoft-edge"
].filter(Boolean);

export const browserPath = () => CANDIDATES.find((p) => existsSync(p));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchBrowser({ url = "http://127.0.0.1:8080/", width = 1280, height = 800 } = {}) {
  const exe = browserPath();
  if (!exe) throw new Error("No Edge or Chrome found on system.");

  const dir = mkdtempSync(join(tmpdir(), "qeino-e2e-"));
  const port = 9400 + Math.floor(Math.random() * 500);

  const proc = spawn(exe, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1280,900",
    "--disable-background-networking",
    "about:blank"
  ], { stdio: "ignore" });

  let targets;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      targets = await res.json();
      if (targets.find((x) => x.type === "page")) break;
    } catch (e) {
      // waiting for CDP to start
    }
    await sleep(200);
  }

  const page = targets?.find((x) => x.type === "page");
  if (!page) {
    if (process.platform === "win32" && proc.pid) {
      spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      proc.kill();
    }
    throw new Error("Could not connect to browser via CDP.");
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));

  let id = 0;
  const pending = new Map();
  const consoleErrors = [];
  const exceptions = [];
  let loadFired = false;

  ws.addEventListener("message", (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
    if (d.method === "Page.loadEventFired") {
      loadFired = true;
    }
    if (d.method === "Runtime.exceptionThrown") {
      const desc = d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text;
      exceptions.push(`Exception: ${desc}`);
    }
    if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") {
      const msg = d.params.args.map((a) => a.value || a.description).join(" ");
      consoleErrors.push(`Console Error: ${msg}`);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("CSS.enable");

  // Initial viewport
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false
  });

  const ev = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    return r.result?.result?.value;
  };

  const waitForReady = async () => {
    for (let i = 0; i < 50; i++) {
      const ready = await ev(`(() => {
        return document.readyState === 'complete' && 
               document.getElementById('navLinks') !== null &&
               document.getElementById('mobileMenuBtn') !== null &&
               getComputedStyle(document.body).display === 'block';
      })()`);
      if (ready) return true;
      await sleep(100);
    }
    return false;
  };

  const goto = async (targetUrl = url) => {
    await send("Page.navigate", { url: targetUrl });
    await waitForReady();
    await sleep(250);
  };

  await goto(url);

  const emulate = async (d) => {
    await send("Emulation.setDeviceMetricsOverride", {
      width: d.w,
      height: d.h,
      deviceScaleFactor: d.dpr || 1,
      mobile: !!d.touch
    });
    await send("Emulation.setTouchEmulationEnabled", {
      enabled: !!d.touch,
      maxTouchPoints: d.touch ? 5 : 1
    });
    if (d.ua) {
      await send("Emulation.setUserAgentOverride", { userAgent: d.ua });
    }
    await sleep(250);
  };

  const realClick = async (selector) => {
    const pt = await ev(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return { found: false, reason: "Element not found" };
      el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      const r = el.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2);
      const y = Math.round(r.top + r.height / 2);
      const top = document.elementFromPoint(x, y);
      const ok = !!top && (top === el || el.contains(top) || (top.closest && top.closest('button, a, label, .thumb-btn')?.contains(el)));
      if (!ok) return { found: true, ok: false, top: top ? top.tagName.toLowerCase() : "none" };
      
      const target = (top.closest && top.closest('button, a, label, .thumb-btn')) || top;
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return { found: true, ok: true, x, y, top: top.tagName.toLowerCase() };
    })()`);
    await sleep(250);
    return pt;
  };

  const realTap = async (selector) => {
    return realClick(selector);
  };

  const pressKey = async (key) => {
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key
    });
    await sleep(150);
  };

  const shot = async (filePath) => {
    const res = await send("Page.captureScreenshot", { format: "png" });
    if (res?.result?.data) {
      writeFileSync(filePath, Buffer.from(res.result.data, "base64"));
      return true;
    }
    return false;
  };

  const audit = async (opts = {}) => {
    const script = `(${auditPage.toString()})(${JSON.stringify(opts)})`;
    const res = await ev(script);
    return Array.isArray(res) ? res : [];
  };

  const close = async () => {
    try {
      ws.close();
      if (process.platform === "win32" && proc.pid) {
        spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        proc.kill();
      }
      rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      // ignore teardown error
    }
  };

  return {
    send,
    ev,
    emulate,
    goto,
    waitForReady,
    realClick,
    realTap,
    pressKey,
    shot,
    audit,
    close,
    getErrors: () => [...consoleErrors, ...exceptions]
  };
}
