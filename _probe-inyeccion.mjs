import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
const OUT =
  "C:/Users/PROPIE~1/AppData/Local/Temp/claude/C--PROYECTOS-web-chaqueta/69746c71-9517-4f09-a521-90796f397500/scratchpad";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(
  () => !document.querySelector('div[aria-label="Cargando"]'),
  { timeout: 120000, polling: 200 },
);
await sleep(800);

const ajusteTop = await page.evaluate(() => {
  const el = document.querySelector("#ajuste");
  return el.getBoundingClientRect().top + window.scrollY;
});
let current = 0;
while (Math.abs(current - (ajusteTop - 420)) > 20) {
  current += Math.sign(ajusteTop - 420 - current) * Math.min(850, Math.abs(ajusteTop - 420 - current));
  await page.evaluate((v) => window.scrollTo(0, v), Math.round(current));
  await sleep(90);
}
await sleep(1200);

// inyecta el caso del banco como overlay fixed en la mitad inferior
await page.evaluate(() => {
  const html = `
  <div id="bench" style="position:fixed;left:0;right:0;bottom:40px;z-index:99;background:#e8e5da;padding:10px 0">
    <svg width="0" height="0">
      <filter id="fBench" x="-20%" y="-120%" width="140%" height="340%" color-interpolation-filters="sRGB">
        <feImage href="/sand-noise-edge.png" x="0" y="0" width="512" height="256" result="img"/>
        <feTile in="img" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="24" xChannelSelector="G" yChannelSelector="R"/>
      </filter>
    </svg>
    <svg style="width:1440px;height:112px;display:block;filter:url(#fBench)" viewBox="0 0 1440 120" preserveAspectRatio="none">
      <path d="M0,62L180,30L360,50L540,22L720,54L900,28L1080,46L1260,32L1440,62L1440,110L0,110Z" fill="#14170e"/>
      <path d="M0,62L180,30L360,50L540,22L720,54L900,28L1080,46L1260,32L1440,62" fill="none" stroke="#ff5b1f" stroke-width="2"/>
    </svg>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
});
await sleep(1000);
await page.screenshot({ path: `${OUT}/inyeccion.png` });

// y también: leer el scale real y el nº de filtros con el mismo ID duplicado
const dupes = await page.evaluate(() => {
  const divider = document.querySelector("#ajuste").parentElement.querySelector('div[aria-hidden="true"]');
  const filterId = divider.querySelector("filter")?.id;
  const all = document.querySelectorAll(`filter[id="${filterId}"]`);
  const crest = divider.querySelectorAll("svg")[2];
  return {
    filterId,
    filtrosConMismoId: all.length,
    crestFilter: crest?.style.filter,
    scale: divider.querySelector("feDisplacementMap")?.getAttribute("scale"),
  };
});
console.log(JSON.stringify(dupes, null, 1));

await Promise.race([browser.close(), sleep(4000)]);
process.exit(0);
