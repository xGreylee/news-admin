const mongoose = require('mongoose')
const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('express-jwt')

const Post = mongoose.model('Post')
const Comment = mongoose.model('Comment')
const User = mongoose.model('User')

const auth = jwt({
	secret: 'SECRET',
	userProperty: 'payload'
})

router.get('/', function(req, res) {
	res.render('index')
})

router.get('/posts', function(req, res, next) {
	Post.find(function(err, posts) {
		if (err) {
			return next(err)
		}

		res.json(posts)
	})
})

router.post('/posts', auth, function(req, res, next) {
	const post = new Post(req.body)
	post.author = req.payload.username
	post.save(function(err, post) {
		if (err) {
			return next(err)
		}

		res.json(post)
	})
})

router.delete('/posts/:post/delete', auth, function(req, res, next) {
	req.post.remove(function(err, posts) {
		if (err) {
			return next(err)
		}
		res.json(posts)
	})
})

router.param('post', function(req, res, next, id) {
	const query = Post.findById(id)

	query.exec(function(err, post) {
		if (err) {
			return next(err)
		}
		if (!post) {
			return next(new Error('cant find post'))
		}

		req.post = post
		return next()
	})
})

router.param('comment', function(req, res, next, id) {
	const query = Comment.findById(id)

	query.exec(function(err, comment) {
		if (err) {
			return next(err)
		}
		if (!comment) {
			return next(new Error('cant find comment'))
		}

		req.comment = comment
		return next()
	})
})

router.get('/posts/:post', function(req, res, next) {
	req.post.populate('comments', function(err, post) {
		res.json(post)
	})
})

router.put('/posts/:post/update', auth, function(req, res, next) {
	Post.update(req.post, req.body, {}, function(err, post) {
		if (err) {
			return next(err)
		}
		// console.log('post:', post)
		res.json(post)
	})
})

router.put('/posts/:post/upvote', auth, function(req, res, next) {
	req.post.upvote(function(err, post) {
		if (err) {
			return next(err)
		}

		res.json(post)
	})
})

router.put('/posts/:post/downvote', auth, function(req, res, next) {
	req.post.downvote(function(err, post) {
		if (err) {
			return next(err)
		}

		res.json(post)
	})
})

router.post('/posts/:post/comments', auth, function(req, res, next) {
	const comment = new Comment(req.body)
	comment.post = req.post
	comment.author = req.payload.username

	comment.save(function(err, comment) {
		if (err) {
			return next(err)
		}

		req.post.comments.push(comment)
		req.post.save(function(err, post) {
			if (err) {
				return next(err)
			}

			res.json(comment)
		})
	})
})

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
	req.comment.upvote(function(err, comment) {
		if (err) {
			return next(err)
		}

		res.json(comment)
	})
})

router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
	req.comment.downvote(function(err, comment) {
		if (err) {
			return next(err)
		}

		res.json(comment)
	})
})

router.get('/personal', auth, function(req, res, next) {
	// console.log('req.payload:', req.payload)
	User.find({
		_id: req.payload._id
	}, function(err, docs) {
		if (err) {
			return next(err)
		}
		res.json(docs)
	})
})

router.put('/personal/update', auth, function(req, res, next) {
	// console.log('req.payload:', req.payload)
	User.findByIdAndUpdate({
		_id: req.payload._id
	}, req.body, {}, function(err, docs) {
		if (err) {
			return next(err)
		}
		// console.log('docs:', docs)
		res.json(docs)
	})
})

router.post('/register', function(req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({
			message: 'Please fill out all fields'
		})
	}

	const user = new User()

	user.username = req.body.username
	user.nickname = req.body.nickname
	user.signs = req.body.signs
	user.gender = req.body.gender

	user.setPassword(req.body.password)

	user.save(function(err) {
		if (err) {
			return next(err)
		}

		return res.json({
			token: user.generateJWT()
		})
	})
})

router.put('/resetPwd/update', auth, function(req, res, next) {
	const user = new User()
	console.log('req.body:', req.body)
	console.log('----------------->')
	console.log('req.payload:', req.payload)
	let newPwd = user.resetPassword(req.body.password)
	console.log('----------------->')
	console.log('newPwd:', newPwd)
	User.findByIdAndUpdate({
		_id: req.payload._id
	}, {
		hash: newPwd
	}, {}, function(err, docs) {
		if (err) {
			return next(err)
		}
		console.log('docs:', docs)
		return res.json({
			token: user.generateJWT()
		})
	})
})

router.post('/login', function(req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({
			message: 'Please fill out all fields'
		})
	}

	console.log('calling passport)')
	passport.authenticate('local', function(err, user, info) {
		if (err) {
			return next(err)
		}

		if (user) {
			return res.json({
				token: user.generateJWT()
			})
		} else {
			return res.status(401).json(info)
		}
	})(req, res, next)
})

module.exports = router