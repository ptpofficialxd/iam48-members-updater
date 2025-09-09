// update.js - improved & cleaner version

const fs = require("fs");
const axios = require("axios");

const FILE_PATH = "members.json";

/**
 * Utilities
 */
const readMembers = () => JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));

const chunkArray = (arr, size) =>
  arr.reduce((chunks, item, i) => {
    const idx = Math.floor(i / size);
    chunks[idx] = [].concat(chunks[idx] || [], item);
    return chunks;
  }, []);

/**
 * Build payload for profile update
 */
const buildPayload = (membersArray) => ({
  table: "members",
  method: "upsertMany",
  data: null,
  options: {
    condition_column: "id",
    data_list: membersArray.map((m) => ({
      id: m?.id,
      code_name: m?.codeName,
      display_name: m?.displayName,
      display_name_en: m?.displayNameEn,
      subtitle: m?.subtitle,
      subtitle_en: m?.subtitleEn,
      profile_image_url: m?.profileImageUrl,
      cover_image_url: m?.coverImageUrl,
      caption: m?.caption,
      formal_display_name: m?.formalDisplayName,
      city: m?.city,
      city_en: m?.cityEn,
      country: m?.country,
      country_en: m?.countryEn,
      brand: m?.brand,
      hashtags: m?.hashtags && JSON.stringify(m.hashtags),
      birthdate: m?.birthdate,
      graduated_at: m?.graduatedAt,
    })),
  },
});

/**
 * Update profile by index string (e.g. "1|2|3")
 */
async function updateProfile(indexStr) {
  try {
    const members = readMembers();
    const indices = indexStr
      .trim()
      .split("|")
      .filter((i) => members[i]);

    const perChunk = 10;
    const memberChunks = chunkArray(indices.map((i) => members[i]), perChunk);

    let results = [];

    for (let i = 0; i < memberChunks.length; i++) {
      console.log(`[update.js] #${i + 1} : START`);

      const payload = buildPayload(memberChunks[i]);
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": process.env.UPDATE_PROFILE_KEY,
      };

      try {
        const res = await axios.post(process.env.UPDATE_PROFILE_URL, payload, { headers });
        const total = res.data.result?.total;
        console.log(`[update.js] #${i + 1} result: ${JSON.stringify(total)}`);
        results.push(total);
      } catch (err) {
        console.error("[update.js] Error:", err.message);
      }
    }

    const totalUpdate = results.reduce((sum, r) => sum + (r?.update || 0), 0);
    const totalCreate = results.reduce((sum, r) => sum + (r?.create || 0), 0);

    console.log(`[update.js] Total update: ${totalUpdate}`);
    console.log(`[update.js] Total create: ${totalCreate}`);
    console.log("[update.js] ===== Done =====");
  } catch (err) {
    console.error("[update.js] Error:", err.message);
    process.exit(1);
  }
}

/**
 * Update SNS by grouped keys string (e.g. "twitter 0 1|instagram 2 3")
 */
async function updateSNS(groupedKeys) {
  try {
    const data = readMembers();
    const keysLines = groupedKeys.split("|");

    const resultObject = keysLines.reduce((result, line) => {
      const [key, ...indices] = line.trim().split(/\s+/);
      const keyExists = data.some((obj) => Object.prototype.hasOwnProperty.call(obj, key));
      if (keyExists) {
        result[key] = (result[key] || []).concat(
          indices
            .map((i) => ({ id: data[i]?.id }))
            .filter((obj) => obj.id !== undefined)
        );
      }
      return result;
    }, {});

    console.log("[update.js] Updating SNS...");

    await axios.post(process.env.UPDATE_SNS_URL, resultObject, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.UPDATE_SNS_KEY,
      },
    });

    console.log("[update.js] ===== SNS Done =====");
  } catch (err) {
    console.error("[update.js] Error:", err.message);
    process.exit(1);
  }
}

/**
 * CLI Entrypoint
 */
(async function main() {
  const cmd = process.argv[2];
  switch (cmd) {
    case "update_profile": {
      const index = process.argv[3] || "";
      console.log("[update.js] ===== Update Profile =====");
      await updateProfile(index);
      break;
    }
    case "sns_update": {
      const groupedKeys = process.argv[3] || "";
      console.log("[update.js] ===== Update SNS =====");
      await updateSNS(groupedKeys);
      break;
    }
    default:
      console.log("Usage:");
      console.log("  node update.js update_profile \"1|2|3\"");
      console.log("  node update.js sns_update \"twitter 0 1|instagram 2 3\"");
  }
})();
