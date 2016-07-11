// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;

var crypto  = require('crypto');
var User    = require('../models/user.js');
var Post    = require('../models/post.js');
var muilter = require('../models/multerUtil.js');

module.exports = function (app) {
	app.get('/' , function (req,res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		Post.getTen([],page,function(err,posts,total) {
			if (err) {
				posts = [];
			}
			res.render('index', { 
				title       : '主页' , 
				user        : req.session.user ,
				success     : req.flash('success').toString() ,
				error       : req.flash('error').toString() ,
				posts       : posts ,
				page        : page ,
				isFirstPage : (page - 1) == 0 ,
				isLastPage  : ((page - 1) * 10 + posts.length) == total
			});			
		})

	})


	app.get('/login',checkNotLogin);
	app.get('/login' , function (req,res) {
		res.render('login', { 
			title   : '登录' ,
			user    : req.session.user ,
			success : req.flash('success').toString() ,
			error   : req.flash('error').toString() 				
		});
	})	

	app.get('/reg' , function (req,res) {
		res.render('reg', { 
			title   : '注册'  ,
			user    : req.session.user ,
			success : req.flash('success').toString() ,
			error   : req.flash('error').toString() 			
		});
	})

	app.get('/post' , function (req,res) {
		res.render('post', { 
			title   : '发表'  ,
			user    : req.session.user ,
			success : req.flash('success').toString() ,
			error   : req.flash('error').toString() 			
		});
	})

	app.get('/logout' ,checkLogin );
	app.get('/logout' , function (req,res) {
		req.session.user = null;
		req.flash('success','登出成功');
		return res.redirect('/');
	})


	app.post('/login' , function (req,res) {
		var md5  = crypto.createHash('md5');
		password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name , function(err ,user) {
			if (!user) {
				req.flash('error' , '用户不存在');
				return res.redirect('/login');
			}
			if (user.password != password) {
				req.flash('error' , '密码错误');
				return res.redirect('/login');
			}
			req.session.user = user;
			req.flash('success','登录成功');
			return res.redirect('/');
		})
	})	

	app.post('/reg' , function (req,res) {
		var name        =  req.body.name;
		var password    =  req.body.password;
		var password_re =  req.body['password-repeat'];
		var email       =  req.body.email;

		//验证两次输入的密码
		if (password != password_re) {
			req.flash('error' , '两次输入的密码不一致');
			return res.redirect('/reg');
		}
		var md5  = crypto.createHash('md5');
		password = md5.update(password).digest('hex');
		//创建数据模型
		var newUser = new User({
			name     : name ,
			password : password ,
			email    : email 
		})
		User.get(newUser.name , function(err ,user) {
			if (err) {
				req.flash('error' , err);
				return res.redirect('/error');
			}
			if (user) {
				req.flash('error' , '用户已存在!');
				return res.redirect('/reg');
			}
			//不存在就新增用户
			newUser.save(function (err , user) {
				if (err) {
					req.flash('error' , err);
					return res.redirect('/error');
				}
				req.session.user = user;
				req.flash('success' , '注册成功');
				return res.redirect('/');
			})
		})

	})

	//发表博文
	app.post('/post' , checkLogin)
	app.post('/post' , function (req,res,next) {
		var user    = req.session.user;
		var title   = req.body.title;
		var post    = req.body.post;
		var tags    = [req.body.tag1,req.body.tag2,req.body.tag3];
		var newPost = new Post(user.name , user.head , title ,tags , post);

		newPost.save(function(err) {
			if (err) {
				req.flash('err', err);
				return res.redirect('/');
			}
			req.flash('success', '发表成功');
			res.redirect('/');		
		})
	})


	//上传文件
	app.get('/upload',checkLogin);
	app.get('/upload',function (req,res){
		res.render('upload', { 
			title   : '文件上传'  ,
			user    : req.session.user ,
			success : req.flash('success').toString() ,
			error   : req.flash('error').toString() 			
		});		
	})

	app.post('/upload',checkLogin);
	var upload = muilter.fields([
		{name : 'file1'} ,
		{name : 'file2'} ,
		{name : 'file3'} ,
		{name : 'file4'} ,
		{name : 'file5'} 
	]);
	app.post('/upload',function(req,res,next) {
		upload(req,res,function(err){
			if (err) {
				req.flash('error','上传失败');
				return res.redirect('/upload');
			}
			req.flash('success','文件上传成功');
			res.redirect('/');
		})
	});


	//查看用户全部文章的页面
	app.get('/u/:name',checkLogin);
	app.get('/u/:name',function (req,res){
		User.get(req.params.name,function (err,user) {
			var page = req.query.p ? parseInt(req.query.p) : 1;
			if (!user) {
				req.flash('error', '用户不存在');		
				return res.redirect('/');
			}
			//用户存在的话，就返回这个用户的全部博文
			Post.getTen([{name:user.name}],page,function (err,posts,total) {
				if (err) {
					req.flash('error', err);		
					return res.redirect('/');	
				}
				res.render('user' , {
					title       : user.name ,
					posts       : posts ,
					user        : req.session.user , 
					success     : req.flash('success').toString() ,
					error       : req.flash('error').toString() ,
					page        : page ,
					isFirstPage : (page - 1) == 0 ,
					isLastPage  : ((page - 1) * 10 + posts.length) == total
				});
			});
		});
	});


	//查看特定文章的页面
	app.get('/u/:name/:day/:title',checkLogin);
	app.get('/u/:name/:day/:title',function (req,res){
		Post.getOne({"name" : req.params.name, "time.day" : req.params.day, "title" : req.params.title}, function (err , post) {
			if (err) {
				req.flash('error', err);		
				return res.redirect('/');	
			}
			console.log(post);
			console.log(req.session.user);
			res.render('article',{
				title   : req.params.title ,
				post    : post ,
				user    : req.session.user , 
				success : req.flash('success').toString() ,
				error   : req.flash('error').toString() 
			})
		})
	});

	//修改文章的页面
	app.get('/edit/:name/:time/:title',checkLogin);
	app.get('/edit/:name/:time/:title',function (req,res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name,req.params.time,req.params.title,function (err , post) {
			if (err) {
				req.flash('error', err);		
				return res.redirect('/');	
			}
			res.render('edit',{
				title   : '编辑' ,
				post    : post ,
				user    : req.session.user , 
				success : req.flash('success').toString() ,
				error   : req.flash('error').toString() 
			})
		})
	});


	app.post('/edit/:name/:time/:title',checkLogin);
	app.post('/edit/:name/:time/:title',function (req,res) {
		var data  = req.body;
		data.name = req.session.user.name;
		var url   = encodeURI('/u/' + req.params.name + '/' + req.params.time + '/' + req.params.title);
		Post.update(data,function (err){
			if (err) {
				//错误，返回之前的页面
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','修改成功');
			res.redirect(url);
		})	
	});

	//删除文章
	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function (req,res){
		var currentUser = req.session.user;
		Post.remove({"name" : req.params.name, "time.day" : req.params.day, "title" : req.params.title}, function (err) {
			if (err) {
				req.flash('error', err);		
				return res.redirect('/');	
			}
			req.flash('success','删除成功');
			res.redirect('/');
		})
	});	


	//添加回复
	app.post('/u/:name/:day/:title',function (req,res){
		var currentUser = req.session.user;
		var date = new Date();
		var time = {
			date   : date ,
			year   : date.getFullYear() ,
			month  : date.getFullYear() + "-" + (date.getMonth() + 1)  ,
			day    : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() ,
			minute : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
		}
		var md5       = crypto.createHash('md5');
		var email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex');
		var head      = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";		
		var comments  = {
			name      : req.body.name ,
			email     : req.body.email ,
			website   : req.body.website ,
			time      : time ,
			content   : req.body.content ,
			head      : head
		};
		var url   = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
		var query = {
			"name"     : req.params.name ,
			"time.day" : req.params.day ,
			"title"    : req.params.title 
		}
		console.log(query);
		Post.commentAdd(query,comments,function (err) {
			if (err) {
				req.flash('error', err);		
				return res.redirect(url);	
			}
			req.flash('success','留言成功');
			res.redirect(url);
		})
	});	


	//存档
	app.get('/archive',function(req,res) {
		Post.getArchive(function (err,posts) {
			if (err) {
				req.flash('error', err);		
				return res.redirect('/');	
			}
			res.render('archive',{
				title   : '存档' ,
				posts   : posts ,
				user    : req.session.user , 
				success : req.flash('success').toString() ,
				error   : req.flash('error').toString() 
			})
		})
	})

	//标签
	app.get('/tags',function(req,res) {
		Post.getTags(function (err,posts) {
			if (err) {
				req.flash('error', err);		
				return res.redirect('/');	
			}
			res.render('tags',{
				title   : '标签' ,
				posts   : posts ,
				user    : req.session.user , 
				success : req.flash('success').toString() ,
				error   : req.flash('error').toString() 
			})
		})
	})

	//搜索
	app.get('/search',function(req,res) {
		Post.search(req.query.keyword , function (err,posts) {
			if (err) {
				req.flash('error', err);		
				return res.redirect('/');	
			}
			res.render('search',{
				title   : '搜索' ,
				posts   : posts ,
				user    : req.session.user , 
				success : req.flash('success').toString() ,
				error   : req.flash('error').toString() 
			})
		})
	})

	//转载
	app.get('/reprint/:name/:day/:title' , checkLogin); 
	app.get('/reprint/:name/:day/:title' , function (req,res) {
		Post.findOne(req.params.name,req.params.day,req.params.title,function (err,post) {
			if (err) {
				req.flash('error', err);		
				return res.redirect('/');
			}
			var currentUser  = req.session.user,
				reprint_from = {name : req.params.name , day : post.time.day , title : post.title}
				reprint_to   = {name:currentUser.name ,  head : currentUser.head };
			Post.reprint(reprint_from , reprint_to , function (err,post) {
				if (err) {
					req.flash('error', err);		
					return res.redirect('/');
				}
				req.flash('success' , '转载成功');
				var url = encodeURI('/u/' + post.name + '/' + post.time.day + '/' + post.title);
				res.redirect(url);
			})
		})
	}) 


	app.use(function (req, res) {
		res.render("404");
	});


	//检查是未登录
	function checkLogin(req,res,next) {
		if (!req.session.user) {
			req.flash('error','未登录');
			return res.redirect('/login');
		}
		next();
	}


	//检查是否已登录
	function checkNotLogin(req,res,next) {
		if (req.session.user) {
			req.flash('error','已登录');
			return res.redirect('back');
		}
		next();		
	}

}









