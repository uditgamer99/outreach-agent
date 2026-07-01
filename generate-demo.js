// STEP 2: Generate a one-page demo website (HTML/CSS/JS in one file)
// for each lead in leads.json, using Groq (llama-3.3-70b-versatile).
// Saves each site to /sites/{business-name}.html

import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

const GROQ_KEY = process.env.GROQ_API_KEY;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateSite(business) {
  const prompt = `Create a complete, single-file HTML landing page for a local business called "${business.name}".
Category: ${business.category}
Address: ${business.address || "N/A"}
Phone: ${business.phone || "N/A"}

Requirements:
- One HTML file, inline CSS in <style>, inline JS if needed in <script>.
- Modern, mobile-responsive design.
- Sections: Hero with business name + tagline, About, Services/Products (invent 3-4 realistic ones for this category), Contact (show phone/address), simple footer.
- Use a clean color palette suited to the category, not generic blue/gray.
- No placeholder text like "Lorem ipsum" — write real, business-appropriate copy.
- Output ONLY the raw HTML code, no markdown fences, no explanation.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  const data = await res.json();
  if (!data.choices || !data.choices[0]) {
    console.error("Groq error for", business.name, JSON.stringify(data));
    return null;
  }

  let html = data.choices[0].message.content.trim();
  // Strip markdown fences if the model added them anyway
  html = html.replace(/^```html?\s*/i, "").replace(/```$/i, "").trim();

  return html;
}

async function run() {
  if (!fs.existsSync("leads.json")) {
    console.error("No leads.json found. Run find-leads.js first.");
    return;
  }

  const leads = JSON.parse(fs.readFileSync("leads.json", "utf-8"));
  if (!fs.existsSync("sites")) fs.mkdirSync("sites");

  for (const lead of leads) {
    console.log(`Generating site for ${lead.name}...`);
    const html = await generateSite(lead);
    if (!html) continue;

    const slug = slugify(lead.name);
    const filePath = `sites/${slug}.html`;
    fs.writeFileSync(filePath, html);
    lead.slug = slug;
    lead.localFile = filePath;
    console.log(`✔ Saved ${filePath}`);

    await new Promise((r) => setTimeout(r, 500));
  }

  fs.writeFileSync("leads.json", JSON.stringify(leads, null, 2));
  console.log("\nDone. leads.json updated with site file paths.");
}

run();
