const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const PORT = process.env.PORT || 8001;
const { myArray } = require("./myArray");

app.get("/", (req, res) => {
  res
    .status(200)
    .json(
      'w€LLLc0mE to my JobListings API. To view the content available add the route " /listings " to the end of the url in the browser'
    );
});

app.get("/listings", async (req, res) => {
  const keywords = ["Developer", "Software", "Frontend", "Frontend Developer", "React", "cloud", "AWS"];
  const articles = [];

  await Promise.all(
    myArray.map((item) =>
      axios
        .get(item.link)
        .then((response) => {
          const html = response.data;
          const $ = cheerio.load(html);

          keywords.forEach((keyword) => {
            $(`a:contains(${keyword})`, html).each(function () {
              const title = $(this).text();
              const url = $(this).attr("href");

              articles.push({
                title,
                url: item.base + url,
                source: item.name,
              });
            });
          });
        })
        .catch((err) => {
          console.log("there was an error with your request...", err);
        })
    )
  );

  res.status(200).json(articles);
});

app.get("/listings/:paramsId", (req, res) => {
  const paramsId = req.params.paramsId;
  const arrayItem = myArray.find((item) => item.name === paramsId);
  const baseLink = arrayItem.base;
  const specificArticle = [];

  axios
    .get(arrayItem.address)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      keywords.forEach((keyword) => {
        $(`a:contains(${keyword})`, html).each(function () {
          const title = $(this).text();
          const url = $(this).attr("href");

          specificArticle.push({
            title,
            url: baseLink + url,
            source: arrayItem.name,
          });
        });
      });

      res.status(200).json(specificArticle);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "There was an error with your request" });
    });
});

app.listen(PORT, () => {
  console.log("port is running on ", PORT);
});
