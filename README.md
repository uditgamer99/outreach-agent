# Local Business Outreach Agent

Finds local businesses with no website → generates a demo site with Groq →
deploys it live on Netlify → drafts a WhatsApp pitch message.
**You send the messages manually** — this keeps things human and avoids WhatsApp bans.

## Pipeline

1. `find-leads.js` — searches Google Places for businesses in your category/area, keeps only ones with no `website` field. Saves to `leads.json`.
2. `generate-demo.js` — for each lead, asks Groq to write a full one-page HTML site. Saves to `/sites`.
3. `deploy-demo.js` — creates a Netlify site per lead and deploys the HTML. Adds the live URL to `leads.json`.
4. `generate-message.js` — asks Groq to draft a short WhatsApp pitch per lead, referencing their live demo. Saves a copy-paste-friendly `outreach-messages.txt`.

Run them one at a time, or all together with:
```
node run-all.js
```

## Setup

### 1. Get your API keys

- **Google Places API key**: console.cloud.google.com → enable "Places API" → create an API key. Free tier gives you plenty for testing (a few hundred searches/month).
- **Groq API key**: you already have this from your other projects.
- **Netlify personal access token**: app.netlify.com → User settings → Applications → New access token.

### 2. Configure

Copy `.env.example` to `.env` and fill in your keys + search settings:
```
GOOGLE_PLACES_API_KEY=...
GROQ_API_KEY=...
NETLIFY_API_TOKEN=...
SEARCH_QUERY=bakery
SEARCH_LOCATION=Dwarka Mor, Delhi
```

### 3. Install & run

Since you're mobile-first, the easiest way to run this is **Replit**:
1. Create a new Node.js Repl.
2. Upload all these files (or connect your GitHub repo — push this folder to `uditgamer99/outreach-agent`).
3. Add your `.env` values in Replit's "Secrets" tab instead of a `.env` file.
4. Open the Shell tab and run:
   ```
   npm install
   node run-all.js
   ```
5. Everything runs in the cloud — no laptop needed.

## Notes

- Netlify site names must be unique — the script appends a random number to avoid clashes.
- Start with `SEARCH_QUERY=bakery` and a small area first — check the output quality before scaling up to more categories.
- `outreach-messages.txt` is designed so you can just scroll on your phone and copy each message into WhatsApp one by one.
- If a business's number isn't on WhatsApp, you'll need to check manually — Places API only gives you the phone number, not WhatsApp status.
