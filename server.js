const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

const index = require('./routes/index');
const api = require('./routes/api');

//===== Database Config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/news-scraper';

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use('/', index);
app.use('/api', api);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});