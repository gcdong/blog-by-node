var mongodb  = require('./db');
var Schema   = mongodb.Schema;
var db       = mongodb.db;
var mongoose = mongodb.mongoose;
var markdown = require('markdown').markdown;

function Post(name,head,title,tags,post) {
	this.name  = name;
	this.head  = head;
	this.title = title;
	this.post  = post;
	this.tags  = tags;
}



module.exports =  Post;

var PostSchema = new Schema({
	name         : String ,
	title        : String ,
	post         : String ,
	tags         : [] ,
	comments     : [] ,
	pv           : {type:Number,default:0},
	reprint_info : {
		reprint_to : [{
			name: String, 
			head: String
		}], 
		reprint_from : {
			name  : String, 
			title : String,
			day   : String
		} 
	},
	time         : {
		date   : {type:Date , default:Date.now} ,
		year   : String ,
		month  : String ,
		day    : String ,
		minute : String ,
	},
});

var PostModel = db.model('post',PostSchema);


Post.prototype.save = function (callback) {
	var date = new Date();
	var time = {
		date   : date ,
		year   : date.getFullYear() ,
		month  : date.getFullYear() + "-" + (date.getMonth() + 1)  ,
		day    : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() ,
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}


	var postEntity = new PostModel({
		name  : this.name ,
		time  : time ,
		title : this.title ,
		post  : this.post ,
		tags  : this.tags 
	});
	postEntity.save(function(err , rs) {
		if (err) {
			return callback(err);
		}
		callback(null , rs[0]);
	})
}

Post.getAll = function(query , callback) {
	PostModel.find(query).sort('-_id').exec(function (err, rs) {
		if (err) {
			return callback(err);
		}
		rs.forEach(function(doc) {
			doc.post = markdown.toHTML(doc.post);
		})
	})

	callback(null,rs);

}


Post.getTen = function (query , page , callback) {
	PostModel.find(query).sort('-_id').skip((page - 1) * 10).limit(10).exec(function (err, rs) {

		if (err) {
			return callback(err);
		}
		rs.forEach(function(doc) {
			doc.post = markdown.toHTML(doc.post);
		})

		PostModel.count(query,function (err,total) {
			if (err) {
				return callback(err);
			}
			callback(null,rs,total);
		})		
	})
}

Post.getOne = function(query , callback) {
	PostModel.findOne(query,function (err , rs) {
		if (err) {
			return callback(err);
		}

		rs.post = markdown.toHTML(rs.post);
		if (rs.comments) {
			rs.comments.forEach(function (comment) {
				comment.content = markdown.toHTML(comment.content);
			})
		}
		if (rs) {
			PostModel.findByIdAndUpdate(rs.id,{$inc:{"pv":1}},function(err,rs){
				if (err) {
					return callback(err);
				}
		    });
		};
		callback(null , rs);
	})
}

Post.findOne = function(name , day , title , callback) {
	PostModel.findOne({
		"name"     : name ,
		"time.day" : day ,
		"title"    : title
	},function (err , rs) {
		if (err) {
			return callback(err);
		}
		callback(null , rs);
	})
}
Post.edit = function(name , time , title , callback) {
	PostModel.findOne({
		"name"        : name ,
		"time.minute" : time.minute ,
		"title"       : title
	},null,{sort:[['_id', -1]]},function (err , rs) {
		if (err) {
			return callback(err);
		}
		callback(null , rs);
	})
}

Post.update = function(data , callback) {
	PostModel.findByIdAndUpdate(data.id,{$set:data},function(err,rs){
		if (err) {
			return callback(err);
		}
		callback(null);
    });
}

Post.remove = function (query , callback) {
	PostModel.findOne(query,function (err , doc) {
		if (err) {
			return callback(err);
		}
		var reprint_from = '';
		if (doc.reprint_info.reprint_from) {
			reprint_from = doc.reprint_info.reprint_from;
		}
		//如果存在ftom，也就是转载
		PostModel.update({
			"name"     : reprint_from.name ,
			"time.day" : reprint_from.day ,
			"title"    : reprint_from.title
		},{$pull:{"reprint_info.reprint_to":{
			"name"  : query.name ,
			"day"   : query.day ,
			"title" : query.title
		}}},function(err) {
			if (err) {
				return callback(err);
			}
		})
		//最后删除转载过来的文章
		PostModel.remove(query,function (err) {
			if (err) {
				return callback(err);
			}
			//删除的同时判断是否转载的文章，如果是，则需要从转载那边也删除记录
			callback(null);		
		})

	})

}


Post.commentAdd = function (query,comments,callback) {
	PostModel.update(query,{$push:{comments:comments}},function(err) {
		if (err) {
			return callback(err);
		}
		callback(null);			
	})
}

//获取所有存档
Post.getArchive = function (callback) {
	PostModel.find({},'_id name time title',function (err , rs) {
		if (err) {
			return callback(err);
		}
		callback(null , rs);
	})	
}


//获取所有标签
Post.getTags = function (callback) {
	PostModel.distinct('tags',function (err , rs) {
		if (err) {
			return callback(err);
		}
		callback(null , rs);
	})	
}

//搜索
Post.search = function (keyword,callback) {
	var pattern = new RegExp(keyword , "i");
	PostModel.find({"title":pattern},'_id name time title',function (err,rs){
		if (err) {
			return callback(err);
		}
		callback(null,rs);
	})
}

//转载一篇文章
Post.reprint = function(reprint_from , reprint_to , callback) {
	//首先找出文章
	PostModel.findOne({
		"name"     : reprint_from.name ,
		"time.day" : reprint_from.day ,
		"title"    : reprint_from.title
	},function (err,doc){
		if (err) {
			return callback(err);
		}
		var date = new Date();
		var time = {
			date   : date ,
			year   : date.getFullYear() ,
			month  : date.getFullYear() + "-" + (date.getMonth() + 1)  ,
			day    : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() ,
			minute : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
		}
		//删除ID
		delete doc._id;
		doc.name         = reprint_from.name;
		doc.head         = reprint_from.head;
		doc.time         = time;
		doc.title        = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
		doc.comments     = [];
		doc.reprint_info = {"reprint_from" : reprint_from};
		doc.pv           = 0;
		//更新被转载的文档的信息
		PostModel.update({
			"name"     : reprint_from.name ,
			"time.day" : reprint_from.day ,
			"title"    : reprint_from.title
		},{$push:{"reprint_info.reprint_to":{
			"name"  : reprint_to.name ,
			"day"   : time.day ,
			"title" : doc.title
		}}},function(err) {
			if (err) {
				return callback(err);
			}
		})
		var postEntity = new PostModel({
			name         : reprint_to.name ,
			head         : reprint_to.head ,
			title        : doc.title ,
			post         : doc.post ,
			time         : doc.time ,
			reprint_info : doc.reprint_info ,
			pv           : doc.pv ,
			comments     : doc.comments ,
			tags         : doc.tags 
		});
		//正式将转载的内容写到数据库里面去
		postEntity.save(function(err,rs) {
			if (err) {
				return callback(err);
			}
			callback(null , rs);
		})

	})
}








