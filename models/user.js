var mongodb  = require('./db');
var Schema   = mongodb.Schema;
var db       = mongodb.db;
var mongoose = mongodb.mongoose;
var crypto   = require('crypto');

function User(user) {
	this.name     = user.name;
	this.password = user.password;
	this.email    = user.email;
}

// var UserSchema = mongoose.Schema({


module.exports =  User;

var UserSchema = new Schema({
	name     : String ,
	password : String ,
	email    : String ,
	head     : String
});

var UserModel = db.model('user',UserSchema);


User.prototype.save = function (callback) {
	var md5       = crypto.createHash('md5');
	var email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
	var head      = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
	var userEntity = new UserModel({
		name     : this.name ,
		password : this.password ,
		email    : this.email ,
		head     : head 
	});
	userEntity.save(function(err , rs) {
		if (err) {
			return callback(err);
		}
		callback(null , rs[0]);
	})
}

User.get = function(name , callback) {
	UserModel.find({name:name},function (err , rs) {
		callback(null , rs[0]);
		// console.log(User.password);
	})
}

// User.prototype.save = function (callback) {
// 	var user = {
// 		name     : this.name ,
// 		password : this.password ,
// 		email    : this.email 
// 	}
// 	mongodb.open(function (err,db) {
// 		if (err) {
// 			return callback(err);
// 		}
// 		db.collection('user',function (err , collection) {
// 			if (err) {
// 				mongodb.close();
// 				return callback(err);
// 			}
// 			collection.insert(user , {
// 				safe : true
// 			},function (err,user) {
// 				mongodb.close();
// 				if (err) {
// 					return callback(err);
// 				}
// 				callback(null , user[0]);
// 			})
// 		})
// 	})
// };

// User.get = function(name , callback) {
// 	mongodb.open(function (err , db) {
// 		if (err) {
// 			return callback(err);
// 		}
// 		db.collection('user',function (err , collection) {
// 			if (err) {
// 				mongodb.close();
// 				return callback(err);
// 			}
// 			collection.findOne({
// 				name : name
// 			},function (err,user) {
// 				mongodb.close();
// 				if (err) {
// 					return callback(err);
// 				}
// 				callback(null , user[0]);
// 			})
// 		})		
// 	})
// }