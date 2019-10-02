const db = require('../models');

const getRecords = (req, res) => {
  db.ScrapeRecord.find({}).sort({ date: -1}).limit(10).then(records => {
    res.json(records);
  }).catch(err => {
    res.json(err);
  });
}

module.exports = {
  getRecords
}
