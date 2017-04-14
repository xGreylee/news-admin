var mongoose = require('mongoose')

var PostSchema = new mongoose.Schema({
	title: String,
	link: String,
	author: String,
	contents: String,
	upvotes: {
		type: Number,
		default: 0
	},
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Comment'
	}],
	categories: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category'
	}
})

PostSchema.methods.upvote = function(cb) {
	this.upvotes += 1
	this.save(cb)
}

PostSchema.methods.downvote = function(cb) {
	this.upvotes -= 1
	this.save(cb)
}

mongoose.model('Post', PostSchema)