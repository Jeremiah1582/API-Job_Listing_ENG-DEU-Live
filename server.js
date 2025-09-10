const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const PORT = process.env.PORT || 8001;
const { myArray } = require("./myArray");

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res
    .status(200)
    .json(
      'w€LLLc0mE to my JobListings API. To view the content available add the route " /listings " to the end of the url in the browser: note that the Serveless function may time out on the Vercel Free tier. For reliable results, run locally.'
    );
});

// --------------------------------------------------------------------------------
const DEFAULT_KEYWORDS = [
  "Developer",
  "Software",
  "Frontend",
  "Frontend Developer",
  "React",
  "Cloud",
  "AWS",
];

app.get("/listings", async (req, res) => {
  try {
    const { q, site, limit } = req.query;
    const keywords = Array.isArray(q)
      ? q
      : typeof q === "string" && q.trim().length > 0
      ? q.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_KEYWORDS;

    const selectedSites = typeof site === "string" && site.trim().length > 0
      ? myArray.filter((s) => s.name.toLowerCase() === site.toLowerCase())
      : myArray;

    const maxPerSite = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 5;

    const articles = await scrapeWeb(keywords, selectedSites, { maxPerSite });
    res.status(200).json(articles);
  } catch (error) {
    console.error("/listings failed", error);
    res.status(500).json({ error: "Failed to scrape listings" });
  }
});


const scrapeWeb = async (keywords, sites = myArray, options = {}) => {
  const { maxPerSite = 5, requestTimeoutMs = 15000 } = options;
  const results = [];

  // Deduplicate globally by normalized URL
  const globalSeenUrls = new Set();

  await Promise.allSettled(
    sites.map(async (site) => {
      try {
        const response = await axios.get(site.link, {
          timeout: requestTimeoutMs,
          headers: {
            // Basic UA to reduce chance of 403 by some sites
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          },
          // Follow redirects by default
          maxRedirects: 5,
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const perSiteSeen = new Set();
        const anchors = $("a").toArray();
        let collected = 0;

        for (const element of anchors) {
          if (collected >= maxPerSite) break;
          const title = $(element).text().trim();
          if (!title) continue;
          const lower = title.toLowerCase();
          const matches = keywords.some((k) => lower.includes(String(k).toLowerCase()));
          if (!matches) continue;

          const href = $(element).attr("href");
          if (!href) continue;

          const absoluteUrl = toAbsoluteUrl(href, site.base || site.link);
          if (!absoluteUrl) continue;

          // De-dupe by URL
          if (perSiteSeen.has(absoluteUrl) || globalSeenUrls.has(absoluteUrl)) continue;
          perSiteSeen.add(absoluteUrl);
          globalSeenUrls.add(absoluteUrl);

          results.push({
            title,
            url: absoluteUrl,
            source: site.name,
          });

          collected += 1;
        }
      } catch (err) {
        console.warn(`Request failed for ${site.name}:`, err.message || err);
      }
    })
  );

  return results;
};

function toAbsoluteUrl(href, baseUrl) {
  try {
    // Handles absolute and relative hrefs; if baseUrl is empty, this will throw
    const absolute = new URL(href, baseUrl || undefined);
    return absolute.toString();
  } catch (_) {
    return null;
  }
}




// -------------------------------------------------------------

app.get("/listings/:paramsId", async (req, res) => {
  try {
    const paramsId = String(req.params.paramsId || "").toLowerCase();
    const arrayItem = myArray.find((item) => item.name.toLowerCase() === paramsId);
    if (!arrayItem) {
      return res.status(404).json({ error: `Unknown site id: ${req.params.paramsId}` });
    }

    const { q, limit } = req.query;
    const keywords = Array.isArray(q)
      ? q
      : typeof q === "string" && q.trim().length > 0
      ? q.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_KEYWORDS;

    const maxPerSite = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;

    const specificArticles = await scrapeWeb(keywords, [arrayItem], { maxPerSite });
    res.status(200).json(specificArticles);
  } catch (err) {
    console.error("/listings/:paramsId failed", err);
    res.status(500).json({ error: "Failed to scrape the specified site" });
  }
});

// Health check
app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true });
});

// Start server only when running locally; export app for serverless (e.g., Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log("port is running on ", PORT);
  });
}

module.exports = app;
