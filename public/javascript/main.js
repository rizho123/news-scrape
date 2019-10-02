const App = (() => {
  const data = {
    scrapeRecord: null,
    articles: null,
    saved: null
  }

  const init = () => {
    $('.tabs').tabs(); // Materialize tabs init
    $('.collapsible').collapsible(); // Materialize collapsible init
    $('.modal').modal(); // Materialize modal init
    
    $.get({ // Scrape Data
      url: '/api/scrape'
    }).then(result => {
      data.scrapeRecord = result.scrapeRecord;
      data.articles = result.articles;
      Render.removeLoader();
      Render.showAlert(JSON.stringify(data.scrapeRecord, undefined, 2));
      Render.showFilterSettings();
      Render.showArticlesTable('#articles-tab', data.articles, {class: 'save-article', text: 'Save'});
    });

    // 'Articles' Tab
    $(document).on('click', '.save-article', function(e) {
      e.preventDefault();

      const newArticle = {
        source: $(this).parent().parent().find('td:eq(2)').text(),
        category: $(this).parent().parent().find('td:eq(1)').text(),
        title: $(this).parent().find('a:eq(0)').text(),
        link: $(this).parent().find('a').attr('href')
      };

      $.post({
        url: '/api/articles',
        data: newArticle
      }).then(result => {
        data.articles = data.articles.filter((article) => article.title !== newArticle.title);
        $(this).parent().parent().remove();
        Render.showAlert(JSON.stringify(result, undefined, 2));
      });
    });

    $('#articles-tab input[type="checkbox"]').on('change', () => {
      let sources = [];
      let categories = [];

      $('#articles-tab .source-filter input[type="checkbox"]:checked').each(function(){
        sources.push($(this).val()); 
      });
      $('#articles-tab .category-filter input[type="checkbox"]:checked').each(function(){
        categories.push($(this).val()); 
      });

      const filtered = data.articles.filter((article) => sources.includes(article.source) && categories.includes(article.category));
      Render.showArticlesTable('#articles-tab', filtered, {class: 'save-article', text: 'Save'});

    });

    // 'Saved' Tab
    $('#tabs-nav ul li:eq(2)').on('click', () => {
      $.get({
        url: '/api/articles'
      }).then(result => {
        data.saved = result;
        Render.showArticlesTable('#saved-tab', result, {class: 'view-comments', text: 'View Comments'});
      });
    });
    
    $('#saved-tab input[type="checkbox"]').on('change', () => {
      let sources = [];
      let categories = [];

      $('#saved-tab .source-filter input[type="checkbox"]:checked').each(function(){
        sources.push($(this).val()); 
      });
      $('#saved-tab .category-filter input[type="checkbox"]:checked').each(function(){
        categories.push($(this).val()); 
      });

      const filtered = data.saved.filter((article) => sources.includes(article.source) && categories.includes(article.category));
      Render.showArticlesTable('#saved-tab', filtered, {class: 'view-comments', text: 'View Comments'});
    });

    $(document).on('click', '.view-comments', function(e) {
      e.preventDefault();

      $.get({
        url: `/api/articles/${$(this).attr('data-id')}`
      }).then(article => {
        Render.showCommentsTable(article.comments, article._id);
      });

      const article = {
        id: $(this).attr('data-id'),
        date: $(this).attr('data-date'),
        source: $(this).parent().parent().find('td:eq(2)').text(),
        category: $(this).parent().parent().find('td:eq(1)').text(),
        title: $(this).parent().find('a:eq(0)').text(),
        link: $(this).parent().find('a:eq(0)').attr('href')
      }

      $('#articleModal h5').html(`<a href="${article.link}" target="_blank">${article.title}</a>`);
      $('#articleModal #articleInfo').html(`
        <div>
          <span class="custom-badge blue lighten-1 white-text">${article.category}</span> <span class="custom-badge cyan lighten-1 white-text">${article.source}</span>
          <span class="custom-badge red lighten-2 white-text">
            ${moment.utc(article.date).local().format('MMM D, YYYY')}
          </span>
        </div>
        <div class="right-align">
          <a href="" data-id="${article.id}" class="delete-article">delete article
        </div>`);
      $('#articleModal #addCommentBtn').attr('data-id', $(this).attr('data-id'));

      $('#articleModal').modal('open');
    });

    $(document).on('click', '.delete-article', function(e) {
      e.preventDefault();

      $.ajax({
        url: `/api/articles/${$(this).attr('data-id')}`,
        method: 'DELETE'
      }).then(deleted => {
        data.saved = data.saved.filter(article => article._id !== deleted._id);
        $(`.view-comments[data-id="${$(this).attr('data-id')}"]`).parent().parent().remove();
        $('#articleModal').modal('close');
      });
    });

    $(document).on('click', '.delete-comment', function(e) {
      e.preventDefault();

      $.ajax({
        url: `/api/articles/${$(this).attr('data-articleId')}/comments/${$(this).attr('data-id')}`,
        method: 'DELETE'
      }).then(result => {
        $(this).parent().parent().remove();
      });
    });

    $('#addCommentForm').submit(function(e) {
      e.preventDefault();
      
      $.post({
        url: `/api/articles/${$('#addCommentBtn').attr('data-id')}/comments`,
        data: {content: $('#commentContent').val()}
      }).then(result => {
        Render.showNewComment(result[0], result[1]._id); // comment, articleId
      });
    });

    // Scrape Tab
    $('#tabs-nav ul li:eq(3)').on('click', () => {
      $.get({
        url: '/api/scraperecords'
      }).then(result => {
        Render.showRecordsTable(result);
      });
    });
  }

  return {
    init
  }
})();

