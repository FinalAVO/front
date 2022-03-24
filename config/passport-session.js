// config/passport-session.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcrypt');
var db = require('../db');
var conn = db.init();

db.connect(conn);

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (user_id, done) => {
  var user;
    try {
      var sql = 'select * from user where user_id = ?';
      var params = [user_id];
      await conn.query(sql, params, async function (err, rows, fields) {
        if(err) {
          console.log(err);
          return done(null, false);
        }
        if(!rows[0]) return done(null, false);
        user = rows[0];

        console.log(user);
        return done(null, user);
      })
    } catch (e) {
      return done(e);
    }
});

passport.use(new LocalStrategy({
  usernameField: 'user_id',
  passwordField: 'password'
}, async function(user_id, password, done) {
    var user;
    try {
      var sql = 'select * from user where user_id = ?';
      var params = [user_id];
      await conn.query(sql, params, async function (err, rows, fields) {
        if(err) {
          console.log(err);
          return done(null, false);
        }
        if(!rows[0]) return done(null, false);
        user = rows[0];

        console.log(password, user.password);
        const checkPassword = await bcrypt.compare(password, user.password);
        console.log(checkPassword);
        if(!checkPassword) return done(null, false);

        console.log(user);
        return done(null, user);
      })
    } catch (e) {
      return done(e);
    }
  }
))

module.exports = passport;
