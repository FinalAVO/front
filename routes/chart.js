const express =require("express");
const axios = require('axios');
const phantom = require("phantom");
const mime = require('mime');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const app = express();


app.get("/", (req, res) =>{
  let mysql_rawdata = fs.readFileSync('/data/front/config/mysql.json');
  let mysql_json = JSON.parse(mysql_rawdata);

  const rdsConnection = mysql.createConnection({
  host     : mysql_json["host"],
  user     : mysql_json["user"],
  password : mysql_json["password"],
  database : mysql_json["database"]
  });

  var user_id = '이선일'
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


      </div>
      </div>

      <!-- 3. 주제별 리뷰 비율-->
      <div style="float:left; ">
      <p class="count-title" > 주제별 리뷰 비율 </p>
      <p class="count-txt-title"> (주제별 리뷰가 전체 리뷰에서 차지하는 비율을 보여줍니다.)</p>
      </br>
      <div class="count-box">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
      <canvas id="pieChart"></canvas>

      <script>
      var xValues1 = ["Italy", "France", "Spain", "USA", "Argentina"];
      var yValues2 = [55, 49, 44, 24, 15];
      var barColors3 = [
        "#b91d47",
        "#00aba9",
        "#2b5797",
        "#e8c3b9",
        "#1e7145"
      ];

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
          title: {
            display: true,
            text: "World Wide Wine Production 2018"
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
          var xValues = [50,60,70,80,90,100,110,120,130,140,150];
          var yValues = [7,8,8,9,9,9,10,11,14,14,15];

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
                yAxes: [{ticks: {min: 6, max:16}}],
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
                title: { display: false,
                        text: 'In My Mind'
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
                return Math.round(value) + '개';
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



});

module.exports = app;
