const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const app = express()

const mongoose = require('mongoose')
const passport = require('passport')

mongoose.connect('mongodb://localhost/news', function(err, db) {
	if (!err) {
		console.log('Connected to /news!')
	} else {
		console.dir(err)
	}
})

require('./models/Posts')
require('./models/Comments')
require('./models/Users')
require('./models/Categories')
require('./config/passport')

const routes = require('./routes/index')
const users = require('./routes/users')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(passport.initialize())

app.use('/', routes)
app.use('/users', users)

app.use(function(req, res, next) {
	let err = new Error('Not Found')
	err.status = 404
	next(err)
})

if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500)
		res.render('error', {
			message: err.message,
			error: err
		})
	})
}

app.use(function(err, req, res, next) {
	res.status(err.status || 500)
	res.render('error', {
		message: err.message,
		error: {}
	})
})

module.exports = app