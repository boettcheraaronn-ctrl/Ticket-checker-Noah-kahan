const { chromium } = require("playwright");
const axios = require("axios");

const URL =
  "https://www.ticketmaster.ca/noah-kahan-the-great-divide-tour-vancouver-british-columbia-08-28-2026/event/1100643DA3BF7B99";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegramMessage(text) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.log("Telegram not configured");
    return;
  }

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

  page.setDefaultTimeout(30000);

  page.on("console", (msg) => console.log("BROWSER:", msg.text()));
  page.on("requestfailed", (req) =>
    console.log("FAILED REQUEST:", req.url())
  );

  console.log("Opening page...");

  await page.goto(URL, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  await page.waitForTimeout(5000);

  console.log("Page loaded, checking availability...");

  const pageText = await page.content();

  const unavailableKeywords = [
    "not available",
    "sold out",
    "tickets are not available",
    "onsale has ended",
  ];

  const isSoldOut = unavailableKeywords.some((word) =>
    pageText.toLowerCase().includes(word)
  );

  if (isSoldOut) {
    console.log("❌ Sold out");
  } else {
    console.log("🚨 Possible tickets!");

    await sendTelegramMessage(
      "🚨 Ticket Alert: Possible availability!\n" + URL
    );
  }

  await browser.close();
})();
