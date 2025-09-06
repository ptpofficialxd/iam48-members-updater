const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sortBy = require('lodash/sortBy');

async function fetchJson() {
  const apiUrl = 'https://public.bnk48.io/members/all';

  try {
    const response = await axios.get(apiUrl);
    const jsonData = sortBy(response.data, ['id']);

    const jsonFilePath = path.join(__dirname, 'members.json');

    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

    console.log('Data fetched and JSON file updated successfully.');
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchJson();
