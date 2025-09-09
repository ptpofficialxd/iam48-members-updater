// update.js - improved style (logic unchanged)

const fs = require("fs");
const axios = require("axios");

const FILE_PATH = "members.json";

/**
 * Update profile by index string (e.g. "1|2|3")
 */
const updateProfile = async (index) => {
  try {
    const data = fs.readFileSync(FILE_PATH, "utf8");
    const members = JSON.parse(data);

    const perChunk = 10;
    // split string -> filter invalid -> map to members -> chunk
    const membersArrays = index
      .trim()
      .split("|")
      .filter((i) => members[i])
      .map((i) => members[i])
      .reduce((chunks, member, i) => {
        const chunkIndex = Math.floor(i / perChunk);
        chunks[chunkIndex] = [].concat(chunks[chunkIndex] || [], member);
        return chunks;
      }, []);

    let results = [];

    for (let idx = 0; idx < membersArrays.length; idx++) {
      console.log(`# ${idx + 1} : START`);

      const membersArray = membersArrays[idx];
      const payload = {
        table: "members",
        method: "upsertMany",
        data: null,
        options: {
          condition_column: "id",
          data_list: membersArray.map((m) => {
            console.log("member:", m?.codeName);
            return {
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
            };
          }),
        },
      };

      const headers = {
        "Content-Type": "application/json",
        "x-api-key": process.env.UPDATE_PROFILE_KEY,
      };

      try {
        const res = await axios.post(process.env.UPDATE_PROFILE_URL, payload, { headers });
        const total = res.data.result?.total;
        console.log(`# ${idx + 1} : ${JSON.stringify(total)}\n`);
        results.push(total);
      } catch (err) {
        console.error("Error:", err.message);
      }
    }

    const totalUpdate = results.reduce((sum, r) => sum + (r?.update || 0), 0);
    const totalCreate = results.reduce((sum, r) => sum + (r?.create || 0), 0);

    console.log(`Total update: ${totalUpdate}`);
    console.log(`Total create: ${totalCreate}`);
    console.log("========== Done ==========");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

/**
 * Update SNS by grouped keys string
 */
const updateSNS = async (groupedKeys) => {
  try {
    const data = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    const keysLines = groupedKeys.split("|");

    const resultObject = keysLines.reduce((result, line) => {
      const [key, ...indices] = line.split(/\s+/);
      const keyExists = data.some((obj) => obj.hasOwnProperty(key));
      if (keyExists) {
        result[key] = (result[key] || []).concat(
          indices
            .map((i) => ({ id: data[i]?.id }))
            .filter((obj) => obj.id !== undefined)
        );
      }
      return result;
    }, {});

    console.log("Working...");

    await axios.post(process.env.UPDATE_SNS_URL, resultObject, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.UPDATE_SNS_KEY,
      },
    });

    console.log("======== Done ========");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

/**
 * CLI entrypoint
 */
const arg = process.argv[2];
switch (arg) {
  case "update_profile": {
    console.log("===== Update Profile =====");
    const index = process.argv[3];
    console.log("index:", index);
    updateProfile(index);
    break;
  }
  case "sns_update": {
    console.log("===== Update SNS =====");
    const groupedKeys = process.argv[3];
    updateSNS(groupedKeys);
    break;
  }
  default:
    console.log("Invalid argument");
    break;
}
