const db = require('../models');

const saveComment = (req, res) => {
  db.Comment.create(req.body)
    .then(comment => {
      db.Article.findOneAndUpdate({ _id: req.params.article_id }, {$push: {comments: comment._id}}, { new: true }).then(article => {
        res.json([
          comment,
          article
        ]);
      }).catch(err => {
        res.json(err);
      });
    })
    .catch(err => {
      res.json(err);
    });
}

const deleteComment = (req, res) => {
  db.Comment.deleteOne({_id: req.params.id}).then(deleted => {
    db.Article.findOneAndUpdate({_id: req.params.article_id}, {$pull: {comments: req.params.id}}, {new: true}).then(article => {
      res.json([
        deleted,
        article
      ]);
    }).catch(err => {
      res.json(err);
    });
  }).catch(err => {
    res.json(err);
  });;
}

module.exports = {
  saveComment,
  deleteComment
}
