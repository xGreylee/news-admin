const app = angular.module('news-admin', ['ui.router', 'ui.bootstrap', 'ngAnimate', 'ngSanitize', 'ngMessages', 'toaster', 'ngValidate'])

app.config(['$stateProvider', '$urlRouterProvider', '$validatorProvider',
	function($stateProvider, $urlRouterProvider, $validatorProvider) {
		$stateProvider.state('home', {
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			resolve: {
				postPromise: ['posts',
					function(posts) {
						return posts.getAll()
					},
				],
			},
		})
		.state('plist', {
			url: '/plist',
			templateUrl: '/plist.html',
			controller: 'MainCtrl',
			resolve: {
				postPromise: ['posts',
					function(posts) {
						return posts.getAll()
					},
				],
			},
		})
		.state('addPost', {
			url: '/addPost',
			templateUrl: '/addPost.html',
			controller: 'MainCtrl',
		})
		.state('postUpdate', {
			url: '/posts/:id',
			templateUrl: '/postUpdate.html',
			controller: 'PostsCtrl',
			resolve: {
				post: ['$stateParams', 'posts', 'auth', '$state',
					function($stateParams, posts, auth, $state) {
						if (auth.isLoggedIn()) {
							return posts.get($stateParams.id)
						}
						$state.go('login')
					},
				],
			},
		})
		.state('showPost', {
			url: '/posts/:id/detail',
			templateUrl: '/postDetail.html',
			controller: 'PostsCtrl',
			resolve: {
				post: ['$stateParams', 'posts', 'auth', '$state',
					function($stateParams, posts, auth, $state) {
						if (auth.isLoggedIn()) {
							return posts.get($stateParams.id)
						}
						$state.go('login')
					},
				],
			},
		})
		.state('personal', {
			url: '/personal',
			templateUrl: '/personal.html',
			controller: 'UserCtrl',
			resolve: {
				users: ['$stateParams', 'auth',
					function($stateParams, auth) {
						return auth.getInfo()
					},
				],
			},
		})
		.state('resetPwd', {
			url: '/resetPwd',
			templateUrl: '/resetPwd.html',
			controller: 'PwdCtrl',
			// resolve: {
			// 	users: ['$stateParams', 'auth',
			// 		function($stateParams, auth) {
			// 			return
			// 		},
			// 	],
			// },
		})
		.state('login', {
			url: '/login',
			templateUrl: '/login.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth',
				function($state, auth) {
					if (auth.isLoggedIn()) {
						$state.go('home')
					}
				},
			],
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth',
				function($state, auth) {
					if (auth.isLoggedIn()) {
						$state.go('home')
					}
				},
			],
		})

		$urlRouterProvider.otherwise('home')
		$validatorProvider.setDefaults({
			errorElement: 'span',
			errorClass: 'help-block'
		})
	},
])

app.factory('auth', ['$http', '$window',
	function($http, $window) {
		const auth = {}

		auth.saveToken = function(token) {
			$window.localStorage['news-admin-token'] = token
		}

		auth.getToken = function() {
			return $window.localStorage['news-admin-token']
		}

		auth.isLoggedIn = function() {
			let token = auth.getToken()

			if (token) {
				let payload = JSON.parse($window.atob(token.split('.')[1]))

				return payload.exp > Date.now() / 1000
			} else {
				return false
			}
		}

		auth.currentUser = function() {
			if (auth.isLoggedIn()) {
				let token = auth.getToken()
				let payload = JSON.parse($window.atob(token.split('.')[1]))
				// console.log('payload:', payload)
				return payload.username
			}
		}

		auth.getInfo = function() {
			return $http.get('/personal', {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(res) {
				return res.data
			})
		}

		auth.update = function(id, user) {
			return $http.put('/personal/update', user, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(res) {
				console.log('res:', res)
				return res.data
			})
		}

		auth.register = function(user) {
			return $http.post('/register', user).success(function(data) {
				auth.saveToken(data.token)
			})
		}

		auth.logIn = function(user) {
			return $http.post('/login', user).success(function(data) {
				auth.saveToken(data.token)
			})
		}

		auth.logOut = function() {
			$window.localStorage.removeItem('news-admin-token')
		}

		return auth
	},
])

app.factory('posts', ['$http', 'auth',
	function($http, auth) {
		const o = {
			posts: [],
		}

		o.getAll = function() {
			return $http.get('/posts').success(function(data) {
				angular.copy(data, o.posts)
			})
		}

		o.create = function(post) {
			return $http.post('/posts', post, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(data) {
				o.posts.push(data)
			})
		}

		o.upvote = function(post) {
			return $http.put('/posts/' + post._id + '/upvote', null, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(data) {
				post.upvotes += 1
			})
		}

		o.downvote = function(post) {
			return $http.put('/posts/' + post._id + '/downvote', null, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(data) {
				post.upvotes -= 1
			})
		}

		o.get = function(id) {
			return $http.get('/posts/' + id).then(function(res) {
				return res.data
			})
		}

		o.delete = function(id) {
			return $http.delete('/posts/' + id + '/delete', {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(data) {
				console.log('data:', data)
				return o.getAll()
			})
		}

		o.update = function(id, post) {
			return $http.put('/posts/' + id +'/update', post, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(data) {
				console.log('data:', data)
			})
		}

		o.addComment = function(id, comment) {
			return $http.post('/posts/' + id + '/comments', comment, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			})
		}

		o.upvoteComment = function(post, comment) {
			return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken(),
				},
			}).success(function(data) {
				comment.upvotes += 1
			})
		}

		o.downvoteComment = function(post, comment) {
			return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', null, {
				headers: {
					Authorization: 'Bearer ' + auth.getToken()
				},
			}).success(function(data) {
				comment.upvotes -= 1
			})
		}
		return o
	},
])

