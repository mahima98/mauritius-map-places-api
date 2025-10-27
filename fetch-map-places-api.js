// fetch-places.js
import fs from "fs";
import fetch from "node-fetch";

const location = "-20.348404,57.552152"; // Example: Port Louis, Mauritius
const radius = 50000;
const apiKey = process.env.GOOGLE_PLACES_API_KEY; // from GitHub Secrets

// The types you want to fetch — you can add more if needed
const types = ["cafe", "restaurant"];

async function fetchPlaces(type) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&keyword=${type}&key=${apiKey}`;
  console.log(`Fetching ${type}s from Google Places...`);

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results) {
    console.error(`❌ No results for ${type}.`);
    return [];
  }

  return data.results;
}

async function run() {
  let allResults = [];

  for (const type of types) {
    const results = await fetchPlaces(type);
    allResults = allResults.concat(results);
  }

  // Remove potential duplicates by place_id (Google returns same place for both types sometimes)
  const uniqueResults = Array.from(
    new Map(allResults.map((item) => [item.place_id, item])).values()
  );

  const finalData = {
    fetched_at: new Date().toISOString(),
    location,
    radius,
    total_results: uniqueResults.length,
    results: uniqueResults,
  };

  fs.writeFileSync(
    "mauritius-map-places-api.json",
    JSON.stringify(finalData, null, 2)
  );

  console.log(
    `✅ Saved ${uniqueResults.length} places to mauritius-map-places-api.json`
  );
}

run();
