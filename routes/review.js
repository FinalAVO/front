const express =require("express");
const axios = require('axios');
const phantom = require("phantom");
const mime = require('mime');
const fs = require('fs');
const path = require('path');

const app = express();

const mysql = require('mysql');
let mysql_rawdata = fs.readFileSync('/data/front/config/mysql.json');
let mysql_json = JSON.parse(mysql_rawdata);

const rdsConnection = mysql.createConnection({
  host     : mysql_json["host"],
  user     : mysql_json["user"],
  password : mysql_json["password"],
  database : mysql_json["database"]
});



// 비회원

app.get('/test', (req, res) => {
  res.render('member/test.ejs', {session: req.session});
})

app.get('/', (req, res) => {
  console.log(req.session);

  res.render('index.ejs', { session: req.session });
})

app.get('/guest/gu_search', (req, res) => {
  res.render('guest/gu_search.ejs', { session: req.session, name: req.session.appData });
});


app.get('/guest/gu_gu_guest', (req, res) => {
  res.render('guest/gu_gu_guest.ejs', { session: req.session });
});

app.get('/guest/gu_wordcloud', (req, res) => {
  res.render('guest/gu_wordcloud.ejs', { session: req.session });
});


//로그인

app.get('/login/login', (req, res) => {
  res.render('login/login.ejs', { session: req.session });
});


app.get('/login/signup', (req, res) => {
  res.render('login/signup.ejs', { session: req.session });
});

app.get('/login/signup_', (req, res) => {
  res.render('login/signup_.ejs', { session: req.session });
});


app.get('/login/find', (req, res) => {
  res.render('login/find.ejs', { session: req.session });
});

app.get('/login/findId', (req, res) => {
  res.render('login/findId.ejs', { session: req.session });
});

app.get('/login/findIdCheck', (req, res) => {
  res.render('login/findIdCheck.ejs', { session: req.session });
});

app.get('/login/findPw', (req, res) => {
  res.render('login/findPw.ejs', { session: req.session });
});

app.get('/login/findPwCheck', (req, res) => {
  res.render('login/findPwCheck.ejs', { session: req.session });
});

app.get('/mypage/pw_change', (req, res) => {
  res.render('mypage/pw_change.ejs', { session: req.session });
});

app.get('/mypage/email_change', (req, res) => {
  res.render('mypage/email_change.ejs', { session: req.session });
});

app.get('/mypage/delete_user', (req, res) => {
  res.render('mypage/delete_user.ejs', { session: req.session });
});


// 회원

app.get('/member/my_app', (req, res) => {
  if(req.session.loginData){
    var user_id = req.session.loginData

    sql = 'SELECT * FROM user_app WHERE user_id = ?';
    rdsConnection.query(sql, [user_id], function(err, result){
      res.render('member/my_app.ejs', { session: req.session, data: result });
    });

  }else{
    res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
    template = `<script>
    alert('로그인 후 이용해주세요!');
    location.href="/login/login"
    </script>`;
    res.end(template);
  }
});

app.get('/member/register_app', (req, res) => {
  if(req.session.loginData){
    var url = "http://3.34.14.98:3000/register";

    axios.post(url,
      {
        app_name: req.query.app_name,
        user_id: req.session.loginData,
      }
    ).then(function(response){
      if (response.data == "Already exist"){
        console.log("yolo");
        res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
        template = `<script>
        alert('이미 등록된 앱 입니다!');
        location.href="/member/add_myapp"
        </script>`;
        res.end(template);
      } else {
        var user_id = req.session.loginData
        sql = 'SELECT * FROM user_app WHERE user_id = ?';
        rdsConnection.query(sql, [user_id], function(err, result){
          res.render('member/my_app.ejs', { session: req.session, data: result });
        });
      }
    }).catch(function(error){
      console.log(error);
      res.send(error)
    })
  } else {
    res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
    template = `<script>
    alert('로그인 후 이용해주세요!');
    location.href="/login/login"
    </script>`;
    res.end(template);
  }
});

app.get('/member/remove_app', (req, res) => {
  var user_id = req.session.loginData
  var db_name = req.query.db_name

  sql = 'DELETE FROM user_app WHERE user_id = "' + user_id + '" and db_name = "' + db_name + '"';
  rdsConnection.query(sql, function(err){
    sql = 'SELECT * FROM user_app WHERE user_id = ?';
    rdsConnection.query(sql, [user_id], function(err, result){
      res.render('member/my_app.ejs', { session: req.session, data: result });
    });
  });
});


