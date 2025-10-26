// fetch-cafes.js
import fs from "fs";
import fetch from "node-fetch";

const location = "-20.348404,57.552152"; // Example: Port Louis, Mauritius
const radius = 5000;
const type = "cafe";
const keyword = "cafe";
const apiKey = process.env.GOOGLE_PLACES_API_KEY; // we’ll pass this from GitHub Secrets later

const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&keyword=${keyword}&key=${apiKey}`;

async function fetchTopCafes() {
  console.log("Fetching cafes from Google Places...");

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results) {
    console.error("Error: no results returned.");
    console.error(data);
    return;
  }

  const sorted = data.results
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 20);

  // Only keep useful fields
  const cleanData = sorted.map((cafe) => ({
    name: cafe.name,
    rating: cafe.rating,
    address: cafe.vicinity,
    location: cafe.geometry.location,
    total_ratings: cafe.user_ratings_total,
  }));

  fs.writeFileSync("cafes.json", JSON.stringify(cleanData, null, 2));
  console.log("✅ cafés data saved to cafes.json");
}

fetchTopCafes();
