const phantom = require('phantom');
const cheerio = require('cheerio');
const { performance } = require('perf_hooks');
const db = require('../models');

// MSNBC specific helper fns
const modifyMsnbcArticleTitle = (title) => {
  if (!isNaN(title.slice(0,2))) {
    return title.slice(2);
  } else if (!isNaN(title.slice(0,1))) {
    return title.slice(1);
  } else {
    return title;
  }
}
const modifyMsnbcArticleLink = (link) => {
  return link.charAt(0) === '/' ? `https://www.msnbc.com${link}` : link;
}

// CNN specific helper fns
const modifyCnnArticleLink = (link) => {
  return link.charAt(0) === '/' ? `https://www.cnn.com${link}` : link;
}

// Fox News specific helper fns
const modifyFoxNewsArticleLink = (link) => {
  return link.slice(0,2) === '//' ? link.slice(2) : link;
}

// Extract category from link
const extractCategory = (link) => {
  if (link.match(/\/(all-in|mtp-daily|deadline-white-house|the-beat-with-ari-melber|morning-joe|rachel-maddow|the-last-word|brian-williams|politics)\//g)) {
    return 'politics';
  } else if (link.match(/\/(opinions|opinion)\//g)) {
    return 'opinion';
  } else if (link.match(/\/travel\//g)) {
    return 'travel';
  } else if (link.match(/\/(us|us-news)\//g)) {
    return 'US';
  } else if (link.match(/\/(entertainment|pop-culture)\//g)) {
    return 'entertainment';
  } else if (link.match(/\/(technology|tech|tech-news)\//g)) {
    return 'technology';
  } else if (link.match(/(money.cnn|foxbusiness)/g)) {
    return 'business'
  } else if (link.match(/\/health\//g)) {
    return 'health';
  } else if (link.match(/\/(africa|middleeast|americas|asia|europe|australia|world)\//g)) {
    return 'world';
  } else {
    return 'other';
  }
}

// Get MSNBC, CNN, Fox News Articles
async function getMsnbcArticles(instance) {
  const page = await instance.createPage();
  await page.on('onResourceRequested', true, function(requestData, networkRequest) {
    const match = requestData.url.match(/(.gif|.css|.jpg|.png|.svg|.woff|.ttf|.sjs|.js|jetpack|nvcdn)/g);
    if (match) {
      networkRequest.abort();
    } else {
      console.info('Requesting', requestData.url);
    };
  });
 
  const status = await page.open('https://msnbc.com/');
  const content = await page.property('content');

  const $ = cheerio.load(content);
  let msnbcArticles = [];

  // h2... class="title_..." or "mainTitle_..."
  $('h2').each((i, el) => {
    let link, title;

    if ($(el).attr('class').includes('itle_')) {
      if ($(el).children('a').attr('href') !== undefined) {
        link = modifyMsnbcArticleLink($(el).children('a').attr('href'));
      }
      
      title = $(el).children('a').text().trim();
    }

    if (title && link) {
      msnbcArticles.push({
        source: 'MSNBC',
        category: extractCategory(link),
        title: title,
        link: link
      });
    }
    
    
  });

  return msnbcArticles;
}

async function getCnnArticles(instance) {
  const page = await instance.createPage();
  await page.on('onResourceRequested', true, function(requestData, networkRequest) {
    const match = requestData.url.match(/(.gif|.css|.jpg|.png|.svg|.woff|.ttf|.sjs|sharethrough|chartbeat|beemray|bounceexchange|ad.doubleclick|ads|krxd|outbrain|criteo.net|politics-static|facebook|bing|google|summerhamster|smetrics.cnn|gigya|tru.am|secure-us|optimizely|livefyre|usabilla|cookielaw|indexww|data:image)/g);
    if (match) {
      networkRequest.abort();
    } else {
      console.info('Requesting', requestData.url);
    };
  });
  
  const status = await page.open('https://cnn.com/');
  const content = await page.property('content');

  const $ = cheerio.load(content);
  let cnnArticles = [];

  $('span.cd__headline-text').each((i, el) => {
    cnnArticles.push({
      source: 'CNN',
      category: extractCategory($(el).parent().attr('href')),
      title: $(el).text(),
      link: modifyCnnArticleLink($(el).parent().attr('href'))
    });
  });

  return cnnArticles;
}

async function getFoxNewsArticles(instance) {
  const page = await instance.createPage();
  await page.on('onResourceRequested', true, function(requestData, networkRequest) {
    const match = requestData.url.match(/(.gif|.css|.jpg|.png|.svg|.woff|.ttf|.sjs|.js)/g);
    if (match) {
      networkRequest.abort();
    } else {
      console.info('Requesting', requestData.url);
    };
  });
  
  const status = await page.open('https://foxnews.com/');
  const content = await page.property('content');

  const $ = cheerio.load(content);
  let foxnewsArticles = [];

  $('article.article div.info header.info-header h2.title a').each((i, el) => {
    if(!($(el).attr('href').match(/video.foxnews/g))) {
      foxnewsArticles.push({
        source: 'Fox News',
        category: extractCategory($(el).attr('href')),
        title: $(el).text().trim(),
        link: modifyFoxNewsArticleLink($(el).attr('href'))
      });
    }
  });

  return foxnewsArticles;
}

const getAllArticles = (req, res) => {
  (async() => {
    const t0 = performance.now();
    const instance = await phantom.create();
    const msnbcArticles = await getMsnbcArticles(instance);
    const cnnArticles = await getCnnArticles(instance);
    const foxNewsArticles = await getFoxNewsArticles(instance);
    await instance.exit();
    const t1 = performance.now();

    const scrapeRecord = {
      numMsnbcArticles: msnbcArticles.length,
      numCnnArticles: cnnArticles.length,
      numFoxNewsArticles: foxNewsArticles.length,
      executionTime: Math.round((t1-t0)/1000 * 100)/100
    }

    db.ScrapeRecord.create(scrapeRecord).then(record => {
      res.json({
        scrapeRecord: record,
        articles: [...msnbcArticles,...cnnArticles, ...foxNewsArticles]
      });
    }).catch(err => {
      res.json(err);
    });
    
  })();
}

module.exports = {
  getAllArticles
}
