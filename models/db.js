// var settings   = require('../settings'),
// 	Db         = require('mongodb'),
// 	Connection = require('mongodb').Connection,
// 	Server     = require('mongodb').Server;
// module.exports = new Db(settings.db , new Server(settings.host , settings.port),{safe:true});
var settings = require('../settings');
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;
mongoose.connect(settings.url);

var db = mongoose.connection;
db.on('error',console.error.bind(console,'连接错误:'));
db.once('open',function(callback){
  //一次打开记录
});


module.exports = {
	db       : db ,
	Schema   : Schema ,
	mongoose : mongoose ,
};