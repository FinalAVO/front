const express =require("express");
const axios = require('axios');
const phantom = require("phantom");
const mime = require('mime');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const AWS = require('aws-sdk');
const BUCKET_NAME = 's3-001bucket';
const s3 = new AWS.S3({accessKeyId: 'AKIA6RKMBHZQTUOSXPN5',
secretAccessKey:'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'});

const app = express();


app.get("/", (req, res) =>{
  res.send("hello")
})

app.post("/", (req, res) =>{
  let mysql_rawdata = fs.readFileSync('/data/front/config/mysql.json');
  let mysql_json = JSON.parse(mysql_rawdata);

  const rdsConnection = mysql.createConnection({
  host     : mysql_json["host"],
  user     : mysql_json["user"],
  password : mysql_json["password"],
  database : mysql_json["database"]
  });

  var user_id = '이정후'
  // var query = req.query.url_id;
  var sql = 'SELECT * FROM star_report WHERE user_id = ?';
  var sql2 = 'SELECT * FROM star_share_report WHERE user_id = ?';
  var test;
  rdsConnection.query(sql, user_id, function(err, result1){
    rdsConnection.query(sql2, user_id, function(err, result2){

      var oneStar = result2[0]["one_star"];
      var twoStar = result2[0]["two_star"];
      var threeStar = result2[0]["three_star"];
      var fourStar = result2[0]["four_star"];
      var fiveStar = result2[0]["five_star"];
      var start_date = result2[0]["start_date"]
      var end_date = result2[0]["end_date"]

      var a_review = Number(result2[0]["count"]) - (Number(result1[0]["count"]) + Number(result1[1]["count"]) + Number(result1[2]["count"]) + Number(result1[3]["count"]) + Number(result1[4]["count"]) + Number(result1[5]["count"]) + Number(result1[6]["count"]));

      var date1 = new Date(result1[0]["end_date"]);
      var date2 = new Date(result1[0]["start_date"]);
      var diffDate = date1.getTime() - date2.getTime();
      var dateDays = Math.abs(diffDate / (1000 * 3600 * 24));


      function formatDate(date) {
        var d = new Date(date), month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
        if (month.length < 2)
          month = '0' + month;
        if (day.lengh < 2)
          day = '0' + day;

        return [year, month, day].join('-');
      }

      var center_date = dateDays/2
      var stdate = formatDate(date2);
      var edate = formatDate(date1);
      var center = new Date(date2.setDate(date2.getDate() + center_date));
      var cdate = formatDate(center);

      //
      // console.log(date1); //edate
      // console.log(date2); //stdate
      // console.log(formatDate(date1));
      // console.log(formatDate(date2));


      var template = `
      <!doctype html>
      <html>
      <head>
      <title>Result</title>
      <meta charset="utf-8">
      <link rel="stylesheet"  type="text/css" href="./review_table.css"/>
      <style>
      .report-title-box{
        margin:0px 0 0 0px;
      }
      .report-title{
        float: left;
        margin:0px 0 0 0;
      }
      .title-hr{
        background-color: #2F5971;
        height: 3px;
        margin-top: 20px;
        width: 100%;
        float: left;
      }
      .real-report{
        margin:15px 0 0 0px;
      }
      .keyword-box {
        float: left;
        width:800px;
        margin:15px 500px 0 0px;
      }
      .wordcount{
        display:flex;
        float: left;
        margin-right: 20px;
        background-color: #CECECE;
        color: #2F5971;
        padding: 5px 5px 5px 5px;
        font-size: 14px;
        border-radius: 15px;
      }
      .keyword-title{
        display:flex;
        float: left;
        font-size: 12px;
        color: gray;
        margin:7px 100px 7px 0;
      }
      .star-title{
        float: left;
        margin:30px 0 0 0px;
        font-size: 14px;
      }
      .star-txt-title{
        float: left;
        margin:32px 0 0 10px;
        font-size: 11px;
        color:gray;
      }
      .star-box{
        float: left;
        width: 800px;
        height: auto;
        background-color: #CECECE;
        margin:10px 500px 0 0px;
      }
      .count-title{
        float: left;
        margin:30px 0 0 0px;
        font-size: 14px;
      }
      .count-txt-title{
        float: left;
        margin:32px 0 0 10px;
        font-size: 11px;
        color:gray;
      }
      .count-box{
        display:left;
        float: left;
        width: 800px;
        height: 500px;
        background-color: #CECECE;
        margin:10px 500px 0 0px;
      }
      .star2-title{
        float: left;
        margin:30px 0 0 0px;
        font-size: 14px;
      }
      .star2-txt-title{
        float: left;
        margin:32px 0 0 10px;
        font-size: 11px;
        color:gray;
      }
      .star2-box{
        float: left;
        width: 800px;;
        height: auto;
        background-color: #CECECE;
        margin:10px 500px 0 0px;
      }
      </style>
      </head>
      <body>
      <div>
      <!-- 보고서 가져오기 -->
      <div class="report-title-box">
      <h2 class="report-title"> App1 </h2>
      <h2 class="report-title"> _Review Report </h2>
      <div>
      <hr class="title-hr">
      </div>
      </div>
      <!-- 1. 키워드 워드카운트  -->
      <div style="margin-right:800px;">
      <div class="keyword-box">
      <p class="keyword-title"> Report Keyword Top 5 </p><br/><br/>
      <h3 class="wordcount" >#디자인 </h3>
      <h3 class="wordcount">#안녕 </h3>
      <h3 class="wordcount">#굿 </h3>
      <h3 class="wordcount">#좋아 </h3>
      <h3 class="wordcount">#보고서 </h3>
      </div>
      </div>
      <div class="real-report">
      <!-- 2. 주제별 평점 분석 -->
      <div style="float:left;">
      <p class="star-title"> 주제별 별점 분석</p>
      <p class="star-txt-title"> (전체 별점 대비 주제별 별점 평균을 보여줍니다.)</p>
      </br>
      <div class="star-box">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js"></script>
        <canvas id="mybarChart"></canvas>
        <script>
        var xValues = ["${result1[0]["subject"]}", "${result1[1]["subject"]}", "${result1[2]["subject"]}", "${result1[3]["subject"]}", "${result1[4]["subject"]}", "${result1[5]["subject"]}", "${result1[6]["subject"]}"];
        var yValues = ["${result1[0]["avg_star"]}", "${result1[1]["avg_star"]}", "${result1[2]["avg_star"]}", "${result1[3]["avg_star"]}", "${result1[4]["avg_star"]}", "${result1[5]["avg_star"]}", "${result1[6]["avg_star"]}"];

        var barColors = [];
        `;

        for(var i = 0; i < result1.length; i++){
          if(result1[i]["avg_star"] < result2[0]["avg_star"]){
            template += `
            barColors.push('red')
            `
          } else {
            template += `
            barColors.push('blue')
            `
          }
        }
        template += `

        new Chart("mybarChart", {
          type: "horizontalBar",
          data: {
            labels: xValues,
            datasets: [{
              backgroundColor: barColors,
              data: yValues
            }]
          },
          options: {
            annotation: {
              annotations: [
                {
                  type: 'line',
                  scaleID: "x-axis-0",
                  value: "${result2[0]["avg_star"]}",
                  mode: "vertical",
                  borderColor: "red",
                  borderWidth: 1,
                }
              ]
            },
            scales: {
              xAxes: [{
                ticks: {
                  min: 0,
                  max: 5
                }
              }]
            },
            legend: {
              display: false
            },
            title: {
              display: true,
              text: "주제별 별점 분석"
            }
          }
        });
        </script>
      </div>
      </div>
      </div>
      <!-- 3. 주제별 리뷰 비율-->
      <div style="float:left; ">
      <p class="count-title" > 주제별 리뷰 비율 </p>
      <p class="count-txt-title"> (주제별 리뷰가 전체 리뷰에서 차지하는 비율을 보여줍니다.)</p>
      </br>
      <div class="count-box">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
        <canvas id="pieChart"></canvas>
        <script>
        var xValues1 = ["COUNT", "${result1[0]["subject"]}", "${result1[1]["subject"]}", "${result1[2]["subject"]}", "${result1[3]["subject"]}", "${result1[4]["subject"]}", "${result1[5]["subject"]}", "${result1[6]["subject"]}"];
        var yValues2 = [${a_review} , "${result1[0]["count"]}", "${result1[1]["count"]}", "${result1[2]["count"]}", "${result1[3]["count"]}", "${result1[4]["count"]}", "${result1[5]["count"]}", "${result1[6]["count"]}"];
        var barColors3 = ["#b91d47", "#00aba9", "#2b5797", "#e8c3b9", "#1e7145", "#fff123"];
        new Chart("pieChart", {
          type: "pie",
          data: {
            labels: xValues1,
            datasets: [{
              backgroundColor: barColors3,
              data: yValues2
            }]
          },
          options: {
                  title: { display: true,
                          text: '주제별 리뷰 비율(개)'
                  },
                  responsive: true,
                  tooltips: {
                  enabled: true
                  },
                  legend: {
                  display: true
                  },
                  plugins: {
                  datalabels: {
                  color: 'black',
                  font: {
                  weight: 'bold'
                  },
                  formatter: function(value, context) {
                  return Math.round(value);
                  }
                  }
                  }
          }
          });
        </script>
        </div>
        </div>
        <!-- 2. 기간별 별점 변화도-->
        <div style="float:left;">
        <p class="star-title"> 기간별 별점 변화도 </p>
        <p class="star-txt-title"> (기간별로 변화한 별점 현황을 보여줍니다..)</p>
        </br>
        <div class="star-box">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
          <canvas id="myChart"></canvas>
          <script>
            var xValues = ["${stdate}", "${cdate}", "${edate}"];
            var yValues = [1, 2, 4];
            new Chart("myChart", {
              type: "line",
              data: {
                labels: xValues,
                datasets: [{
                  fill: false,
                  lineTension: 0,
                  backgroundColor: "rgba(0,0,255,1.0)",
                  borderColor: "rgba(0,0,255,0.1)",
                  data: yValues
                }]
              },
              options: {
                legend: {display: false},
                scales: {
                  yAxes: [{ticks: {min: 0, max:5}}],
                }
              }
            });
          </script>
      </div>
      </div>
      <!-- 5. 평점 점유율-->
      <div style="float:left;">
      <p class="star2-title" > 평점 점유율 </p>
      <p class="star2-txt-title"> (기간별로 별점별 점유율을 보여줍니다.)</p>
      </br>
      <div class="star2-box">
         <canvas id="canvas" height="50"></canvas>
         <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.min.js"></script>
         <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
         <script>
            new Chart(document.getElementById("canvas"), {
            type: 'horizontalBar',
            data: {
                    labels: ['CURRENT'],
                    datasets: [{
                    label: '1점',
                    data: [${oneStar}],
                    borderColor: "rgba(209, 216, 224, 1)",
                    backgroundColor: "rgba(209, 216, 224, 0.5)",
                    },
                    {
                    label: '2점',
                    data: [${twoStar}],
                    borderColor: "rgba(75, 101, 132, 1)",
                    backgroundColor: "rgba(75, 101, 132, 0.5)",
                    },
                    {
                    label: '3점',
                    data: [${threeStar}],
                    borderColor: "rgba(209, 216, 224, 1)",
                    backgroundColor: "rgba(209, 216, 224, 0.5)",
                    },
                    {
                    label: '4점',
                    data: [${fourStar}],
                    borderColor: "rgba(75, 101, 132, 1)",
                    backgroundColor: "rgba(75, 101, 132, 0.5)",
                    },
                    {
                    label: '5점',
                    data: [${fiveStar}],
                    borderColor: "rgba(209, 216, 224, 1)",
                    backgroundColor: "rgba(209, 216, 224, 0.5)",
                    }]
            },
            options: {
                    title: { display: true,
                            text: '평점 점유율'
                    },
                    responsive: true,
                    tooltips: {
                    enabled: false
                    },
                    hover: {
                    mode: 'nearest',
                    intersect: true
                    },
                    legend: {
                    display: true
                    },
                    scales: {
                    xAxes: [{
                            display: false,
                            stacked: true,
                            barThickness: 6
                    }],
                    yAxes: [{
                            display: false,
                            stacked: true,
                            barThickness: 30
                    }]
                    },
                    plugins: {
                    datalabels: {
                    color: 'black',
                    font: {
                    weight: 'bold'
                    },
                    formatter: function(value, context) {
                    return Math.round(value);
                    }
                    }
                    }
            }
            });
        </script>
      </div>
      </div>
      </div>
      </div>
      </body>
      </html>
      `;
      res.end(template);
    });
  });

app.get('/wordcloud', (req, res) => {
  if(req.session.loginData){
    var user_id = req.session.loginData;
  }else{
    var rand = "";
    for(var i = 0; i < 6; i++){
      rand += String(Math.floor(Math.random() * (9 - 0)) + 0);
    }
    var user_id = "A" + rand;
  }

  console.log(req.session.appData);
  if(req.session.appData != null){
    var collection_name = req.session.appData;
  }else{
    res.end();
  }

  var date = req.query.date;
  console.log("original date in wordcloud : " + date);
  if(!date || date == "undefined"){
    var e_date = new Date();
    if((e_date.getMonth() + 1) >= 10){
      if(e_date.getDate() >= 10){
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }
    }else{
      if(e_date.getDate() >= 10){
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }
    }
    console.log(end_date);
    var s_date = new Date(e_date.setMonth(e_date.getMonth() - 3));
    if((s_date.getMonth() + 1) >= 10){
      if(s_date.getDate() >= 10){
        start_date = s_date.getFullYear() + '-' + (s_date.getMonth() + 1) + '-' + s_date.getDate();
      }else{
        start_date = s_date.getFullYear() + '-' + (s_date.getMonth() + 1) + '-0' + s_date.getDate();
      }
    }else{
      if(s_date.getDate() >= 10){
        start_date = s_date.getFullYear() + '-0' + (s_date.getMonth() + 1) + '-' + s_date.getDate();
      }else{
        start_date = s_date.getFullYear() + '-0' + (s_date.getMonth() + 1) + '-0' + s_date.getDate();
      }
    }
    console.log(start_date);
  }else{
    var start_date = date.slice(0,11);
    console.log(start_date);
    var end_date = date.slice(13);
    console.log(end_date);
  }

  var url = "http://13.125.125.198:3000/wordcount";
  axios.post(url,
    {
      collection_name: collection_name,
      user_id: user_id,
      start_date: start_date,
      end_date: end_date
    }
  ).then(function(response){
    console.log(response.data);
    var filename = response.data;
    const downloadFile = (fileName, callback) => {
      const params = {
        Bucket: 's3-001bucket',
        Key: response.data,
      };
        s3.getObject(params, function(err, data) {
          if (err) { throw err;}
          fs.writeFileSync(fileName, data.Body);
          callback('done');
        });
    };
    downloadFile("public/" + response.data, function(message){
      if(message == "done"){
        req.session.csvData = response.data;
        req.session.save(error => {
          if(error) console.log('error : ' + error);
        });
        res.redirect('/test');
      }else{
        res.end();
      }
    });
  }).catch(function(error){
    console.log(error);
    res.send(error)
  })
})

});
app.get('/wordcloud_member', (req, res) => {
  if(req.session.loginData){
    var user_id = req.session.loginData;
  }

  console.log(req.session.appData);
  var collection_name = req.query.db_name;
  collection_name = collection_name.slice(0, 1);
  collection_name = collection_name.slice(-1, -2);
  console.log(collection_name);

  var date = req.query.date;
  console.log("original date in wordcloud_member : " + date);
  if(!date || date == "undefined"){
    var e_date = new Date();
    if((e_date.getMonth() + 1) >= 10){
      if(e_date.getDate() >= 10){
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }
    }else{
      if(e_date.getDate() >= 10){
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-' + e_date.getDate();
      }else{
        end_date = e_date.getFullYear() + '-0' + (e_date.getMonth() + 1) + '-0' + e_date.getDate();
      }
    }
    console.log(end_date);
    var s_date = new Date(e_date.setMonth(e_date.getMonth() - 3));
    if((s_date.getMonth() + 1) >= 10){
      if(s_date.getDate() >= 10){
        start_date = s_date.getFullYear() + '-' + (s_date.getMonth() + 1) + '-' + s_date.getDate();
      }else{
        start_date = s_date.getFullYear() + '-' + (s_date.getMonth() + 1) + '-0' + s_date.getDate();
      }
    }else{
      if(s_date.getDate() >= 10){
        start_date = s_date.getFullYear() + '-0' + (s_date.getMonth() + 1) + '-' + s_date.getDate();
      }else{
        start_date = s_date.getFullYear() + '-0' + (s_date.getMonth() + 1) + '-0' + s_date.getDate();
      }
    }
    console.log(start_date);
  }else{
    var start_date = date.slice(0,11);
    console.log(start_date);
    var end_date = date.slice(13);
    console.log(end_date);
  }

  var url = "http://13.125.125.198:3000/wordcount";
  axios.post(url,
    {
      collection_name: collection_name,
      user_id: user_id,
      start_date: start_date,
      end_date: end_date
    }
  ).then(function(response){
    console.log(response.data);
    var filename = response.data;
    const downloadFile = (fileName, callback) => {
      const params = {
        Bucket: 's3-001bucket',
        Key: response.data,
      };
        s3.getObject(params, function(err, data) {
          if (err) { throw err;}
          fs.writeFileSync(fileName, data.Body);
          callback('done');
        });
    };
    downloadFile("public/" + response.data, function(message){
      if(message == "done"){
        req.session.csvData = response.data;
        req.session.save(error => {
          if(error) console.log('error : ' + error);
        });
        res.redirect('/member/my_wordcloud');
      }else{
        res.end();
      }
    });
  }).catch(function(error){
    console.log(error);
    res.send(error)
  })
})

module.exports = app;