app.get('/member/my_report', (req, res) => {
  if(req.session.loginData){
    var user_id = req.session.loginData
    var db_name = req.query.db_name

    if (!db_name){
      var sql = 'SELECT * FROM user_app WHERE user_id = ?';
      rdsConnection.query(sql, [user_id], function(err, result){
        if (result.length == 0){
          res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
          template = `<script>
          alert('앱 등록 후 이용해주세요!');
          location.href="/member/my_app"
          </script>`;
          res.end(template);
        } else {
          db_name = result[0].db_name
          var sql1 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '" and db_name = "' + db_name + '"';
          rdsConnection.query(sql1, function(err, my_app){
            var sql2 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '"';
            rdsConnection.query(sql2, function(err, app_list){
              res.render('member/my_report.ejs', { session: req.session , my_app: my_app, app_list: app_list});
            });
          });
        }
      });
    } else {
      var sql1 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '" and db_name = ' + db_name;
      rdsConnection.query(sql1, function(err, my_app){
        var sql2 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '"';
        rdsConnection.query(sql2, function(err, app_list){
          res.render('member/my_report.ejs', { session: req.session , my_app: my_app, app_list: app_list});
        });
      });
    }


  }else{
    res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
    template = `<script>
    alert('로그인 후 이용해주세요!');
    location.href="/login/login"
    </script>`;
    res.end(template);
  }
});

app.get('/member/my_search', (req, res) => {
  var user_id = req.session.loginData
  var db_name = req.query.db_name

  var sql1 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '" and db_name = ' + db_name;
  rdsConnection.query(sql1, function(err, my_app){
    var sql2 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '"';
    rdsConnection.query(sql2, function(err, app_list){
      res.render('member/my_search.ejs', { session: req.session , my_app: my_app, app_list: app_list});
    });
  });

});

app.get('/member/my_wordcloud', (req, res) => {
  var user_id = req.session.loginData
  var db_name = req.query.db_name
  console.log("db_name in my_wordcloud : " + db_name);

  var sql1 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '" and db_name = "' + db_name + '"';
  rdsConnection.query(sql1, function(err, my_app){
    var sql2 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '"';
    rdsConnection.query(sql2, function(err, app_list){
      res.render('member/my_wordcloud.ejs', { session: req.session , my_app: my_app, app_list: app_list});
    });
  });

});

app.get('/member/add_myapp', (req, res) => {
  res.render('member/add_myapp.ejs', { session: req.session });
});



// 마이페이지

app.get('/mypage/my_main', (req, res) => {
  res.render('mypage/my_main.ejs', { session: req.session });
});

app.get('/mypage/basic_information', (req, res) => {
  res.render('mypage/basic_information.ejs', { session: req.session });
});


app.get('/mypage/preferences', (req, res) => {
  res.render('mypage/preferences.ejs', { session: req.session });
});


app.get('/mypage/security', (req, res) => {
  res.render('mypage/security.ejs', { session: req.session });
});






//리뷰 가져오기
app.get("/review", (req, res) =>{

  var template = `

  <!doctype html>
  <html>
  <head>
  <title>Result</title>
  <meta charset="utf-8">

  </head>
  <body>

  </body>
  </html>
  `;
  res.end(template);
});



//앱 추가하기
app.get("/app_add", (req, res) =>{

  var template = `

  <!doctype html>
  <html>
  <head>
  <title>Result</title>
  <meta charset="utf-8">
  <style>

  body{
    text-align: center;
    align-items: center;
  }

  .app-s-table{
    font-weight: 400;
    background-color: #F1F2EC;
    color:black;
    min-width : 100px;
    border-radius: 8px;
    height : 70px;
    overflow : scroll;
    box-shadow: 0px 0px 10px 3px rgba(190, 190, 190, 0.6);
  }

  table {
    margin-left: auto;
    margin-right:auto;
    align-items:center;
    text-align: center;
    font-size: 9pt;
    width: 60%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  th {
    border-bottom: 1px solid #2F5971;
    padding: 10px;
  }

  tr {
    backgraoud-color: gray;
  }
  </style>
  </head>
  <body>

  <div>
  <table class="app-s-table dropdown-content">
  <tr>
  <td>첫번째</td>
  </tr>

  <tr>
  <td>두번째</td>
  </tr>

  <tr>
  <td>세번째</td>
  </tr>
  </table>
  </div>
  </body>
  </html>
  `;
  res.end(template);
});

//----------------------------------------------------------

