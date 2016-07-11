var mongodb  = require('./db');
var Schema   = mongodb.Schema;
var db       = mongodb.db;
var mongoose = mongodb.mongoose;

function Comment(name,time,title,comment) {
	this.name    = name ,
	this.time    = time ,
	this.title   = title ,
	this.comment = comment 
}

var CommentSchema = new Schema({
	name    : String ,
	time    : String ,
	title   : String ,
	comment : String
});

var CommentModel = db.model('comment',CommentSchema);

module.exports = Comment;


Comment.prototype.save = function (callback) {
	var date = new Date();
	var time = {
		date   : date ,
		year   : date.getFullYear() ,
		month  : date.getFullYear() + "-" + (date.getMonth() + 1)  ,
		day    : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() ,
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}

	
}