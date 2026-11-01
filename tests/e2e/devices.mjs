// Device profiles for mobile, tablet, and desktop emulation.
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const PIXEL_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPAD_UA = "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

export const DEVICES = [
  { id: "s21u", name: "Samsung Galaxy S21 Ultra", w: 384, h: 854, dpr: 3.75, touch: true, ua: ANDROID_UA, core: true },
  { id: "s21u-fhd", name: "Samsung Galaxy S21 Ultra (FHD+)", w: 412, h: 915, dpr: 3.5, touch: true, ua: ANDROID_UA },
  { id: "s21u-land", name: "Samsung Galaxy S21 Ultra (Landscape)", w: 854, h: 384, dpr: 3.75, touch: true, ua: ANDROID_UA },
  { id: "iphone15pro", name: "iPhone 15 Pro", w: 393, h: 852, dpr: 3, touch: true, ua: IPHONE_UA, core: true },
  { id: "iphone15promax", name: "iPhone 15 Pro Max", w: 430, h: 932, dpr: 3, touch: true, ua: IPHONE_UA },
  { id: "iphone15pro-land", name: "iPhone 15 Pro (Landscape)", w: 852, h: 393, dpr: 3, touch: true, ua: IPHONE_UA },
  { id: "iphonese", name: "iPhone SE (Small 375px)", w: 375, h: 667, dpr: 2, touch: true, ua: IPHONE_UA, core: true },
  { id: "pixel8", name: "Google Pixel 8", w: 412, h: 915, dpr: 2.6, touch: true, ua: PIXEL_UA },
  { id: "fold5", name: "Samsung Galaxy Z Fold5 (Narrow 344px)", w: 344, h: 882, dpr: 3, touch: true, ua: ANDROID_UA, core: true },
  { id: "ipadmini", name: "iPad mini", w: 744, h: 1133, dpr: 2, touch: true, ua: IPAD_UA },
  { id: "ipadpro11", name: "iPad Pro 11", w: 834, h: 1194, dpr: 2, touch: true, ua: IPAD_UA },
  { id: "laptop", name: "Laptop (1280x720)", w: 1280, h: 720, dpr: 1, touch: false, ua: "", core: true },
  { id: "desktop", name: "Desktop (1920x1080)", w: 1920, h: 1080, dpr: 1, touch: false, ua: "" }
];
