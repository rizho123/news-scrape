var axios = require('axios');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var db = require("../models");

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true
})

var mongooseConnection = mongoose.connection;

mongooseConnection.on("error", console.error.bind(console, "Connection Error:"));
mongooseConnection.once("open", function() {
    console.log("Connection Successful!")
})

module.exports = (app) => {
    app.get("/", (req, res) => res.render("index"))

    app.get("/api/search", (req, res) => {
        
        axios.get("https://www.npr.org/sections/news/").then(response => {
            
            console.log("Articles loading...")
            
            var $ = cheerio.load(response.data);

            var handlebarsObject = {
                data: []
            };

            $("article").each((i, element) => {
                var lowResImageLink = $(element).children(".item-image").children(".imagewrap").children("a").children("img").attr("src");

                if (lowResImageLink) {
                    var imageLength = lowResImageLink.length;
                    var highResImage = lowResImageLink.substr(0, imageLength - 11) + "800-c100.jpg";

                    handlebarsObject.data.push({
                        headline: $(element).children(".item-info").children(".title").children("a").text(),
                        summary: $(element).children(".item-info").children(".teaser").children("a").text(),
                        url: $(element).children(".item-info").children(".title").children("a").attr("href"),
                        imageURL: highResImage,
                        slug: $(element).children(".item-info").children(".slug-wrap").children(".slug").children("a").text(),
                        comments: null
                    })
                }
            })

            res.render("index", handlebarsObject);

        })
    })

    app.get("/api/savedArticles", (req,res) => {
        db.Article.find({}).then(function(dbArticle) {
            res.json(dbArticle)
        }).catch(function(err) {
            res.json(err)
        })
    })

    app.post("/api/add", (req, res) => {

        var articleObject = req.body;

        db.Articles.findOne({url: articleObject.url}).then(function(response) {
            if (response === null) {
                db.Articles.create(articleObject).then((response) => console.log(" ")).catch(err => res.json(err))
            }

            res.send("Article saved!")
        }).catch(function(err) {
            res.json(err)
        })
    })

    app.post("/api/deleteArticle", (req,res) => {
        console.log(req.body)
        var sessionArticle = req.body

        db.Articles.findByIdAndRemove(sessionArticle["_id"]).then(response => {
            if (response) {
                res.send("Article deleted!")
            }
        })
    })

    app.post("/api/deleteComment", (req,res) => {
        console.log("Deleting comment...")
        var comment = req.body;

        db.Notes.findByIdAndRemove(comment["_id"]).then(response => {
            if (response) {
                res.send("Comment deleted!")
            }
        })
    })

    app.post("/")
}