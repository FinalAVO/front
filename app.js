const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const router = express.Router();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3000)

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, 'public')));

app.use(
  session({
    key: "loginData",
    secret: "loginSecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

var restful = require('./routes/review.js');
app.use('/', restful);

var search = require('./routes/search.js');
app.use('/search', search);

var user = require('./routes/user.js');
app.use('/user', user);

var chart = require('./routes/chart.js');
app.use('/review/chart', chart);


app.listen(app.get('port'), () =>{
        console.log('서버 실행중!')
});
