var connect = require('connect'),
	serveStatic = require('serve-static'),
	argv = require('minimist')(process.argv.slice(2)),
	port = argv.p || 3001;

var app = connect();

app.use(serveStatic(__dirname + '/../', {index: 'examples/index.html'}));

app.listen(port, '0.0.0.0');

console.log('Started server at http://localhost:' + port);
