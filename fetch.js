const fs = require("fs");
const path = require("path");
const axios = require("axios");

/**
 * API endpoint for fetching member data
 */
const API_URL = "https://public.bnk48.io/members/all";

/**
 * Path to the output JSON file
 */
const OUTPUT_FILE = path.join(__dirname, "members.json");

/**
 * Fetch members from API
 */
async function fetchMembers() {
  const response = await axios.get(API_URL);
  return response.data;
}

/**
 * Sort members by id (numeric-safe)
 */
function sortById(members) {
  return [...members].sort((a, b) => {
    const aId = a.id;
    const bId = b.id;
    if (typeof aId === "number" && typeof bId === "number") {
      return aId - bId;
    }
    return String(aId).localeCompare(String(bId), "en", { numeric: true });
  });
}

/**
 * Save JSON to file (pretty-printed)
 */
function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Entrypoint
 */
(async function main() {
  console.log("[fetch.js] Fetching members...");
  try {
    const members = await fetchMembers();
    const sorted = sortById(members);
    saveJson(OUTPUT_FILE, sorted);
    console.log(
      `[fetch.js] Done. ${sorted.length} members saved to ${OUTPUT_FILE}`
    );
  } catch (error) {
    console.error("[fetch.js] Error:", error.message);
    process.exit(1);
  }
})();
