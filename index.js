const { chromium } = require("playwright");
const axios = require("axios");

const URL =
  "https://www.ticketmaster.ca/noah-kahan-the-great-divide-tour-vancouver-british-columbia-08-28-2026/event/1100643DA3BF7B99";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegramMessage(text) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) return;

  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text,
    }
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Loading page...");

  await page.goto(URL, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  await page.waitForTimeout(5000);

  const content = (await page.content()).toLowerCase();

  const blockedWords = [
    "sold out",
    "not available",
    "tickets are not available",
    "onsale has ended",
  ];

  const unavailable = blockedWords.some((w) => content.includes(w));

  if (!unavailable) {
    console.log("🚨 POSSIBLE TICKETS");
    await sendTelegramMessage("🚨 Ticket alert!\nCheck: " + URL);
  } else {
    console.log("❌ No tickets");
  }

  await browser.close();
})();
