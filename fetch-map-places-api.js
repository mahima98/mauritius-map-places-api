// fetch-places-new.js
import fs from "fs";
import fetch from "node-fetch";

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const location = { latitude: -20.1654, longitude: 57.4896 };
const radius = 50000;
const types = ["cafe", "restaurant"];

// ✅ Cost optimization: set limits (max 20 per call)
const limitPerType = 20;

if (!apiKey) {
  console.error("❌ GOOGLE_PLACES_API_KEY is missing or undefined");
  process.exit(1);
}

async function fetchPlaces(type) {
  console.log(`Fetching ${type}s from Places API (New)...`);

  const url = "https://places.googleapis.com/v1/places:searchNearby";
  let results = [];
  let pageToken = null;
  let requestCount = 0;
  const maxRequests = 2; // Limit to 2 requests per type to control costs

  do {
    requestCount++;
    const body = {
      includedTypes: [type],     
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: {
          center: location,
          radius: radius
        }
      }
    };

    // Add pageToken to body only if we have one from previous request
    if (pageToken) {
      body.pageToken = pageToken;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.types,places.location,places.currentOpeningHours.openNow,places.plusCode"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ Google API Error:", data.error);
      // If first request fails, return empty; if subsequent request fails, keep what we have
      if (requestCount === 1) return [];
      break;
    }

    if (data.places) {
      results = results.concat(data.places);
    }

    pageToken = data.nextPageToken;

  } while (pageToken && requestCount < maxRequests);



  // Convert format like you already did
  return results.map((p) => ({
    place_id: p.id,
    name: p.displayName?.text || "",
    rating: p.rating || 0,
    user_ratings_total: p.userRatingCount || 0,
    vicinity: p.formattedAddress || "",
    geometry: {
      location: {
        lat: p.location?.latitude || 0,
        lng: p.location?.longitude || 0
      }
    },
    data: [type],
    opening_hours: {
      open_now: p.currentOpeningHours?.openNow || false
    },
    plus_code: {
      compound_code: p.plusCode?.compoundCode || ""
    },
    types: p.types || []
  }));
}

async function run() {
  let allResults = [];

  for (const type of types) {
    const results = await fetchPlaces(type);
    allResults = allResults.concat(results);
  }

  // Remove duplicates by place_id
  const uniqueResults = Array.from(
    new Map(allResults.map((item) => [item.place_id, item])).values()
  );

  const finalData = {
    fetched_at: new Date().toISOString(),
    location,
    radius,
    total_results: uniqueResults.length,
    results: uniqueResults
  };

  fs.writeFileSync(
    "mauritius-map-places-api.json",
    JSON.stringify(finalData, null, 2)
  );

  console.log(`✅ Saved ${uniqueResults.length} places to mauritius-map-places-api-new.json`);
}

run();
