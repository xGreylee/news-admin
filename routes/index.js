const mongoose = require('mongoose')
const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('express-jwt')
const formidable = require('formidable')
const path = require('path')
const fs = require('fs')

const Post = mongoose.model('Post')
const Comment = mongoose.model('Comment')
const User = mongoose.model('User')
const Category = mongoose.model('Category')

const auth = jwt({
	secret: 'SECRET',
	requestProperty: 'payload'
})
const uploadfoldername = 'uploadimg'
const uploadfolderpath = path.join(__dirname, '../public/uploadimg')
console.log('uploadfolderpath:', uploadfolderpath)

router.get('/', function(req, res) {
	res.render('index')
})

router.post('/uploadimg', function(req, res, next) {
	var form = new formidable.IncomingForm()
	form.parse(req, function(err, fields, files) {
		// console.log('files:', files)
		if (err) {
			return console.log('formidable, form.parse err')
		}

		console.log('formidable, form.parse ok')

		console.log('显示上传时的参数 begin')
		console.log(fields)
		console.log('显示上传时的参数 end')

		let item
		var length = 0
		for (item in files) {
			length++
		}
		if (length === 0) {
			console.log('files no data')
			return
		}

		for (item in files) {
			var file = files[item]
			var tempfilepath = file.path
			console.log('tempfilepath:', tempfilepath)

			var type = file.type
			var filename = file.name
			var extname = filename.lastIndexOf('.') >= 0 ? filename.slice(filename.lastIndexOf('.') - filename.length) : ''

			if (extname === '' && type.indexOf('/') >= 0) {
				extname = '.' + type.split('/')[1]
			}
			filename = Math.random().toString().slice(2) + extname
			console.log('new filename:', filename)
			var filenewpath = path.join(uploadfolderpath, filename)
			var is = fs.createReadStream(tempfilepath)
			var os = fs.createWriteStream(filenewpath)
			is.pipe(os)
			is.on('end', function() {
				fs.unlinkSync(tempfilepath, filenewpath)
			})
			let result = ''
			result = 'http://localhost:3000/'+ uploadfoldername + '/' + filename
			res.writeHead(200, {
				'Content-type': 'text/html'
			})
			res.end(result)
		}
	})
})

router.get('/posts', function(req, res, next) {
	Post.find(function(err, posts) {
		if (err) {
			return next(err)
		}

		res.json(posts)
	})
})

router.get('/comments', function(req, res, next) {
	Comment.find(function(err, comments) {
		if (err) {
			return next(err)
		}
		// console.log('comments:', comments)
		res.json(comments)
	})
})

router.get('/categories', function(req, res, next) {
	Category.find(function(err, categories) {
		if (err) {
			return next(err)
		}

		res.json(categories)
	})
})

router.post('/posts', auth, function(req, res, next) {
	const post = new Post(req.body)
		// console.log('post:', post)
		// post.categories = req.category
	post.author = req.payload.username
	post.save(function(err, post) {
		if (err) {
			return next(err)
		}
		Category.findById(post.categories, function(err, category) {
			category.posts.push(post)
			category.save(function(error, category) {
				if (error) {
					return next(error)
				}
				res.json(post)
			})
		})
	})
})

router.post('/categories', auth, function(req, res, next) {
	// console.log('req.body:', req.body)
	const category = new Category(req.body)
	category.save(function(err, category) {
		if (err) {
			return next(err)
		}

		res.json(category)
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

router.delete('/categories/:category/delete', auth, function(req, res, next) {
	req.category.remove(function(err, categories) {
		if (err) {
			return next(err)
		}
		res.json(categories)
	})
})

router.delete('/comments/:comment/delete', auth, function(req, res, next) {
	// console.log('req.comment:', req.comment)
	req.comment.remove(function(err, comments) {
		if (err) {
			return next(err)
		}
		res.json(comments)
	})
})

router.delete('/comments/:post/deleteWithPost', auth, function(req, res, next) {
	// console.log('req.post:', req.post)
	Comment.deleteMany({
		post: req.post
	}, function(err, comments) {
		if (err) {
			return next(err)
		}
		res.json(comments)
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

router.param('category', function(req, res, next, id) {
	const query = Category.findById(id)

	query.exec(function(err, category) {
		if (err) {
			return next(err)
		}
		if (!category) {
			return next(new Error('cant find category'))
		}

		req.category = category
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
	req.post.populate('comments categories', function(err, post) {
		res.json(post)
	})
})

router.put('/posts/:post/update', auth, function(req, res, next) {
	// console.log('req.post:', req.post)
	// console.log('req.body:', req.body)
	Post.update(req.post, req.body, {}, function(err, post) {
		if (err) {
			return next(err)
		}

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
	console.log('user:', user)
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
	console.log('user:', user)
	console.log('----------------->')
	console.log('req.payload:', req.payload)
	console.log('----------------->')
	let newPwd = user.resetPassword(req.body.password)
	console.log('newPwd:', newPwd)
	console.log('----------------->')
	User.findByIdAndUpdate(req.payload._id, {
		hash: newPwd
	}, function(err, docs) {
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
