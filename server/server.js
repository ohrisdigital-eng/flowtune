const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve the FlowTune website
app.use(express.static(path.join(__dirname, "..")));

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

// YouTube search API
app.get("/api/youtube-search", async (req, res) => {
    try {
        const query = String(req.query.q || "").trim();

        if (!query) {
            return res.status(400).json({
                error: "Missing search query."
            });
        }

        if (!process.env.YOUTUBE_API_KEY) {
            return res.status(500).json({
                error: "YOUTUBE_API_KEY is missing from .env"
            });
        }

        const youtubeURL =
            "https://www.googleapis.com/youtube/v3/search" +
            "?part=snippet" +
            "&q=" + encodeURIComponent(query) +
            "&type=video" +
            "&videoCategoryId=10" +
            "&videoEmbeddable=true" +
            "&videoSyndicated=true" +
            "&maxResults=10" +
            "&regionCode=IN" +
            "&key=" + encodeURIComponent(process.env.YOUTUBE_API_KEY);

        const response = await fetch(youtubeURL);
        const data = await response.json();

        if (!response.ok) {
            console.error("YouTube API error:", data);

            return res.status(response.status).json({
                error: data.error?.message || "YouTube search failed."
            });
        }

        res.json(data);

    } catch (error) {
        console.error("Server error:", error);

        res.status(500).json({
            error: "Internal server error."
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`FlowTune server running on port ${PORT}`);
});