//get
app.post('/review/url', (req, response) => {

  var app_name = req.body.app_name;
  console.log(app_name);
  app_name = encodeURI(app_name.replace(/ /gi, ''));
  console.log(app_name);

  var filter = encodeURI(req.body.filter);
  var condition = req.body.condition;
  var os = req.body.os;
  console.log(os);
  var date = req.body.date;

  var url = 'http://3.34.14.98:3000/scrap?app_name=' + app_name;
  //var url = 'http://3.37.3.24/test';
  var star = req.body.star;

  console.log('전송 url : ' + url)

  function slowfunc(callback){
    axios.get(url).then(function (res){
      // console.log(res.data);
      app_name = encodeURI(res.data);
      // console.log(app_name);
      var real_app = res.data;
      req.session.appData = real_app;
      req.session.save(error => {
        if(error) console.log('error : ' + error);
      });
      // console.log(req.session.appData);
      // console.log(req.session);
      url = 'http://3.37.3.24/search?app_name=' + app_name + '&filter=' + filter + '&condition=' + condition + '&os=' + os + '&date=' + date;
      console.log(url);
      //url = 'http://3.37.3.24/test2';
      callback();
    }).catch(function (error){
      console.error(error);
      var template = `

      <!doctype html>
      <html>
      <head>
      <title>Result</title>
      <meta charset="utf-8">
      <link rel="stylesheet"  type="text/css" href="./review_table.css"/>
      <script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
      <style>
      h2 {
        text-align: center;
        color: #015c93;

      }


      </style>

      <script>
      $(function(){
        window.parent.postMessage(
          { functionName : 'closeLoading' },
          'http://3.37.3.24/guest/gu_search'
        );

        window.parent.postMessage(
          { functionName : 'closeLoading' },
          'http://3.37.3.24/member/my_search'
        );
      })
      </script>
      </head>
      <body>
      <div>
      <h2 style="text-align: center;"> Hello Reviewer! </h2>
      </div>

      </body>
      </html>
      `;

      response.send(template);

    }).finally(function (){
      console.log("Level 1 done");
    });
  }

  var sec_req = function(){
    axios.get(url).then(function (resp){
      if(resp.data != ""){
        var result = resp.data;
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

        .iframe-preview::-webkit-scrollbar{
          width: 12px;
        }

        .iframe-preview::-webkit-scrollbar-thumb {
           background-color: #BFBFBF;
           border-radius: 20px;
         }

         .iframe-preview::-webkit-scrollbar-track {
           background-color: none;
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

        <div class="iframe-preview">
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
        </div>

        </body>
        </html>
        `;

        response.end(template);
      }else{
        console.log("request not respond");
      }
    }).catch(function (error){
      console.error(error);
    }).finally(function() {
      console.log("finally done");
    })
  }

  slowfunc(sec_req);
});

app.post('/report', (req, res) => {
  var collection_name = req.body.collection_name;
  var user_id = req.body.user_id;
  var start_date = "2021-12-25";
  var end_date = "2022-03-15";

  var url = "http://13.125.62.209:3000/analysis";

  axios.post(url,
    {
      collection_name: collection_name,
      user_id: user_id,
      start_date: start_date,
      end_date: end_date
    }
  ).then(function(response){
    console.log(response.data);
    res.send(response.data)
  }).catch(function(error){
    console.log(error);
    res.send(error)
  })
})

app.get('/pdfCreate', (req, res) => {



  function slowfunc2(callback){
    console.log("pdf create Start");

    var url = "http://3.37.3.24/review/chart";

    var settings = {
      operation: "POST",
      encoding: "utf8",
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
            collection_name: "A카카오톡KakaoTalk",
            user_data: req.session.loginData,
            start_date: "2022-01-03",
            end_date: "2022-04-01",
            DESIGN: "DESIGN",
            PROFILE: "PROFILE",
            RESOURCE: "RESOURCE",
            SPEED: "SPEED",
            SAFETY: "SAFETY",
            UPDATE: "UPDATE",
            REMOVE: "REMOVE"
      })
    };

    var data = 'collection_name="A카카오톡KakaoTalk"&user_data=req.session.loginData&start_date="2022-01-03"&end_date="2022-04-01"';
    phantom.create().then(function (ph) {
      ph.createPage().then(function (page) {
        page
        .open(
          url,
          settings
        )
        .then(setTimeout(function (status) {
          page.render("report.pdf")
          .then(function () {
            console.log("Page Rendered");
            ph.exit();
            callback();
          });
        }, 7000));
      });
    });
  }

  var sec_func = function(){
    console.log("pdf download Start");

    var file = "/data/front/report.pdf";

    try {
      if (fs.existsSync(file)) { // 파일이 존재하는지 체크
        var filename = path.basename(file); // 파일 경로에서 파일명(확장자포함)만 추출
        var mimetype = mime.getType(file); // 파일의 타입(형식)을 가져옴

        res.setHeader('Content-disposition', 'attachment; filename=' + filename); // 다운받아질 파일명 설정
        res.setHeader('Content-type', mimetype); // 파일 형식 지정

        var filestream = fs.createReadStream(file);
        filestream.pipe(res);
      } else {
        res.send('해당 파일이 없습니다.');
        return;
      }
    } catch (e) { // 에러 발생시
      console.log(e);
      res.send('파일을 다운로드하는 중에 에러가 발생하였습니다.');
      return;
    }
  }

  slowfunc2(sec_func);
})

module.exports = app;
