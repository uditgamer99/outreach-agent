// STEP 4: Draft a short, personalized WhatsApp pitch message for each lead
// using Groq. YOU still send these manually — this just writes the draft.

import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

const GROQ_KEY = process.env.GROQ_API_KEY;

async function generateMessage(lead) {
  const prompt = `Write a short, friendly WhatsApp message (under 60 words) from a freelance web developer to a local business owner.

Business name: ${lead.name}
Category: ${lead.category}
Their live demo website link: ${lead.liveUrl}

The message should:
- Open casually, not salesy
- Mention I noticed their business doesn't have a website
- Say I built them a free demo (include the link)
- Ask if they'd like to chat over text about getting it live for their business
- No emojis, no corporate tone, sound like a real person texting
- Output ONLY the message text, nothing else`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 200,
    }),
  });

  const data = await res.json();
  if (!data.choices || !data.choices[0]) return null;
  return data.choices[0].message.content.trim();
}

async function run() {
  if (!fs.existsSync("leads.json")) {
    console.error("No leads.json found. Run the previous steps first.");
    return;
  }

  const leads = JSON.parse(fs.readFileSync("leads.json", "utf-8"));

  for (const lead of leads) {
    if (!lead.liveUrl) continue; // skip if not deployed

    console.log(`Drafting message for ${lead.name}...`);
    const message = await generateMessage(lead);
    if (message) {
      lead.pitchMessage = message;
      console.log(`✔ Draft ready`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  fs.writeFileSync("leads.json", JSON.stringify(leads, null, 2));

  // Also write a plain, easy-to-read text file for quick copy-paste on mobile
  let txt = "";
  for (const lead of leads) {
    if (!lead.pitchMessage) continue;
    txt += `--- ${lead.name} ---\n`;
    txt += `Phone: ${lead.phone || "N/A"}\n`;
    txt += `Demo: ${lead.liveUrl}\n`;
    txt += `Message:\n${lead.pitchMessage}\n\n`;
  }
  fs.writeFileSync("outreach-messages.txt", txt);

  console.log("\nDone. Check outreach-messages.txt for easy copy-paste on mobile.");
}

run();
