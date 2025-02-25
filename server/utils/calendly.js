const axios = require("axios");

let CALENDLY_ACCESS_TOKEN = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzQwNTA2Mjc5LCJqdGkiOiJmMmY2MDAzOS03ZWZlLTQ3ZjAtYTY0My0zMWI0MzE4ZDgyNmUiLCJhcHBfdWlkIjoiTTVxRTFnNDZPQTk3cHJZeGVmR1BkUU9wNXNlMmE4d0xSZlVtZm9RV2J3NCIsImV4cCI6MTc0MDUxMzQ3OX0.LkTPJWw4XDzBqmDEr7xdvNBBxsY2Px0UgztGqUk9A5Hjz0mBwqJKMEFTIJt2znMudh1QsNKb04EHnnQlOaJkZw"; // Store Token
let tokenExpiry = Date.now() + 7200 * 1000; // Expiry time (2 Hours)

// Function to Get a New Access Token
const getNewAccessToken = async () => {
  try {
    const response = await axios.post("https://auth.calendly.com/oauth/token", new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "YOUR_CLIENT_ID",
      client_secret: "YOUR_CLIENT_SECRET",
    }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    CALENDLY_ACCESS_TOKEN = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    console.log("New Access Token Generated:", CALENDLY_ACCESS_TOKEN);
  } catch (error) {
    console.error("Failed to refresh token:", error.response ? error.response.data : error.message);
  }
};

// Function to Get Valid Token
const getAccessToken = async () => {
  if (Date.now() >= tokenExpiry) {
    await getNewAccessToken();
  }
  return CALENDLY_ACCESS_TOKEN;
};

// Function to Fetch Upcoming Bookings
exports.fetchUpcomingBookings = async () => {
  try {
    const token = await getAccessToken();
    const response = await axios.get("https://api.calendly.com/scheduled_events", {
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json"
      },
    });

    console.log("Calendly API Response:", response.data);
    return response.data.collection || [];
  } catch (error) {
    console.error("Calendly API Error:", error.response ? error.response.data : error.message);
    return [];
  }
};
