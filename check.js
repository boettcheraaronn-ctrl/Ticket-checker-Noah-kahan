const { chromium } = require("playwright");
const axios = require("axios");

const URL =
  "https://www.ticketmaster.ca/noah-kahan-the-great-divide-tour-vancouver-british-columbia-08-28-2026/event/1100643DA3BF7B99";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendMessage(text) {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text,
    }
  );
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: "networkidle" });

  const content = await page.content();
  const text = await page.innerText("body");

  const hasBuyButton = text.toLowerCase().includes("buy tickets");
  const isSoldOut =
    text.toLowerCase().includes("sold out") ||
    text.toLowerCase().includes("not available");

  console.log("Buy button:", hasBuyButton);
  console.log("Sold out:", isSoldOut);

  // REAL LOGIC
  if (hasBuyButton && !isSoldOut) {
    await sendMessage("🎟 TICKETS MAY BE AVAILABLE — CHECK NOW");
  } else {
    console.log("No availability detected");
  }

  await browser.close();
})();
