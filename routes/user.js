const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const fs = require('fs');
const request = require('request');

const saltRounds = 10;

var CryptoJS = require('crypto-js');
var SHA256 = require('crypto-js/sha256');
var Base64 = require('crypto-js/enc-base64');

axios.defaults.withCredentials = true

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

let mysql_rawdata = fs.readFileSync('/data/front/config/mysql.json');
let mysql_json = JSON.parse(mysql_rawdata);

const rdsConnection = mysql.createConnection({
  host     : mysql_json["host"],
  user     : mysql_json["user"],
  password : mysql_json["password"],
  database : mysql_json["database"]
});

var transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: "reviewer3566@gmail.com",
    pass: "tae9412951!",
  },
});

app.post('/register', (req, res) => {
  //const param = [req.query.user_id, req.query.user_pwd];
  const param = [req.body.user_id, req.body.user_pwd, req.body.email, req.body.phone];

  var sql = 'INSERT INTO user(`user_id`, `user_pwd`, `email`, `phone`) VALUES (?, ?, ?, ?)';
  bcrypt.hash(param[1], saltRounds, (err, hash) => {
    param[1] = hash;
    rdsConnection.query(sql, param, (error, rows) => {
      if(err) console.log(err);
    });
  });
  res.json("register success");
});

app.post('/emailAuth', (req, res) => {

  var email = req.body.email;

  const rand = Math.random().toString(36).slice(2, 8);
  console.log(rand);

  var message = "<h3>고객님의 이메일 인증번호는 </h3><h1>";
  message += rand;
  message += "</h1><h3>입니다.</h3>"

  transporter.sendMail({
    from: `"Reviewer" <reviewer3566@gmail.com>`,
    to: email,
    subject: "이메일 인증을 위한 인증번호를 발송합니다",
    html: message
  })
  res.json(rand);
});

app.post('/emailCC', (req, res) => {
  var user_cert = req.body.send_number;
  var rand = req.body.rand;

  if(user_cert == rand){
    res.json("이메일이 인증되었습니다.");
  }else{
    res.json("인증번호가 일치하지 않습니다");
  }
})

