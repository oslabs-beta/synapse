var path = require('path');
var express = require('express');
var synapse = require('./synapse/synapse');
var app = express();
var PORT = 3000;
var test = [];
for (var _i = 0, test_1 = test; _i < test_1.length; _i++) {
  var value = test_1[_i];
}
app.use('/api', synapse(path.resolve(__dirname, './resources')));
app.get('/', function (req, res) {
  res.send('hello world');
});
