var axios = require('axios');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var db = require("../models");

mongoose.Promise = Promise;
mongoose.connect("mongodb://heroku_8l6pnsrr:js72uqfi8v4ji0hffu63n9u4kr@ds229108.mlab.com:29108/heroku_8l6pnsrr", {
    useNewUrlParser: true
})

var mongooseConnection = mongoose.connection;

mongooseConnection.on("error", console.error.bind(console, "Connection Error:"));
mongooseConnection.once("open", function() {
    console.log("Connection Successful!")
})

module.exports = (app) => {
    
}