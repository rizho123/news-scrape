//===== Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');

//===== App
const app = express();
const PORT = process.env.PORT || 3001;

//===== Load Routes
const index = require('./routes/index');
const api = require('./routes/api');

//===== Database Config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/news-scraper';

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

//===== Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

//===== Handlebars
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

//===== Use Routes
app.use('/', index);
app.use('/api', api);

//===== Listen
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});