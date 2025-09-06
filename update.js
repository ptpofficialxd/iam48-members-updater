const fs = require("fs");
const axios = require("axios");

const filePath = "members.json";

const updateProfile = async (index) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const perChunk = 10;
    const members = JSON.parse(data)
    const membersArrays = index.trim().split('|')
    .filter(index => members[index]) // Filter out invalid indices
    .map(index => members[index])
    .reduce((all, one, i) => {
      const ch = Math.floor(i / perChunk);
      all[ch] = [].concat(all[ch] || [], one);
      return all;
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
          data_list: membersArray.map((member) => {
            console.log("member:", member?.codeName);
            return {
              id: member?.id,
              code_name: member?.codeName,
              display_name: member?.displayName,
              display_name_en: member?.displayNameEn,
              subtitle: member?.subtitle,
              subtitle_en: member?.subtitleEn,
              profile_image_url: member?.profileImageUrl,
              cover_image_url: member?.coverImageUrl,
              caption: member?.caption,
              formal_display_name: member?.formalDisplayName,
              city: member?.city,
              city_en: member?.cityEn,
              country: member?.country,
              country_en: member?.countryEn,
              brand: member?.brand,
              hashtags: member?.hashtags && JSON.stringify(member.hashtags),
              birthdate: member?.birthdate,
              graduated_at: member?.graduatedAt,
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
        continue;
      }
    }
    const totalUpdate =
      results.reduce((sum, result) => sum + (result?.update || 0), 0);
    const totalCreate =
      results.reduce((sum, result) => sum + (result?.create || 0), 0);
    console.log(`Total update: ${totalUpdate}`);
    console.log(`Total create: ${totalCreate}`);
    console.log('========== Done ==========')
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

const updateSNS = async (groupedKeys) => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const keysLines = groupedKeys.split('|')

    const resultObject = keysLines.reduce((result, line) => {
      const [key, ...indices] = line.split(/\s+/)
      const keyExists = data.some(obj => obj.hasOwnProperty(key))
      if (keyExists) {
        result[key] = (result[key] || []).concat(indices
          .map(index => ({ id: data[index]?.id }))
          .filter(obj => obj.id !== undefined)
        )
      }
      return result
    }, {})

    console.log('Working...')

    await axios.post(process.env.UPDATE_SNS_URL, resultObject, { headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.UPDATE_SNS_KEY,
    }})
    console.log('======== Done ========')

  } catch (err) {
    console.error("Error:", err.message)
    process.exit(1)
  }
}

const arg = process.argv[2]
switch (arg) {
  case 'update_profile':
    console.log('===== Update Profile =====')
    const index = process.argv[3]
    console.log('index:', index)
    updateProfile(index)
    break
  case 'sns_update':
    console.log('===== Update SNS =====')
    const groupedKeys = process.argv[3]
    updateSNS(groupedKeys)
    break
  default:
    console.log('Invalid argument')
    break
}
