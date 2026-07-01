// STEP 3: Deploy each generated site to Netlify as its own site,
// using the "zip deploy" method (no CLI, no git needed).
// Updates leads.json with the live URL for each business.

import fetch from "node-fetch";
import fs from "fs";
import archiver from "archiver";
import "dotenv/config";

const NETLIFY_TOKEN = process.env.NETLIFY_API_TOKEN;

// Zips a single HTML file into memory as index.html (Netlify needs an index.html at root)
function zipFile(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    archive.append(fs.createReadStream(filePath), { name: "index.html" });
    archive.finalize();
  });
}

async function createSite(name) {
  const res = await fetch("https://api.netlify.com/api/v1/sites", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NETLIFY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }), // Netlify will auto-suffix if name is taken
  });
  return res.json();
}

async function deployZip(siteId, zipBuffer) {
  const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NETLIFY_TOKEN}`,
      "Content-Type": "application/zip",
    },
    body: zipBuffer,
  });
  return res.json();
}

async function run() {
  if (!fs.existsSync("leads.json")) {
    console.error("No leads.json found. Run find-leads.js and generate-demo.js first.");
    return;
  }

  const leads = JSON.parse(fs.readFileSync("leads.json", "utf-8"));

  for (const lead of leads) {
    if (!lead.localFile) continue; // skip if site wasn't generated

    console.log(`Deploying ${lead.name}...`);

    // Netlify site names: lowercase, alphanumeric + hyphens, must be somewhat unique
    const siteName = `demo-${lead.slug}-${Math.floor(Math.random() * 1000)}`;

    const site = await createSite(siteName);
    if (!site.id) {
      console.error("Failed to create Netlify site for", lead.name, JSON.stringify(site));
      continue;
    }

    const zipBuffer = await zipFile(lead.localFile);
    const deploy = await deployZip(site.id, zipBuffer);

    if (deploy.deploy_ssl_url || site.ssl_url) {
      lead.liveUrl = site.ssl_url || deploy.deploy_ssl_url;
      console.log(`✔ Live at: ${lead.liveUrl}`);
    } else {
      console.error("Deploy failed for", lead.name, JSON.stringify(deploy));
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  fs.writeFileSync("leads.json", JSON.stringify(leads, null, 2));
  console.log("\nDone. leads.json updated with live URLs.");
}

run();
