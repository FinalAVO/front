const express = require('express')
const mongoClient = require('mongodb').MongoClient

const app = express();

var db;
var databaseUrl = 'mongodb://3.34.14.98:46171/'

app.get('/', (req, res) => {
  var app_name = req.query.app_name;
  if(!app_name){
    if(req.session){
      app_name = req.session.appData;
    }
  }
  console.log("app_name : " + app_name);
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

  var os_filter = []
  var os = req.query.os;
  console.log(os);

  if(os == "android"){
    os_filter.push("android")
  } else if (os == "ios"){
    os_filter.push("ios")
  } else {
    os_filter.push("android")
    os_filter.push("ios")
  }
  console.log(os_filter);

  var date = req.query.date;
  if(!date || date == "undefined"){
    var end_date;
    var start_date;
    var e_date = new Date();
    if((e_date.getMonth() + 1) >= 10){
      if(e_date.getDate() < 10){
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }else{
      if(e_date.getDate() < 10){
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }
    console.log(end_date);
    var s_date = new Date(e_date.setMonth(e_date.getMonth() - 3));
    if((s_date.getMonth() + 1) >= 10){
      if(s_date.getDate() < 10){
        start_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        start_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }else{
      if(s_date.getDate() < 10){
        start_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        start_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }
    console.log(start_date);
  }else{
    var start_date = date.slice(0,11);
    console.log(start_date);
    var end_date = date.slice(13);
    console.log(end_date);
  }

  mongoClient.connect(databaseUrl, function(err, database){
    if(err){
      console.error(err);
      console.log("connection error...!");
      res.json("connection error...!");
    }else{ // MongoDB에 성공적으로 connection 되면..
      db = database.db('review');
      if(!filter){
        // 애플리케이션 이름을 컬렉션 이름으로 사용자가 요청한 조건 별로 find 실행
        db.collection(app_name).find({ DATE: { $gte: start_date, $lte: end_date }, OS: { $in: os_filter } }, { _id: 0 }).sort({ [condition]: sc }).toArray(function(err, result){
          if(err) throw err;
          // console.log('review : ' + result);
          res.send(JSON.stringify(result));
        });
      }else{
        db.collection(app_name).find({ DATE: { $gte: start_date, $lte: end_date }, COMMENT: { $regex: filter }, OS: { $in: os_filter } }, { _id: 0 }).sort({ [condition]: sc }).toArray(function(err, result){
          if(err) throw err;
          console.log('result : ' + result);
          res.send(JSON.stringify(result));
        });
      }
    }
  })
});

app.get('/re_search', (req, res) => {
  var app_name = req.query.app_name;
  if(!app_name){
    if(req.session){
      app_name = req.session.appData;
    }
  }
  console.log("app_name : " + app_name);

  var star = req.query.star;

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

  var os_filter = []
  var os = req.query.os;

  if(os == "android"){
    os_filter.push("android")
  } else if (os == "ios"){
    os_filter.push("ios")
  } else {
    os_filter.push("android")
    os_filter.push("ios")
  }
  console.log(os_filter);

  var date = req.query.date;
  if(!date || date == "undefined"){
    var end_date;
    var start_date;
    var e_date = new Date();
    if((e_date.getMonth() + 1) >= 10){
      if(e_date.getDate() < 10){
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }else{
      if(e_date.getDate() < 10){
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }
    console.log(end_date);
    var s_date = new Date(e_date.setMonth(e_date.getMonth() - 3));
    if((s_date.getMonth() + 1) >= 10){
      if(s_date.getDate() < 10){
        start_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        start_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }else{
      if(s_date.getDate() < 10){
        start_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }else{
        start_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }
    }
    console.log(start_date);
  }else{
    var start_date = date.slice(0,11);
    console.log(start_date);
    var end_date = date.slice(13);
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
        db.collection(app_name).find({ DATE: { $gte: start_date, $lte: end_date }, OS: { $in: os_filter } }, { _id: 0 }).sort({ [condition]: sc }).toArray(function(err, result){
          if(err) throw err;
          // console.log('review : ' + result);
          var template = `

          <!doctype html>
          <html>
          <head>
          <title>Result</title>
          <meta charset="utf-8">
          <script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
          <style>

          table {
            font-size: 9pt;
            width: 100%;
            border-top: 1px solid #444444;
            border-collapse: collapse;
          }
          th, td {
            border-bottom: 1px solid #424242;
            padding: 10px;
          }

          tr {
            backgraoud-color: gray;
          }

          .app-name{
            position:fixed;
            top:0
            margin:0;
          }

          .tr-title{
            background-color:#2F5971;
            color:white;
            textalign:center;
            margin-top:50px;
            width:100%;
          }

          .title-st{

            backgraoud-color: gray;

          }

          .review-table{
            backgraoud-color: whith;
          }



          thead {
            position: sticky;
            top: 100px;;
            width:100%;
            background-color:#2F5971;
            color:white;
          }
          </style>

          <script>
          $(function(){
            window.parent.postMessage(
              { functionName : 'closeLoading' },
              'http://3.37.3.24/guest/gu_search'
            );
          })
          </script>


          </head>
          <body>

          <div>
          <h2 class="app-name" style="margin-left:5px;margin-top:0;top:0; left:0;padding-top:30px;padding-bottom:30px; background-color: #F1F2EC; width:100%;height:50px;">${result[0]['APP_NAME']}</h2>
          </div>

          <div style="margin-top:100px;">

          <table class="review-table" style="border="1"  height="85px;" text-align: center; table-layout:auto; margin-top:80px; position:relative;">
          <tr class="title-st tr-title">
          <thead style="table-layout:auto;width:100%;margin-top:30px;">
          <th width="10%"> 유저 이름 </th>
          <th width="10%"> 날짜 </th>
          <th width="5%"> 별점 </th>
          <th width="5%"> 추천 </th>
          <th width="60%"> 내용 </th>
          <th width="10%"> OS </th>
          </thead>
          <tr height="15px;">
          </tr>
          </div>`;
          for(var i=0 ; i < result.length ; i++){
            if(result[i]['STAR'] >= star){
              template += `
              <tr style=" margin-top:40px;">
              <th width="10%">${result[i]['USER']}</th>
              <th width="10%">${result[i]['DATE'].slice(0,10)}</th>
              <th width="5%">${result[i]['STAR']}</th>
              <th width="5%">${result[i]['LIKE']}</th>
              <th width="60%">${result[i]['COMMENT']}</th>
              <th width="10%">${result[i]['OS']}</th>
              </tr>`
            }
          }
          template +=`</table>

          </div>


          </body>
          </html>
          `;

          res.end(template);
        });
      }else{
        db.collection(app_name).find({ DATE: { $gte: start_date, $lte: end_date }, COMMENT: { $regex: filter }, OS: { $in: os_filter } }, { _id: 0 }).sort({ [condition]: sc }).toArray(function(err, result){
          if(err) throw err;
          // console.log('result : ' + result);
          var template = `

          <!doctype html>
          <html>
          <head>
          <title>Result</title>
          <meta charset="utf-8">
          <script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
          <style>

          table {
            font-size: 9pt;
            width: 100%;
            border-top: 1px solid #444444;
            border-collapse: collapse;
          }
          th, td {
            border-bottom: 1px solid #424242;
            padding: 10px;
          }

          tr {
            backgraoud-color: gray;
          }

          .app-name{
            position:fixed;
            top:0
            margin:0;
          }

          .tr-title{
            background-color:#2F5971;
            color:white;
            textalign:center;
            margin-top:50px;
            width:100%;
          }

          .title-st{

            backgraoud-color: gray;

          }

          .review-table{
            backgraoud-color: whith;
          }



          thead {
            position: sticky;
            top: 100px;;
            width:100%;
            background-color:#2F5971;
            color:white;
          }
          </style>

          <script>
          $(function(){
            window.parent.postMessage(
              { functionName : 'closeLoading' },
              'http://3.37.3.24/guest/gu_search'
            );
          })
          </script>


          </head>
          <body>

          <div>
          <h2 class="app-name" style="margin-left:5px;margin-top:0;top:0; left:0;padding-top:30px;padding-bottom:30px; background-color: #F1F2EC; width:100%;height:50px;">${result[0]['APP_NAME']}</h2>
          </div>

          <div style="margin-top:100px;">

          <table class="review-table" style="border="1"  height="85px;" text-align: center; table-layout:auto; margin-top:80px; position:relative;">
          <tr class="title-st tr-title">
          <thead style="table-layout:auto;width:100%;margin-top:30px;">
          <th width="10%"> 유저 이름 </th>
          <th width="10%"> 날짜 </th>
          <th width="5%"> 별점 </th>
          <th width="5%"> 추천 </th>
          <th width="60%"> 내용 </th>
          <th width="10%"> OS </th>
          </thead>
          <tr height="15px;">
          </tr>
          </div>`;
          for(var i=0 ; i < result.length ; i++){
            if(result[i]['STAR'] >= star){
              template += `
              <tr style=" margin-top:40px;">
              <th width="10%">${result[i]['USER']}</th>
              <th width="10%">${result[i]['DATE'].slice(0,10)}</th>
              <th width="5%">${result[i]['STAR']}</th>
              <th width="5%">${result[i]['LIKE']}</th>
              <th width="60%">${result[i]['COMMENT']}</th>
              <th width="10%">${result[i]['OS']}</th>
              </tr>`
            }
          }
          template +=`</table>

          </div>


          </body>
          </html>
          `;

          res.end(template);
        });
      }
    }
  })
});

module.exports = app;