app.controller('MainCtrl', ['$scope', 'posts', 'auth',
	function($scope, posts, auth) {
		$scope.posts = posts.posts
		$scope.isLoggedIn = auth.isLoggedIn

		$scope.title = ''

		$scope.addPost = function() {
			if ($scope.title === '') {
				return
			}
			posts.create({
				title: $scope.title,
				link: $scope.link,
				contents: $scope.contents,
			})

			$scope.title = ''
			$scope.link = ''
			$scope.contents= ''
		}

		$scope.showPost = function(post) {
			posts.get(post._id)
		}

		$scope.deletePost = function(post) {
			posts.delete(post._id) 
		}

		$scope.upvote = function(post) {
			console.log('Upvoting:' + post.title + 'votes before:' + post.upvotes)
			posts.upvote(post)
		}

		$scope.downvote = function(post) {
			posts.downvote(post)
		}
	},
])

app.controller('PostsCtrl', ['$scope', '$state', 'posts', 'post', 'auth',
	function($scope, $state, posts, post, auth) {
		$scope.posts = posts.posts
		$scope.post = post
		$scope.isLoggedIn = auth.isLoggedIn

		$scope.addComment = function() {
			if ($scope.body === '') {
				return
			}
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'user',
			}).success(function(comment) {
				$scope.post.comments.push(comment)
			})
			$scope.body = ''
		}

		$scope.updatePost = function() {
			posts.update(post._id, {
				title: $scope.post.title,
				link: $scope.post.link,
				contents: $scope.post.contents,
			}).then(function() {
				$state.go('plist')
			})
		}

		$scope.upvote = function(comment) {
			posts.upvoteComment(post, comment)
		}

		$scope.downvote = function(comment) {
			posts.downvoteComment(post, comment)
		}
	},
])

app.controller('AuthCtrl', ['$scope', '$state', 'auth',
	function($scope, $state, auth) {
		$scope.user = {}

		$scope.register = function() {
			auth.register($scope.user).error(function(error) {
				$scope.error = error
			}).then(function() {
				$state.go('home')
			})
		}

		$scope.logIn = function() {
			auth.logIn($scope.user).error(function(error) {
				$scope.error = error
			}).then(function(data) {
				$state.go('home')
			})
		}
	},
])

app.controller('UserCtrl', function($scope, users, auth, $state) {
	$scope.users = users.data[0]
	// console.log('$scope.users:', $scope.users)
	$scope.updateInfo = function() {
		auth.update($scope.users._id, {
			nickname: $scope.users.nickname,
			signs: $scope.users.signs,
		}).then(function() {
			$state.go('home')
		})
	}
})

app.controller('PwdCtrl', function($scope, auth, $state) {
	$scope.validationOptions = {
		rules: {
			new_password: {
				required: true,
				minlength: 6
			},
			re_password: {
				required: true,
				minlength: 6,
				equalTo: '#new_password'
			}
		},
		messages: {
			password: {
				required: 'You must enter a password',
				minlength: 'Your password must have a minimum length of 6 characters'
			},
			re_password: {
				required: 'You must enter the new password again',
				equalTo: 'you must enter the same value with the new password'
			}
		}
	}
})

app.controller('NavCtrl', ['$scope', 'auth',
	function($scope, auth) {
		$scope.isLoggedIn = auth.isLoggedIn
		$scope.currentUser = auth.currentUser
		$scope.logOut = auth.logOut
	},
])

app.controller('AccordionDemoCtrl', function($scope) {
	$scope.oneAtATime = true

	$scope.groups = [{
		title: 'Dynamic Group Header - 1',
		content: 'Dynamic Group Body - 1'
	}, {
		title: 'Dynamic Group Header - 2',
		content: 'Dynamic Group Body - 2'
	}]

	$scope.items = ['Item 1', 'Item 2', 'Item 3']

	$scope.addItem = function() {
		var newItemNo = $scope.items.length + 1
		$scope.items.push('Item ' + newItemNo)
	}

	$scope.status = {
		isCustomHeaderOpen: false,
		isFirstOpen: true,
		isFirstDisabled: false
	}
})

app.controller('toasterController', function($scope, toaster, $window) {

	$scope.pop = function() {
		toaster.success({
			title: 'SUCCESS',
			body: '提交成功'
		})
	}

	$scope.goToLink = function(toaster) {
		var match = toaster.body.match(/http[s]?:\/\/[^\s]+/)
		if (match) $window.open(match[0])
		return true
	}

	$scope.clear = function() {
		toaster.clear()
	}
})