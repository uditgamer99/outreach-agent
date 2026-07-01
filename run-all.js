// Runs the full pipeline: find leads -> generate sites -> deploy -> draft messages
import { execSync } from "child_process";

const steps = [
  ["find-leads.js", "Finding businesses without websites"],
  ["generate-demo.js", "Generating demo sites"],
  ["deploy-demo.js", "Deploying sites to Netlify"],
  ["generate-message.js", "Drafting outreach messages"],
];

for (const [file, label] of steps) {
  console.log(`\n=== ${label} ===`);
  execSync(`node ${file}`, { stdio: "inherit" });
}

console.log("\nAll done! Open outreach-messages.txt to start sending pitches manually.");
