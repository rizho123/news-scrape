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
    
}