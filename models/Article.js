const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Comment = require('./Comment');

const ArticleSchema = new Schema({
  source: String,
  category: String,
  title: String,
  link: String,
  dateScraped: { 
    type: Date,
    default: Date.now
  },
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]
});

ArticleSchema.pre('remove', async function() {
  this.comments.forEach(async function(commentId) {
    await Comment.deleteOne({_id: commentId});
  });
});

const Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;