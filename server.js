const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const PORT = process.env.PORT || 8001;
const { myArray } = require("./myArray");

const articles = [];
const specificArticle = [];

app.get("/", (req, res) => {
  res.status(200).json("welcome to my JobListings API");
});
// this is your first scraping tool-complete

app.get("/listings", async (req, res) => {
  const keyword = "Developer";
  const keyword2 = "Software";
  const keyword3 = "Frontend";
  const keyword4 = "React";
  const keyword5 = "cloud";
  const keyword6 = "AWS";
  

  myArray.forEach((item) => {
    axios
      .get(`${item.link}`)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        // 1
        $(`a:contains(${keyword || keyword2 || keyword3 || keyword4 || keyword5 || keyword6})`,html).each(function () { //arrow function wont work here
         
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
app.get("/listings/:paramsId", (req, res) => {
  const paramsId = req.params.paramsId;
  const arrayItem = myArray.filter((item) => item.name == paramsId)[0];
  const baseLink = myArray.filter((item) => item.name == paramsId)[0].base;

  axios
    .get(arrayItem.address)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(`a:contains(${keyword})`, html).each(function () {
        const title = $(this).text();
        const url = $(this).attr("href");
        specificArticle.push({
          title,
          url: baseLink + url,
          source: arrayItem.name,
        });
      });
      res.status(200).json(specificArticle);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(PORT, () => {
  console.log("port is running on ", PORT);
});
