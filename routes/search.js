const express = require('express')
const mongoClient = require('mongodb').MongoClient

const app = express();

var db;
var databaseUrl = 'mongodb://3.34.14.98:46171/'

app.get('/', (req, res) => {
  var app_name = req.query.app_name;
  console.log(app_name);
  var filter = req.query.filter;
  if(!filter || filter == "undefined"){
    filter = null;
  }
  console.log("filter : " + filter);

  var condition = req.query.condition;
  var sc;
  if(!condition || condition == "undefined"){
    condition = "-DATE";
  }
  if (condition.indexOf('-') != -1) {
    sc = -1;
    condition = condition.slice(1);
  }else{
    sc = 1;
  }
  console.log(condition);

  var os = req.query.os;
  if(!os || os == "undefined"){
    os = "android";
  }
  console.log(os);

  var date = req.query.start_date;
  if(!date || date == "undefined"){
    var e_date = new Date();
    if((e_date.getMonth() + 1) >= 10){
      end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
    }else{
      end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
    }
    console.log(end_date);
    var s_date = new Date(e_date.setMonth(e_date.getMonth() - 3));
    if((s_date.getMonth() + 1) >= 10){
      start_date = s_date.getFullYear() + '-' + (s_date.getMonth() + 1) + '-' + s_date.getDate();
    }else{
      start_date = s_date.getFullYear() + '-0' + (s_date.getMonth() + 1) + '-' + s_date.getDate();
    }
    console.log(start_date);
  }else{
    var start_date = date.slice(1,11);
    console.log(start_date);
    var end_date = date.slice(14);
    console.log(end_date);
  }

  mongoClient.connect(databaseUrl, function(err, database){
    if(err){
      console.error(err);
      console.log("connection error...!");
      res.json("connection error...!");
    }else{
      db = database.db('review');
      if(!filter){
        db.collection(app_name).find({ DATE: { $gte: start_date, $lte: end_date }, OS: os}, { _id: 0 }).sort({ [condition]: sc }).toArray(function(err, result){
          if(err) throw err;
          console.log('review : ' + result);
          res.send(JSON.stringify(result));
        });
      }else{
        db.collection(app_name).find({ DATE: { $gte: start_date, $lte: end_date }, COMMENT: { $regex: filter }, OS: os }, { _id: 0 }).sort({ [condition]: sc }).toArray(function(err, result){
          if(err) throw err;
          console.log('result : ' + result);
          res.send(JSON.stringify(result));
        });
      }
    }
  })
});

module.exports = app;
