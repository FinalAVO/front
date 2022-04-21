const express =require("express");
const axios = require('axios');
const phantom = require("phantom");
const mime = require('mime');
const fastcsv = require("fast-csv");
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const download = require('download');
const {PythonShell} =require('python-shell');
const AWS = require('aws-sdk');
const BUCKET_NAME = 's3-001bucket';
const s3 = new AWS.S3({accessKeyId: 'AKIA6RKMBHZQTUOSXPN5',
secretAccessKey:'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'});

const mongoClient = require('mongodb').MongoClient;
var db;
var databaseUrl = 'mongodb://3.34.14.98:46171/'

const app = express();

let word_token = function(options, callback){
  PythonShell.run('/data/front/python_file/word_count.py', options, function (err, result){
    if (err) throw err;
    callback(result[0], result[1], result[2], result[3], result[4]);
  });
}



app.get("/", (req, res) =>{
  res.send("")
})

app.get("/testtest", (req,res) => {
  res.render("member/testtest.ejs");
});


app.post("/", (req, res) =>{
  var collection_name = req.body.collection_name;
  var user_id = req.body.user_data;
  var app_name = req.body.app_name;
  var date = req.body.date;
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
    var start_date = date.slice(0,10);
    console.log(start_date);
    var end_date = date.slice(13);
    console.log(end_date);
  }
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
      var params = [user_id, collection_name, start_date, end_date]
      console.log(collection_name);
      console.log(user_id);

      let options_wc = {
        mode: 'text',
        pythonOptions: ['-u'],
        args: [collection_name, start_date, end_date]
      };

      word_token(options_wc, function(tk1, tk2, tk3, tk4, tk5){

        var sql = 'SELECT * FROM star_report WHERE user_id = ? and app_name = ? and start_date = ? and end_date = ?';
        var sql2 = 'SELECT * FROM star_share_report WHERE user_id = ? and app_name = ? and start_date = ? and end_date = ?';

        rdsConnection.query(sql, params, function(err, result1){
          rdsConnection.query(sql2, params, function(err, result2){

            var oneStar = result2[0]["one_star"];
            var twoStar = result2[0]["two_star"];
            var threeStar = result2[0]["three_star"];
            var fourStar = result2[0]["four_star"];
            var fiveStar = result2[0]["five_star"];
            var start_date = result2[0]["start_date"]
            var end_date = result2[0]["end_date"]

            var a_review = Number(result2[0]["count"]) - (Number(result1[0]["count"]) + Number(result1[1]["count"]) + Number(result1[2]["count"]) + Number(result1[3]["count"]) + Number(result1[4]["count"]) + Number(result1[5]["count"]) + Number(result1[6]["count"]));

            var xValues = [];
            var yValues = [];
            var xValues2 = [];
            var yValues2 = [];

            if (typeof(req.body.subject) === 'string'){
              for(var i=0; i< result1.length; i++){
                if(result1[i]["subject"] == req.body.subject){
                  xValues.push("'" + req.body.subject + "'")
                  yValues.push(result1[i]["avg_star"])
                  xValues2.push("'" + req.body.subject + "'")
                  yValues2.push(result1[i]["count"])
                }
              }
            } else {
              for(var i=0; i< result1.length; i++){
                for (var j=0; j < req.body.subject.length; j++){
                  if(result1[i]["subject"] == req.body.subject[j]){
                    xValues.push("'" + req.body.subject[j] + "'")
                    yValues.push(result1[i]["avg_star"])
                    xValues2.push("'" + req.body.subject[j] + "'")
                    yValues2.push(result1[i]["count"])
                  }
                }
              }
            }

            console.log("xValues: " + xValues)
            console.log("yValues: " + yValues)
            console.log("xValues2: " + xValues2)
            console.log("yValues2: " + yValues2)


            var colors = [];

            var dynamicColors = function() {
              var r = Math.floor(Math.random() * 255);
              var g = Math.floor(Math.random() * 255);
              var b = Math.floor(Math.random() * 255);
              return '"' + "rgba(" + r + "," + g + "," + b + ",0.3)" + '"';
            };

            for (var i=0; i<xValues2.length+1; i++){
              colors.push(dynamicColors());
            }

            // console.log(colors);

            mongoClient.connect(databaseUrl, function(err, database){
              if(err){
                console.error(err);
                console.log("connection error...!");
                res.json("connection error...!");
              }else{
                db = database.db('review');
                db.collection(collection_name).aggregate([
                  {
                    $match: {
                      "DATE" : {
                        $gte: start_date,
                        $lte: end_date
                      }
                    }
                  },{
                    $group: {
                      _id: { "DATE": { $substr: [ "$DATE", 0, 10 ] }},
                      avg_star:{ $avg: "$STAR" },
                      count: { $sum: 1 }
                    }
                  },
                  {
                    $project: {
                      _id: 0,
                      DATE: "$_id.DATE",
                      avg_star: {
                        $round: ["$avg_star", 1]
                      },
                      count: "$count"
                    }
                  },
                  {
                    $sort: { "DATE": 1}
                  }
                ]).toArray(function(err, mongoResult){
                  if(err) throw err;
                  var mongoData = []
                  var mongoData2 = []
                  // console.log(mongoResult);
                  var sum_ = 0;
                  var count_ = 0;

                  for(var i=0; i < mongoResult.length; i = i + 3){
                    if(i+2 < mongoResult.length){
                      sum_ = Math.round(((mongoResult[i].avg_star + mongoResult[i+1].avg_star + mongoResult[i+2].avg_star) / 3) * 10) / 10;
                      count_ = mongoResult[i].count + mongoResult[i+1].count + mongoResult[i+2].count
                    } else if (i+1 < mongoResult.length){
                      sum_ = Math.round(((mongoResult[i].avg_star + mongoResult[i+1].avg_star) / 2) * 10) / 10;
                      count_ = mongoResult[i].count + mongoResult[i+1].count
                    } else {
                      sum_ = mongoResult[i].avg_star
                      count_ = mongoResult[i].count
                    }
                    mongoData.push(JSON.stringify({ x: mongoResult[i].DATE, y: sum_ }))
                    mongoData2.push(JSON.stringify({ x: mongoResult[i].DATE, y: count_ }))
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
                    background-color: #FAFAFA;
                    color: #2f5971;
                    padding: 10px 10px 0px 10px;
                    font-size: 14px;
                    border-radius: 17px;
                    height: 45px;
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
                    margin:30px 0 30px 0px;
                    font-size: 14px;
                  }

                  .count-title2{
                    float: left;
                    margin:30px 0 0 5px;
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
                    margin:30px 0 30px 0px;
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
                  .chartBox1{
                    width: 1300px;
                    position: center;
                    margin-top:535px;
                    background-color: white;
                    border-radius:20px;
                  }

                  .chartBox2{
                    width: 1300px;
                    position: center;
                    margin-top:50px;
                    background-color: white;
                    border-radius:20px;
                  }

                  .count-txt-title2{
                    float: right;
                    margin:32px 40px 0 10px;
                    font-size: 11px;
                    color:gray;
                  }
                  .wordcount>h5 {
                    color:#ed5f48;
                    margin-top:0px;
                  }

                  .wordcount>h3 {
                    margin-top:18px;
                    padding:0px;
                  }

                  </style>
                  </head>
                  <body>
                  <!-- 보고서 가져오기 -->
                  <div class="report-title-box">
                    <h2 style="display:inline;"> ${app_name} </h2>
                    <h2 style="display:inline;color:gray;font-size:14px;"> &nbsp;&nbsp;&nbsp;리뷰 수집 기간: ${start_date} ~ ${end_date} </h2>
                  </div>
                  <div>
                  <hr class="title-hr">
                  </div>
                  <!-- 1. 키워드 워드카운트  -->
                  <div style="margin-right:800px;">
                    <img src="../img/keyword-img.png">
                    <br/>
                    <div class="keyword-box">
                      <div class="wordcount">
                        <h5>TOP 1</h5>
                        <h3>#${tk1} </h3>
                      </div>
                      <div class="wordcount">
                        <h5>TOP 2</h5>
                        <h3>#${tk2} </h3>
                      </div>
                      <div class="wordcount">
                        <h5>TOP 3</h5>
                        <h3>#${tk3} </h3>
                      </div>
                      <div class="wordcount">
                        <h5>TOP 4</h5>
                        <h3>#${tk4} </h3>
                      </div>
                      <div class="wordcount">
                        <h5>TOP 5</h5>
                        <h3>#${tk5} </h3>
                      </div>
                    </div>
                  </div>

                  <div>
                  <hr style="background-color: #e2e2e2;
                  height: 0.5px;
                  margin-top: 100px;
                  margin-left: 5px;
                  width: 100%;"/>
                  </div>

                  <div class="real-report">
                  <!-- 2. 주제별 평점 분석 -->
                  <div style="float:left; display: inline; width: 49%;">
                  <img src="../img/chart1-img.png" width="50px;" height="47px;" style="float:left;display: inline;">
                  <p class="star-title" style="float:left;display: inline;"> 주제별 별점 분석</p>
                  <p class="star-txt-title" style="float:left;display: inline;"> (전체 별점 대비 주제별 별점 평균을 보여줍니다.)</p>
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
                  <img src="../img/chart2-img.png" width="50px;" height="47px;" style="float:left;display: inline; margin-left:45px;">
                  <p class="count-title2" style="float:left;display:inline;"> 주제별 리뷰 비율 </p>
                  <p class="count-txt-title"style="display:inline;" > (주제별 리뷰가 전체 리뷰에서 차지하는 비율을 보여줍니다.)</p>
                  </br>
                  <div class="count-box">
                  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
                  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
                  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-piechart-outlabels"></script>
                  <canvas id="doughnutChart"></canvas>
                  <script>
                  var xValues2 = [${xValues2}];
                  var yValues2 = [${yValues2}];


                  new Chart("doughnutChart", {
                    type: "doughnut",
                    data: {
                      labels: xValues2,
                      datasets: [{
                        backgroundColor: [${colors}],
                        data: yValues2
                      }]
                    },
                    options: {
                      layout: {
                        padding: {
                          bottom: 30,
                          top: 30
                        }
                      },
                      title: {
                        display: true
                      },
                      responsive: true,
                      tooltips: {
                        enabled: false
                      },
                      legend: {
                        position: 'right',
                        display: true
                      },
                      zoomOutPercentage: 55,
                      plugins: {
                        legend: true,
                        outlabels: {
                          text: '%l %p',
                          color: 'white',
                          stretch: 20,
                          font: {
                            resizable: true,
                            minSize: 8,
                            maxSize: 15
                          }
                        }
                      }
                    }
                  });
                  </script>
                  <p class="count-txt-title2">주제별 제외 리뷰 갯수 : ${a_review} 개</p>
                  </div>
                  </div>

                  <div style="padding-top:20px;">
                  <img src="../img/chart3-img.png" width="50px;" height="47px;" style="float:left;display: inline; margin-top:30px;">
                  <p class="count-title" style="margin-right:10px; margin-top:50px;"> 기간 별 리뷰 평점</p>
                  <p class="count-txt-title"style="margin-top:52px;"> (기간별로 리뷰 평점의 변화를 보여줍니다. )</p>
                  </div>
                  <div class="chartBox1">
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

                <div style="margin-top:40px;">
                <img src="../img/chart4-img.png" width="50px;" height="47px;" style="float:left;display: inline;">
                <p class="count-title" style="margin-right:10px;"> 기간 별 리뷰 개수 </p>
                <p class="count-txt-title"> (리뷰의 개수를 기간별로 보여줍니다.)</p>
                </div>
                <br/>
                <div class="chartBox2">
                <canvas id="chart2"></canvas>
                </div>

                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js"></script>
                <script>

                var data2 = [${mongoData2}]
                // console.log(data)

                // const totalDuration = 3000;
                // const delayBetweenPoints = totalDuration / data.length;
                // const previousY = (ctx2) => ctx2.index === 0 ? ctx2.chart.scales.y.getPixelForValue(100) : ctx2.chart.getDatasetMeta(ctx2.datasetIndex).data[ctx2.index - 1].getProps(['y'], true).y;

                var ctx2 = document.getElementById('chart2').getContext('2d');
                var chart2 = new Chart(ctx2, {
                  type: 'line',
                  data: {
                    datasets: [{
                      borderColor: 'red',
                      borderWidth: 2,
                      radius: 1,
                      data: data2,
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
                      delay(ctx2) {
                        if (ctx2.type !== 'data' || ctx2.xStarted) {
                          return 0;
                        }
                        ctx2.xStarted = true;
                        return ctx2.index * delayBetweenPoints;
                      }
                    },
                    y: {
                      type: 'number',
                      easing: 'linear',
                      duration: delayBetweenPoints,
                      from: previousY,
                      delay(ctx2) {
                        if (ctx2.type !== 'data' || ctx2.yStarted) {
                          return 0;
                        }
                        ctx2.yStarted = true;
                        return ctx2.index * delayBetweenPoints;
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
                <img src="../img/chart5-img.png" width="50px;" height="47px;" style="float:left;display: inline;margin-top:20px;">
                <p class="star2-title" style="margin-top:40px;" > 평점 점유율(개) </p>
                <p class="star2-txt-title" style="margin-top:40px;"> (기간별로 별점별 점유율을 보여줍니다.)</p>
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

                  window.parent.postMessage(
                    { functionName : 'closeLoading' },
                    'http://avo-lb-1976068851.ap-northeast-2.elb.amazonaws.com/member/my_report'
                  );
                })
                </script>
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
  console.log(collection_name);

  var date = req.query.demo;
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
    var start_date = date.slice(0,10);
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

app.get('/csv_download', function(req, res){
  var collection_name = req.query.collection_name;
  console.log(collection_name);
  var mongo_file = fs.createWriteStream("reviewData.csv");

  mongoClient.connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    client.db("review").collection(collection_name).find({}, {_id: 0}).sort({ DATE: 1 }).toArray((err, data) => {
        if (err) throw err;
        // console.log(data);
        fastcsv
          .write(data, { headers: true })
          .on("finish", function() {
            console.log("Write to reviewData.csv successfully!");
          })
          .pipe(mongo_file);

        try {
          var file = "/data/front/reviewData.csv";
          var filename = path.basename(file); // 파일 경로에서 파일명(확장자포함)만 추출
          var mimetype = mime.getType(file); // 파일의 타입(형식)을 가져옴
          res.setHeader('Content-disposition', 'attachment; filename=' + filename); // 다운받아질 파일명 설정
          res.setHeader('Content-type', mimetype); // 파일 형식 지정
          var filestream = fs.createReadStream(file, {encoding: 'utf-8'});
          filestream.pipe(res);
          console.log("res");
        } catch (e){
          console.log(e)
        }
      });
  });
});
module.exports = app;
