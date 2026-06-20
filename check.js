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
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  // Optional: helps prevent weird hangs on heavy sites like Ticketmaster
  page.setDefaultTimeout(30000);

  // Debug logs (VERY helpful if it hangs)
  page.on("console", (msg) => console.log("BROWSER:", msg.text()));
  page.on("requestfailed", (req) =>
    console.log("FAILED REQUEST:", req.url())
  );

  console.log("Opening page...");

  // ✅ THIS is the important part you were asking about
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  await page.waitForTimeout(5000);

  console.log("Page loaded, checking availability...");

  // ---- TICKET CHECK LOGIC ----
  // This is a SAFE generic example since Ticketmaster changes selectors often

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
    console.log("❌ No tickets found");
  } else {
    console.log("🚨 POSSIBLE TICKETS AVAILABLE!");

    await sendTelegramMessage(
      "🚨 Ticket Alert: Something may be available!\nCheck: " + URL
    );
  }

  await browser.close();
})();
