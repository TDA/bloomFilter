var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var fs = require('fs');
var routes = require('./routes/index');
var app = express();
var bf = require('bloomfilter');


var users = {
  store: [],
  addSecret: function(uname, secret) {
    var user = this.getUser(uname);
    user.secret = secret;
  },
  addUser: function(uname, pass) {
    var user = {};
    user.uname = uname;
    user.pass = pass;
    user.secret = null;
    this.store.push(user);
  },
  getUser: function(uname) {
    for(var i = 0; i < this.store.length; i++){
      if(this.store[i].uname.toString() == uname.toString())
        return this.store[i];
    }
  }
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.post('/signup', function(req, res){
  // Get user details
  var uname = req.body.uname;
  var pass = req.body.pass;
  //These would be part of a DB call
  users.addUser(uname, pass);

  var user = users.getUser(uname);

  res.render('signup-success', {title:'Signup Success', uname: user.uname, pass: user.pass, msg: ''});

});

app.get('/signup', function(req, res) {
  // Not really required, i just dont like GET's to the same addresses,
  // as they will be called by default on the form in case JS is disabled
  res.writeHead(200, {'content-type': 'text/html'});
  res.end("Sorry this document cant be GET'ed");
});

app.get('/verify', function(req, res){
  var bloom = new bf.BloomFilter(
    10 * 10000, // number of bits to allocate.
    8        // number of hash functions.
  );
  fs.readFile('common_passwords.txt', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var s = data.split('\n');
    s.forEach(function(pwd){
      bloom.add(pwd);
    });
    var array = [].slice.call(bloom.buckets),
      json = JSON.stringify(array);
    fs.writeFile('public/scripts/bloomdata.js',json);
  });

  res.end("alls well that ends well :P");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
