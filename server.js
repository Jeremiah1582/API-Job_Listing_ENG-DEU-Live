const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const PORT = process.env.PORT || 8001;
const { myArray } = require("./myArray");

const articles = [];

app.get("/", (req, res) => {
  res.status(200).json("welcome to my JobListings API");
});

app.get("/listings", async (req, res) => {
  const keyword = "Developer";
  const keyword2 = "Software";
  const keyword3 = "Entwickler";
  const keyword4 = "React";
  myArray.forEach((item) => {
    axios
      .get(`${item.link}`)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        // 1
        $(
          `a:contains(${keyword || keyword2 || keyword3 || keyword4})`,
          html
        ).each(function () {
          //arrow function wont work here

          const title = $(this).text();
          const url = $(this).attr("href");

          articles.push({
            title,
            url: item.base + url,
            source: item.name,
          });
        });
      })
      .catch((err) => {
        console.log("there was an error with you request...", err);
      });
  });
  if (articles !== []) {
    await res.status(200).json(articles);
  }
});

app.listen(PORT, () => {
  console.log("port is running on ", PORT);
});
