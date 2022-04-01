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
  res.render('test.ejs', {session: req.session});
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

  var url = "http://3.34.14.98:3000/register";

  axios.post(url,
    {
      app_name: req.query.app_name,
      user_id: req.session.loginData,
    }
  ).then(function(response){
    var user_id = req.session.loginData
    sql = 'SELECT * FROM user_app WHERE user_id = ?';
    rdsConnection.query(sql, [user_id], function(err, result){
      res.render('member/my_app.ejs', { session: req.session, data: result });
    });
  }).catch(function(error){
    console.log(error);
    res.send(error)
  })
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

  var sql1 = 'SELECT * FROM user_app WHERE user_id = "' + user_id + '" and db_name = ' + db_name;
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

//----------------------------------------------------------

// app.get("/review/report", (req, res) =>{
//
//
//
//
//   var template = `
//
//   <!doctype html>
//   <html>
//   <head>
//   <title>Result</title>
//   <meta charset="utf-8">
//   <link rel="stylesheet"  type="text/css" href="./review_table.css"/>
//
//   <style>
//
//   .report-title-box{
//     margin:0px 0 0 0px;
//   }
//
//   .report-title{
//     float: left;
//     margin:0px 0 0 0;
//   }
//
//   .title-hr{
//     background-color: #2F5971;
//     height: 3px;
//     margin-top: 20px;
//     width: 100%;
//     float: left;
//
//   }
//
//
//   .real-report{
//     margin:15px 0 0 0px;
//   }
//   .keyword-box {
//     float: left;
//     width:800px;
//     margin:15px 500px 0 0px;
//   }
//
//   .wordcount{
//     display:flex;
//     float: left;
//     margin-right: 20px;
//     background-color: #CECECE;
//     color: #2F5971;
//     padding: 5px 5px 5px 5px;
//     font-size: 14px;
//     border-radius: 15px;
//   }
//
//
//   .keyword-title{
//     display:flex;
//     float: left;
//     font-size: 12px;
//     color: gray;
//     margin:7px 100px 7px 0;
//   }
//
//   .star-title{
//     float: left;
//     margin:30px 0 0 0px;
//     font-size: 14px;
//   }
//
//   .star-txt-title{
//     float: left;
//     margin:32px 0 0 10px;
//     font-size: 11px;
//     color:gray;
//   }
//
//   .star-box{
//
//     float: left;
//     width: 800px;
//     height: 150px;
//     background-color: #CECECE;
//     margin:10px 500px 0 0px;
//   }
//
//   .count-title{
//     float: left;
//     margin:30px 0 0 0px;
//     font-size: 14px;
//   }
//
//   .count-txt-title{
//     float: left;
//     margin:32px 0 0 10px;
//     font-size: 11px;
//     color:gray;
//   }
//
//   .count-box{
//     display:left;
//     float: left;
//     width: 800px;
//     height: 500px;
//     background-color: #CECECE;
//     margin:10px 500px 0 0px;
//   }
//
//   .star2-title{
//     float: left;
//     margin:30px 0 0 0px;
//     font-size: 14px;
//   }
//
//   .star2-txt-title{
//     float: left;
//     margin:32px 0 0 10px;
//     font-size: 11px;
//     color:gray;
//   }
//
//   .star2-box{
//     float: left;
//     width: 800px;;
//     height: 150px;
//     background-color: #CECECE;
//     margin:10px 500px 0 0px;
//   }
//
//   </style>
//   </head>
//   <body>
//   <div>
//   <!-- 보고서 가져오기 -->
//
//   <div class="report-title-box">
//   <h2 class="report-title"> App1 </h2>
//   <h2 class="report-title"> _Review Report </h2>
//   <div>
//   <hr class="title-hr">
//   </div>
//   </div>
//
//   <!-- 1. 키워드 워드카운트  -->
//   <div style="margin-right:800px;">
//   <div class="keyword-box">
//   <p class="keyword-title"> Report Keyword Top 5 </p><br/><br/>
//   <h3 class="wordcount" >#디자인 </h3>
//   <h3 class="wordcount">#안녕 </h3>
//   <h3 class="wordcount">#굿 </h3>
//   <h3 class="wordcount">#좋아 </h3>
//   <h3 class="wordcount">#보고서 </h3>
//   </div>
//   </div>
//
//   <div class="real-report">
//   <!-- 2. 주제별 평점 분석 -->
//   <div style="float:left;">
//   <p class="star-title"> 주제별 별점 분석</p>
//   <p class="star-txt-title"> (전체 별점 대비 주제별 별점 평균을 보여줍니다.)</p>
//   </br>
//   <div class="star-box">
//   chartjs
//   </div>
//   </div>
//
//   <!-- 3. 주제별 리뷰 비율-->
//   <div style="float:left; ">
//   <p class="count-title" > 주제별 리뷰 비율 </p>
//   <p class="count-txt-title"> (주제별 리뷰가 전체 리뷰에서 차지하는 비율을 보여줍니다.)</p>
//   </br>
//   <div class="count-box"> chartjs
//   </div>
//   </div>
//
//   <!-- 2. 기간별 별점 변화도-->
//   <div style="float:left;">
//   <p class="star-title"> 기간별 별점 변화도 </p>
//   <p class="star-txt-title"> (기간별로 변화한 별점 현황을 보여줍니다..)</p>
//   </br>
//   <div class="star-box"> chartjs
//   </div>
//   </div>
//
//
//
//
//   <!-- 5. 평점 점유율-->
//   <div style="float:left;">
//   <p class="star2-title" > 평점 점유율 </p>
//   <p class="star2-txt-title"> (기간별로 별점별 점유율을 보여줍니다.)</p>
//   </br>
//   <div class="star2-box">
//      <canvas id="canvas" height="50"></canvas>
//      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
// <script>
//     new Chart(document.getElementById("canvas"), {
//     type: 'horizontalBar',
//     data: {
//             labels: ['CURRENT'],
//             datasets: [{
//             label: '1점',
//             data: [30],
//             borderColor: "rgba(209, 216, 224, 1)",
//             backgroundColor: "rgba(209, 216, 224, 0.5)",
//             },
//             {
//             label: '2점',
//             data: [40],
//             borderColor: "rgba(75, 101, 132, 1)",
//             backgroundColor: "rgba(75, 101, 132, 0.5)",
//             },
//             {
//             label: '3점',
//             data: [10],
//             borderColor: "rgba(209, 216, 224, 1)",
//             backgroundColor: "rgba(209, 216, 224, 0.5)",
//             },
//             {
//             label: '4점',
//             data: [20],
//             borderColor: "rgba(75, 101, 132, 1)",
//             backgroundColor: "rgba(75, 101, 132, 0.5)",
//             },
//             {
//             label: '5점',
//             data: [20],
//             borderColor: "rgba(75, 101, 132, 1)",
//             backgroundColor: "rgba(75, 101, 132, 0.5)",
//             }]
//     },
//     options: {
//             title: { display: false,
//                     text: 'In My Mind'
//             },
//             responsive: true,
//             tooltips: {
//             enabled: false
//             },
//             hover: {
//             mode: 'nearest',
//             intersect: true
//             },
//             legend: {
//             display: true
//             },
//             scales: {
//             xAxes: [{
//                     display: false,
//                     stacked: true,
//                     barThickness: 6
//             }],
//             yAxes: [{
//                     display: false,
//                     stacked: true,
//                     barThickness: 30
//             }]
//             },
//             plugins: {
//             datalabels: {
//             color: 'black',
//             font: {
//             weight: 'bold'
//             },
//             formatter: function(value, context) {
//             return Math.round(value) + '%';
//             }
//             }
//             }
//     }
//     });
//
//     </script>
//
//   </div>
//   </div>
//   </div>
//
//
//   </div>
//
//   </body>
//   </html>
//   `;
//   res.end(template);
// });



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
  app_name = encodeURI(app_name.replace(/ /gi, ''));
  console.log(app_name);

  var filter = encodeURI(req.body.filter);
  var condition = req.body.condition;
  var os = req.body.os;
  var date = req.body.date;

  var url = 'http://3.34.14.98:3000/scrap?app_name=' + app_name;
  //var url = 'http://3.37.3.24/test';
  var star = req.body.star;

  console.log('전송 url : ' + url)

  function slowfunc(callback){
    axios.get(url).then(function (res){
      console.log(res.data);
      app_name = encodeURI(res.data);
      var real_app = res.data;
      req.session.appData = real_app;
      req.session.save(error => {
        if(error) console.log('error : ' + error);
      });
      console.log(req.session.appData);
      console.log(req.session);
      url = 'http://3.37.3.24/search?app_name=' + app_name + '&filter=' + filter + '&condition=' + condition + '&os=' + os + '&date=' + date;
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
        <th width="15%"> 유저 이름 </th>
        <th width="15%"> 날짜 </th>
        <th width="5%"> 별점 </th>
        <th width="5%"> 추천 </th>
        <th width="60%"> 내용 </th>
        </thead>
        <tr height="15px;">
        </tr>
        </div>`;
        for(var i=0 ; i < result.length ; i++){
          if(result[i]['STAR'] >= star){
            template += `
            <tr style=" margin-top:40px;">
            <th width="15%">${result[i]['USER']}</th>
            <th width="15%">${result[i]['DATE'].slice(0,10)}</th>
            <th width="5%">${result[i]['STAR']}</th>
            <th width="5%">${result[i]['LIKE']}</th>
            <th width="60%">${result[i]['COMMENT']}</th>
            </tr>`
          }
        }
        template +=`</table>

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
    phantom.create().then(function (ph) {
      ph.createPage().then(function (page) {
        page
        .open(
          url
        )
        .then(setTimeout(function (status) {
          page.render("report.pdf")
          .then(function () {
            console.log("Page Rendered");
            ph.exit();
            callback();
          });
        }, 2000));
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