app.post("/phoneAuth", (req, res) => {
    const user_name = "Review";
    const user_phone_number = req.body.phone;
    console.log(user_phone_number);

    var rand = ""
    for(var i = 0; i < 6; i++){
      rand += String(Math.floor(Math.random() * (9 - 0)) + 0);
    }
    console.log(rand);

    var resultCode = 200;
    const date = Date.now().toString();

    // 환경변수로 저장했던 중요한 정보들
    const serviceId = 'ncp:sms:kr:282167820327:avo_sms';
    const accessKey = 'c7Sp7NAycDbwPGwODzFc';
    const secretKey = 'YV6SBVaeOb4t3Snxcq7SXdXrbvM5fSNkFZJjQSaC';
    const my_number = '01026553901';

    // 그 외 url 관련
    const method = "POST";
    const space = " ";
    const newLine = "\n";
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${serviceId}/messages`;
    const url2 = `/sms/v2/services/${serviceId}/messages`;

    // 중요한 key들을 한번 더 crypto-js 모듈을 이용하여 암호화 하는 과정.
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url2);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(accessKey);
    const hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);

    request({
		    method : method,
		    json : true,
		    uri : url,
    		headers : {
    			'Contenc-type': 'application/json; charset=utf-8',
    			'x-ncp-iam-access-key': accessKey,
    			'x-ncp-apigw-timestamp': date,
    			'x-ncp-apigw-signature-v2': signature
    		},
    		body : {
    			'type' : 'SMS',
    			'countryCode' : '82',
    			'from' : my_number,
    			'content' : `${user_name}에서 알려드립니다. 고객님의 인증번호는 ${rand}입니다.`,
    			'messages' : [
    				{
    					'to' : `${user_phone_number}`
    				}
    			]
    		}
    	}, function(err, res, html) {
    		if(err) console.log(err);
    		else {
    			resultCode = 200;
    			console.log(html);
    		}
    	});

    	res.json(rand);
});


app.post('/login', (req, res) => {
  console.log("login logic start");
  var param = [req.body.user_id, req.body.user_pwd]
  console.log(param);
  //var param = [req.query.user_id, req.query.user_pwd];

  var sql = 'SELECT * FROM user WHERE user_id=?'
  rdsConnection.query(sql, param[0], (err, rows) => {
    if(err) throw err;

    if(rows.length > 0){
      console.log(param[1]);
      bcrypt.compare(param[1], rows[0].user_pwd, (error, result) => {
        if(result){
          req.session.loginData = rows[0].user_id;
          req.session.save(error => {
            if(error) console.log('error : ' + error);
          });
          console.log("success!");
          res.json('login success');
        }else{
          console.log("real annoy --> " + result);
          res.json("아이디, 비밀번호를 다시 한번 확인해주세요!");
        }
      });
    }else{
      console.log("아이디, 패스워드 불일치");
      res.json("아이디, 비밀번호를 다시 한번 확인해주세요!");
    }
  });
});

app.post('/idCheck', (req, res) => {
  var user_id = req.body.user_id;
  console.log(user_id);

  var sql = 'SELECT user_id FROM user WHERE user_id = ?';

  rdsConnection.query(sql, [user_id], (err, rows) => {
    if(err) throw err;
    console.log(rows);

    if(rows.length){
      res.json('1');
    }else{
      res.json('0');
    }
  });
});

app.get('/logout', (req, res) => {
  if(req.session.loginData){
    req.session.destroy(error => {
      if(error) console.log(error);
    });
  }

  res.redirect('/');
});

app.get('/loginCheck', (req, res) => {
  if(req.session.loginData){
    res.send({ loggedIn: true, loginData: req.session.loginData });
  }else{
    res.send({ loggedIn: false });
  }
})

app.post('/emailTest', (req, res) => {
  if(req.session.loginData){
    var user_id = req.session.loginData;
    console.log(user_id);

    var sql = 'SELECT * FROM user WHERE user_id = ?';
    rdsConnection.query(sql, [user_id], (err, rows) => {
      console.log(rows);
      if(rows.length){
        var email = rows[0].email;
        console.log(email);

        transporter.sendMail({
          from: `"Reviewer" <reviewer3566@gmail.com>`,
          to: email,
          subject: "이것은 바로 테스트입니다.",
          html: "<h3>응~👌🏻 어쩔티비~ 📺💁🏻‍♂️ 저쩔티비~📺 💁🏻‍♀️ 안물티비~안궁티비~뇌절티비~우짤래미~ 저짤래미~ 쿠쿠루삥뽕🕺🏻 지금 화났죠?🔥😛 개킹받죠? 죽이고 싶죠? 🤗어차피 내가 사는곳 모르죠? 응~못 죽이죠?👊🏻🤟🏻 어~또 빡치죠? 😌아무것도 모르죠? 아무것도 못하죠?😉 그냥 화났죠? 냬~알걨섑니댸👏🏻🙃🙃 아무도 안물 안궁~🤣 물어본 사람?🙋🏻‍♀️ 궁금한 사람?🙋🏻‍♂️ 응 근데 어쩔티비죠? 약오르죠? 응~ 어쩔 저쩔 안물 안궁😚✌🏻</h3>",
        })
      }
    })
  }else{
    res.send('당신 로그인도 안 했잖아');
  }
  res.end();
})

app.post('/findId', (req, res) => {
  var email = req.body.email;

  const rand = Math.random().toString(36).slice(2, 8);

  var message = "<h3>고객님의 이메일 인증번호는 </h3><h1>";
  message += rand;
  message += "</h1><h3>입니다.</h3>"

  transporter.sendMail({
    from: `"Reviewer" <reviewer3566@gmail.com>`,
    to: email,
    subject: "아이디 찾기를 위한 인증번호를 발송합니다.",
    html: message,
  })

  res.render('/login/findId.ejs');
})

// 이메일 변경
app.post('/change_email', (req, res) => {
  console.log("change_email start");

  var new_email = req.body.email;
  var user_id = req.session.loginData;

  var sql = "UPDATE user SET email = ? WHERE user_id = ?";
  rdsConnection.query(sql, [new_email, user_id], (err, row) => {
    if(err) console.log(err);
    console.log(row);
    res.send('success');
  })
})

// 계정 탈퇴
app.post('/delete_user', (req, res) => {
  console.log("delete_user start");

  var user_id = req.session.loginData;

  var sql = "DELETE FROM user WHERE user_id = ?";
  rdsConnection.query(sql, [user_id], (err, row) => {
    if(err) console.log(err);
    console.log(row);
    req.session.destroy(error => {
      if(error) console.log(error);
    });
    res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
    template = `<script>
    alert('정상적으로 탈퇴되었습니다.');
    location.href="/"
    </script>`;
    res.end(template);
  })
})

module.exports = app;
