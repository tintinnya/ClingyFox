// ==== CONFIG (edit these) =========================================
const FULL_MEDIA_URL  = "https://sub.domain.co/L1/L2/L3/L4/file.mp3";
const CLINGY_DIR      = "saved_files"; // this means saved_files is a Download folder
const LEVEL           = 4; // starts with 1, not 0
// ==================================================================
const seed            = new URL(FULL_MEDIA_URL);
const segments        = seed.pathname.split('/').filter(Boolean);
const INSCOPE_URL     = `${seed.origin}/${segments.slice(0, LEVEL - 1).join('/')}/`; // https://sub.domain.co/L1/L2/L3/
const ORIGIN          = `${seed.protocol}//${seed.host}`;          // https://sub.domain.co
const INSCOPE_PATH    = `/${segments.slice(0, LEVEL - 1).join('/')}/`; // /L1/L2/L3/
const ALLOWED_EXT     = /\.(jpe?g|png|mp3|mp4)(?:$|\?)/i;

let isActive = false;
let downloadedUrls = new Set();
let isDebug = true;

function sanitize(name) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").replace(/\s+/g, " ").trim();
}

const webRequestHandler = async (details) => {
  const u = new URL(details.url);
  console.log(`[ I] ClingyFox: URL found ${u}`);
  if (!isActive || details.statusCode < 200 || details.statusCode > 208) {
    if (isDebug) console.log(`[E1]    ClingyFox: statusCode ${details.statusCode}.`);
    return;
  }
  if (isDebug) console.log(`[ I]    ClingyFox: [${details.statusCode}] ${u}`);

  if (`${u.protocol}//${u.host}` !== ORIGIN) {
    if (isDebug) console.log(`[E2]    ClingyFox: ${u} !== ${ORIGIN}.`);
    return;
  };
  if (isDebug) console.log(`[ I]    ClingyFox: ${u} matches with target ${ORIGIN}`);

  if (!u.pathname.startsWith(INSCOPE_PATH)) {
    if (isDebug) console.log(`[E3]    ClingyFox: ${u.pathname} is not started with ${INSCOPE_PATH}.`);
    return;
  };
  if (isDebug) console.log(`[ I]    ClingyFox: ${u.pathname} starts with path prefix ${INSCOPE_PATH}`);

  if (!ALLOWED_EXT.test(u.pathname)) {
    if (isDebug) console.log(`[E4]    ClingyFox: ${u.pathname} is not ${ALLOWED_EXT}.`);
    return;
  };
  if (isDebug) console.log(`[ I]    ClingyFox: ${u} contains target extensions ${ALLOWED_EXT}`);

  if (downloadedUrls.has(u.href)) {
    if (isDebug) console.log(`[E5]    ClingyFox: downloadedUrls already has the ${u.href}.`);
    return;
  };
  downloadedUrls.add(u.href);

  const ts  = new Date().toISOString().replace(/[:.]/g, "_");
  const paths        = u.pathname.split('/').filter(Boolean);
  const raw = (paths.pop() || "file").split("?")[0];
  const FILENAME_PREFIX = paths[LEVEL - 1];
  const filename = `${CLINGY_DIR}/${FILENAME_PREFIX}-${ts}-${sanitize(raw)}`;

  console.log(`[ I] ClingyFox: [${details.statusCode}] downloading ${u.href} → ${filename}`);

  try {
    await browser.downloads.download({
      url: u.href,
      filename,                 // relative to default Downloads dir
      conflictAction: "uniquify",
      saveAs: false             // don't prompt (subject to user pref)
    });
  } catch (e) {
    console.error("[E9]    ClingyFox download failed:", e);
  }
};

function enable() {
  if (isActive) return;
  browser.webRequest.onCompleted.addListener(
    webRequestHandler,
    { urls: ["<all_urls>"] },   // wide listen; we filter by ORIGIN+INSCOPE_URL
    ["responseHeaders"]
  );
  isActive = true;
  notify(`ClingyFox ENABLED\nScope: ${INSCOPE_URL}\nTypes: ${ALLOWED_EXT}`);
  console.log(`[ I] ClingyFox enabled. Scope: ${INSCOPE_URL}`);
}

function disable() {
  if (!isActive) return;
  if (browser.webRequest.onCompleted.hasListener(webRequestHandler)) {
    browser.webRequest.onCompleted.removeListener(webRequestHandler);
  }
  isActive = false;
  downloadedUrls.clear();
  notify("ClingyFox DISABLED");
  console.log("[ I] ClingyFox disabled.");
}

browser.commands.onCommand.addListener((command) => {
  if (command === "toggle-clingy") isActive ? disable() : enable();
});

function notify(message) {
  try {
    browser.notifications.create({
      type: "basic",
      title: "ClingyFox",
      message,
      iconUrl: browser.runtime.getURL("icon96.png")
    });
  } catch (_) {}
}

console.log(`[ I] ClingyFox loaded and isActive = ${isActive}. Press hotkey to toggle.`);
