const axios = require("axios");

const CALENDLY_API_TOKEN = "eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzM3MDc3Nzc0LCJqdGkiOiJjNDg4NzI0My02N2ZiLTRlM2MtOTY1ZS02NDY5YWJlZjdjYjQiLCJ1c2VyX3V1aWQiOiJCRkZEQ1ZMSk1TT0RLRDdXIn0.Wn6eXaN2KGNvi_QeSdKu8gnPTvD-Ew-rNtG1xISQpYapFQS83DPVddOit2_k2fLkHXHTfLY-PQLrr1IUSZnXmg";

exports.fetchUpcomingBookings = async () => {
  try {
    const response = await axios.get("https://api.calendly.com/scheduled_events", {
      headers: { Authorization: `Bearer ${CALENDLY_API_TOKEN}` },
    });
    return response.data.collection;
  } catch (error) {
    console.error("Calendly API Error:", error);
    return [];
  }
};
