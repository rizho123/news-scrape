const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScrapeRecordSchema = new Schema({
  numMsnbcArticles: Number,
  numCnnArticles: Number,
  numFoxNewsArticles: Number,
  executionTime: Number,
  date:{ 
    type: Date,
    default: Date.now
  }
});

const ScrapeRecord = mongoose.model('ScrapeRecord', ScrapeRecordSchema);

module.exports = ScrapeRecord;