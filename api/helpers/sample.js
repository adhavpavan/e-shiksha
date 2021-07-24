var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var url = "mongodb://10.216.28.194:27017/Religare";
var env = module.exports = {
	dev_ip: '10.216.251.158',
	pSeries_ip: '10.216.8.121',
	local_ip: 'localhost'
}
mongoose.connect(url, { server: { reconnectTries: 9999, reconnectInterval: 4000 } }, function (err) {
	if (err)
		console.log(err);
	else
		console.log("Connected to DB : " + url);
});
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.listen(3002, env.local_ip);
console.log('Magic happens on port ' + 3002);
module.exports = app;