const Render = (() => {
  const removeLoader = () => {
    $('.loader-container').remove();
    $('#articles-tab .tab-content').removeClass('valign-wrapper');
  }

  const showAlert = (msg) => {
    $('.alert').text(msg);
    $('.alert').css('display', 'block');
    setTimeout(() => {
      $('.alert').css('display', 'none');
    }, 15000);
  }

  const showFilterSettings = () => {
    $('#articles-tab .filter-settings').css('display', 'block');
  }

  const showArticlesTable = (tabSelector, articles, linkOpts) => {
    $(`${tabSelector} table.articles-table tbody`).empty();
    $(`${tabSelector} table.articles-table`).css('display', 'table');
    for (const article of articles) {
      const $tdTitle = $('<td>', { 
        html: `
          <a href='${article.link}' target='_blank'>${article.title}</a>
          <a href='' 
            ${article._id ? `data-id="${article._id}"` : ''}
            ${article.dateScraped ? `data-date="${article.dateScraped}"` : ''}  
            class="${linkOpts.class}">[${linkOpts.text}]</a>`

      });
      const $tdCategory = $('<td>', {text: article.category});
      const $tdSource = $('<td>', {text: article.source});
      const $tr = $('<tr>').append($tdTitle, $tdCategory, $tdSource);

      $(`${tabSelector} table.articles-table tbody`).append($tr);
    };
  }

  const showCommentsTable = (comments, articleId) => {
    $('#articleComments tbody').empty();
    for (const comment of comments) {
      const $tdContent = $('<td>', {text: comment.content});
      const $tdDate = $('<td>', {
        text: moment.utc(comment.dateCreated).local().format('M/D/YY h:mm a')
      });
      const $tdDelete = $('<td>', {
        html: `<a href="" data-articleId="${articleId}" data-id="${comment._id}" class="delete-comment">delete</a>`
      });
      const $tr = $('<tr>').append($tdContent, $tdDate, $tdDelete);

      $('#articleComments tbody').prepend($tr); // most recent comment at top
    }
  }

  const showNewComment = (comment, articleId) => {
    const $tdContent = $('<td>', {text: comment.content});
    const $tdDate = $('<td>', {
      text: moment.utc(comment.dateCreated).local().format('M/D/YY h:mm a')
    });
    const $tdDelete = $('<td>', {
      html: `<a href="" data-articleId="${articleId}" data-id="${comment._id}" class="delete-comment">delete</a>`
    });
    const $tr = $('<tr>').append($tdContent, $tdDate, $tdDelete);

    $('#articleComments tbody').prepend($tr);
    $('#commentContent').val('');
  }

  const showRecordsTable = records => {
    $('#scrapeRecordsTable tbody').empty();

    for (const record of records) {
      const $tdDate = $('<td>', {
        text: moment.utc(record.date).local().format('M/D/YY H:mm')
      });
      const $tdExecTime =  $('<td>', {text: record.executionTime});
      const $tdMsnbc = $('<td>', {text: record.numMsnbcArticles});
      const $tdCnn = $('<td>', {text: record.numCnnArticles});
      const $tdFoxNews = $('<td>', {text: record.numFoxNewsArticles});
      const $tr = $('<tr>').append($tdDate, $tdExecTime, $tdMsnbc, $tdCnn, $tdFoxNews);
  
      $('#scrapeRecordsTable tbody').append($tr);
    }
  }

  return {
    removeLoader,
    showAlert,
    showFilterSettings,
    showArticlesTable,
    showCommentsTable,
    showNewComment,
    showRecordsTable
  }
})();

$(document).ready(() => {
  App.init();  
});