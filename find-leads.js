// STEP 1: Find local businesses that DON'T have a website.
// Uses Google Places API (Text Search + Place Details).
// Saves results to leads.json

import fetch from "node-fetch";
import fs from "fs";
import "dotenv/config";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const QUERY = process.env.SEARCH_QUERY || "bakery";
const LOCATION = process.env.SEARCH_LOCATION || "Dwarka Mor, Delhi";

async function textSearch() {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    QUERY + " in " + LOCATION
  )}&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") {
    console.error("Places search failed:", data.status, data.error_message || "");
    return [];
  }

  return data.results;
}

async function getDetails(placeId) {
  const fields = "name,formatted_phone_number,international_phone_number,website,formatted_address,url";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") return null;
  return data.result;
}

async function run() {
  console.log(`Searching for "${QUERY}" in "${LOCATION}"...`);

  const results = await textSearch();
  console.log(`Found ${results.length} businesses. Checking which ones lack a website...`);

  const leads = [];

  for (const place of results) {
    const details = await getDetails(place.place_id);
    if (!details) continue;

    // No website field = lead (business has no site)
    if (!details.website) {
      leads.push({
        name: details.name,
        phone: details.formatted_phone_number || details.international_phone_number || null,
        address: details.formatted_address || null,
        placeId: place.place_id,
        category: QUERY,
      });
      console.log(`✔ Lead found: ${details.name} (no website)`);
    }

    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync("leads.json", JSON.stringify(leads, null, 2));
  console.log(`\nDone. ${leads.length} leads saved to leads.json`);
}

run();
