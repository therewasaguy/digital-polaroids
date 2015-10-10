require('dotenv').load();

/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose-q')(require('mongoose')); // convenience methods for Q with mongoose. see https://github.com/iolo/mongoose-q
// var dbURL = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/itpdir';
var dbURL = 'mongodb://localhost:27017/itpdir';

// the ExpressJS App
var app = express();

// configuration of port, templates (/views), static files (/public)
// and other expressjs settings for the web server.
app.configure(function(){

  // server port number
  app.set('port', process.env.PORT || 5000);

  //  templates directory to 'views'
  app.set('views', __dirname + '/views');

  // setup template engine - we're using Hogan-Express
  app.set('view engine', 'html');
  app.set('layout','layout');
  app.engine('html', require('hogan-express')); // https://github.com/vol4ok/hogan-express

  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

  // database connection
  app.db = mongoose.connect(dbURL);
  console.log("connected to database");
  
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * CORS support.
 */

app.all('*', function(req, res, next){
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

// ROUTES

var routes = require('./routes/routes.js');

app.get('/',routes.add);
app.get('/itp-wall',routes.get12); //get12
app.get('/9',routes.get9);
app.get('/add', routes.add);
app.post('/api/add/photo', routes.savePhotoToDb);
app.post('/api/add/audio', routes.saveAudioToDb);
app.post('/api/add/description', routes.saveDescriptionToDb);

app.get('/api/user/:id', routes.getUser);
app.get('/api/get/users/:num', routes.getUsers);

// TESTING / UTILITY ROUTES - not used in production //

// call to create users in the DB from a CSV
app.get('/admin/createUsers', routes.createUsers);

// call to add photos for all users, for testing purposes
app.get('/admin/addPhotos', routes.addPhotos);
// call to clear all photos for all users, for testing purposes
app.get('/admin/deletePhotos', routes.deletePhotos)
// call to reset some db values
app.get('/admin/updateInfo', routes.updateInfo);
// call to get all emails that haven't submitted
app.get('/admin/get-emails',routes.getEmails);

// app.post('/uploadwav',routes.uploadWav);

// create NodeJS HTTP server using 'app'
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});