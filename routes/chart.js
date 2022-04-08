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

const mongoClient = require('mongodb').MongoClient;
var db;
var databaseUrl = 'mongodb://3.34.14.98:46171/'

const app = express();





app.get("/", (req, res) =>{
  res.send("")
})



app.post("/", (req, res) =>{
  var collection_name = req.body.collection_name;
  var user_id = req.body.user_data;
  var app_name = req.body.app_name;
  var start_date = "2021-01-01";
  var end_date = "2022-04-05";
  console.log(req.body);
  var url2 = "http://3.34.14.98:3000/report_crawl"
  axios.get(url2,{
    params:{
      db_name: collection_name,
      app_name: app_name
    }
  }
).then(function(response){
  console.log(response.data);

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

    if(response.data == "Insert Done"){
      let mysql_rawdata = fs.readFileSync('/data/front/config/mysql.json');
      let mysql_json = JSON.parse(mysql_rawdata);

      const rdsConnection = mysql.createConnection({
        host     : mysql_json["host"],
        user     : mysql_json["user"],
        password : mysql_json["password"],
        database : mysql_json["database"]
      });

      var user_id = req.body.user_data;
      var params = [user_id, collection_name]
      console.log(collection_name);
      console.log(user_id);
      // var query = req.query.url_id;
      var sql = 'SELECT * FROM star_report WHERE user_id = ? and app_name = ?';
      var sql2 = 'SELECT * FROM star_share_report WHERE user_id = ? and app_name = ?';

      rdsConnection.query(sql, params, function(err, result1){
        rdsConnection.query(sql2, params, function(err, result2){
          console.log(result1);
          console.log(result2);


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


          var xValues = [];
          var yValues = [];

          for(var i=0; i< result1.length; i++){
            for (var j=0; j < req.body.subject.length; j++){
              if(result1[i]["subject"] == req.body.subject[j]){
                xValues.push("'" + req.body.subject[j] + "'")
                yValues.push(result1[i]["avg_star"])
              }
            }
          }


          var xValues1 = ['"COUNT"'];
          var yValues2 = [a_review];

          for(var i=0; i< result1.length; i++){
            for (var j=0; j < req.body.subject.length; j++){
              if(result1[i]["subject"] == req.body.subject[j]){
                xValues1.push("'" + req.body.subject[j] + "'")
                yValues2.push(result1[i]["count"])
              }
            }
          }

          console.log(xValues1)
          console.log(yValues2)


          var colors = [];

          var dynamicColors = function() {
            var r = Math.floor(Math.random() * 255);
            var g = Math.floor(Math.random() * 255);
            var b = Math.floor(Math.random() * 255);
            return '"' + "rgba(" + r + "," + g + "," + b + ",0.3)" + '"';
          };

          for (var i=0; i<xValues1.length+1; i++){
            colors.push(dynamicColors());
          }

          console.log(colors);

          mongoClient.connect(databaseUrl, function(err, database){
            if(err){
              console.error(err);
              console.log("connection error...!");
              res.json("connection error...!");
            }else{
              db = database.db('review');
              db.collection(collection_name).aggregate([
                {
                  $group: {
                    _id: { "DATE": { $substr: [ "$DATE", 0, 10 ] }},
                    avg_star:{ $avg: "$STAR" }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    DATE: "$_id.DATE",
                    avg_star: {
                      $round: ["$avg_star", 1]
                    }
                  }
                },
                {
                  $sort: { "DATE": 1}
                }
              ]).toArray(function(err, mongoResult){
                if(err) throw err;
                var mongoData = []
                console.log(mongoResult);
                var sum_ = 0;

                for(var i=0; i < mongoResult.length; i = i + 3){
                  if(i+2 < mongoResult.length){
                    sum_ = Math.round(((mongoResult[i].avg_star + mongoResult[i+1].avg_star + mongoResult[i+2].avg_star) / 3) * 10) / 10;
                  } else if (i+1 < mongoResult.length){
                    sum_ = Math.round(((mongoResult[i].avg_star + mongoResult[i+1].avg_star) / 2) * 10) / 10;
                  } else {
                    sum_ = mongoResult[i].avg_star
                  }
                  mongoData.push(JSON.stringify({ x: mongoResult[i].DATE, y: sum_ }))
                }
                // console.log(mongoData);

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
                  background-color: white;
                  border-radius:20px;
                  margin:10px 500px 0 0px;
                }
                .star-box2{
                  float: left;
                  width: 800px;
                  height: auto;
                  background-color: white;
                  border-radius:20px;
                  margin:10px 500px 0 0px;
                }
                .count-title{
                  float: left;
                  margin:30px 0 0 65px;
                  font-size: 14px;
                }
                .count-txt-title{
                  float: left;
                  margin:32px 40px 0 10px;
                  font-size: 11px;
                  color:gray;
                }
                .count-box{
                  float: right;
                  width: 700px;
                  height: 400px;
                  background-color: white;
                  border-radius:20px;
                  margin:10px 0 0 0px;
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
                  width: 800px;
                  height: auto;
                  background-color: white;
                  border-radius:20px;
                  margin:10px 0 100px 0px;
                }

                .star3-box{
                  float: left;
                  width: 1540px;;
                  height: auto;
                  background-color: white;
                  border-radius:20px;
                  margin:10px 0 100px 0px;
                }
                .chartBox{
                  width: 1300px;
                  position: center;
                }

                </style>
                </head>
                <body>
                <div>
                <!-- 보고서 가져오기 -->
                <div class="report-title-box">
                <h2 class="report-title"> ${app_name} </h2>
                <h2 class="report-title"> &nbsp;Review Report </h2>
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
                <div style="float:left; display: inline; width: 49%;">
                <p class="star-title"> 주제별 별점 분석</p>
                <p class="star-txt-title"> (전체 별점 대비 주제별 별점 평균을 보여줍니다.)</p>
                </br>
                <div class="star-box2">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
                <canvas id="mybarChart"></canvas>
                <script>
                var xValues = [${xValues}]
                var yValues = [${yValues}]

                var barColors = [];
                `;

                for(var i = 0; i < xValues.length; i++){
                  if(yValues[i] < result2[0]["avg_star"]){
                    template += `
                    barColors.push('#b7b7b7')
                    `
                  } else {
                    template += `
                    barColors.push('#ed5f48')
                    `
                  }
                }
                template += `

                new Chart("mybarChart", {
                  type: "horizontalBar",
                  data: {
                    labels: xValues,
                    datasets: [{
                      data: yValues,
                      barPercentage: 0.5,
                      barThickness: 35,
                      minBarLength: 2,
                      backgroundColor: barColors
                    }]
                  },
                  options: {
                    responsive: true,
                    annotation: {
                      annotations: [
                        {
                          type: 'line',
                          scaleID: "x-axis-0",
                          value: "${result2[0]["avg_star"]}",
                          mode: "vertical",
                          borderColor: "black",
                          borderWidth: 2,
                          borderDash: [2, 5],
                          label: {
                            enabled: true,
                            content: '평균 평점: ${result2[0]["avg_star"]}'
                          }
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
                      display: true
                    }
                  }
                });
                </script>
                </div>
                </div>
                </div>
                <!-- 3. 주제별 리뷰 비율-->
                <div style="float:right; display: inline; width: 49%; ">
                <p class="count-title" style="margin-right:10px;"> 주제별 리뷰 비율 </p>
                <p class="count-txt-title"> (주제별 리뷰가 전체 리뷰에서 차지하는 비율을 보여줍니다.)</p>
                </br>
                <div class="count-box">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
                <canvas id="doughnutChart"></canvas>
                <script>
                var xValues1 = [${xValues1}];
                var yValues2 = [${yValues2}];


                new Chart("doughnutChart", {
                  type: "doughnut",
                  data: {
                    labels: xValues1,
                    datasets: [{
                      backgroundColor: [${colors}],
                      data: yValues2
                    }]
                  },
                  options: {
                    title: {
                      display: true
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
                          position: 'outside',
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


                <p class="count-title" style="margin-right:10px;"> 기간 별 리뷰 비율 </p>
                <p class="count-txt-title"> (주제별 리뷰가 전체 리뷰에서 차지하는 비율을 보여줍니다.)</p>
                <div class="chartBox">
                <canvas id="myChart"></canvas>
                </div>

                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js"></script>

                <script>

                var data = [${mongoData}]
                console.log(data)

                const totalDuration = 3000;
                const delayBetweenPoints = totalDuration / data.length;
                const previousY = (ctx) => ctx.index === 0 ? ctx.chart.scales.y.getPixelForValue(100) : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;



                var ctx = document.getElementById('myChart').getContext('2d');
                var myChart = new Chart(ctx, {
                  type: 'line',
                  data: {
                    datasets: [{
                      borderColor: 'red',
                      borderWidth: 2,
                      radius: 1,
                      data: data,
                    }
                    ]
                  },
                  options: {
                    animation: {
                     x: {
                       type: 'number',
                       easing: 'linear',
                       duration: delayBetweenPoints,
                       from: NaN, // the point is initially skipped
                       delay(ctx) {
                         if (ctx.type !== 'data' || ctx.xStarted) {
                           return 0;
                         }
                         ctx.xStarted = true;
                         return ctx.index * delayBetweenPoints;
                       }
                     },
                     y: {
                       type: 'number',
                       easing: 'linear',
                       duration: delayBetweenPoints,
                       from: previousY,
                       delay(ctx) {
                         if (ctx.type !== 'data' || ctx.yStarted) {
                           return 0;
                         }
                         ctx.yStarted = true;
                         return ctx.index * delayBetweenPoints;
                       }
                     }
                    },
                    interaction: {
                      intersect: false
                    },
                    plugins: {
                      legend: false
                    }
                  }
                });


                  </script>


                  <!-- 5. 평점 점유율-->
                  <div style="float:left;">
                  <p class="star2-title" > 평점 점유율(개) </p>
                  <p class="star2-txt-title"> (기간별로 별점별 점유율을 보여줍니다.)</p>
                  </br>
                  <div class="star3-box">
                  <canvas id="yolo" style="position: relative; width:1500px; height:200px; margin-left:62px;"></canvas>
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.min.js"></script>
                  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
                  <script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
                  <script>
                  new Chart(document.getElementById("yolo"), {
                    type: 'horizontalBar',
                    data: {
                      labels: ['CURRENT'],
                      datasets: [{
                        label: '1점',
                        data: [${oneStar}],
                        borderColor: "#ffd4b0",
                        backgroundColor: "#ffd4b0",
                      },
                      {
                        label: '2점',
                        data: [${twoStar}],
                        borderColor: "#ffc064",
                        backgroundColor: "#ffc064",
                      },
                      {
                        label: '3점',
                        data: [${threeStar}],
                        borderColor: "#ff9f36",
                        backgroundColor: "#ff9f36",
                      },
                      {
                        label: '4점',
                        data: [${fourStar}],
                        borderColor: "#ff8533",
                        backgroundColor: "#ff8533",
                      },
                      {
                        label: '5점',
                        data: [${fiveStar}],
                        borderColor: "#f25b4c",
                        backgroundColor: "#f25b4c",
                      }]
                    },
                    options: {
                      title: {
                        display: true
                      },
                      responsive: false,
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
                          barThickness: 50
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
                  <script>
                  $(function(){
                    window.parent.postMessage(
                      { functionName : 'closeLoading' },
                      'http://3.37.3.24/member/my_report'
                    );
                  })
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

              }
            })

          });
        });
      }
    }).catch(function(error){
      console.log(error);
      res.send(error)
    });

  }).catch(function(error){
    console.log(error);
    res.send(error)
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
});

app.get('/wordcloud_member', (req, res) => {
  if(req.session.loginData){
    var user_id = req.session.loginData;
  }

  console.log(req.session.appData);
  var collection_name = req.query.db_name;
  collection_name = collection_name.slice(1, -1);
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
        console.log("collection_name : " + collection_name);
        res.redirect('/member/my_wordcloud?db_name=' + collection_name);
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
