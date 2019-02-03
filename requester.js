/**
 *	@author: Isaac Vega Rodriguez          <isaacvega1996@gmail.com>
 **/

'use strict';

var request = require('request');
var { EventEmitter } = require('events');
var { STATUS_CODES } = require('http');
var control = new EventEmitter();
var ended = 0;
var current = 0;
var STEP = 5000;

function requester(host) {

	request({
		proxy : 'http://' + host.ip + ':3128',
		timeout : 5000,
		method : 'GET',
		//url : 'http://torrent.cujae.edu.cu'
		url : 'http://google.com'
	}, function(err, res, data) {

		if ( !err && res.statusCode === 200 ) {
			console.log([
				'Response from  : ',
				host.ip,
				'\t',
				Date.now() - host.time,
				'\t',
				res.statusCode,
				'\t',
				STATUS_CODES[ res.statusCode ],
				'\r\n'
			].join(''));
		} /*else {
			console.log(`${err.address} => ${err.code}`);
		}//*/

		current -= 1;
		ended += 1;

		//console.log('Current threads: %d', current);

		if (current === 0) {
			control.emit('taskEnded');
		}

	});

}

function validIp(ip) {

	var i;
	var DICT = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];

	for (i = 0; i < ip.length; i += 1) {
		if (DICT.indexOf(ip[i]) === -1) {
			return false;
		}
	}

	var a = ip.split('.');

	if (a.length != 4) {
		return false;
	}

	for (i = 0; i < 4; i += 1) {

		if (a[i] == '') {
			return false;
		}

		a[i] = ~~a[i];
		if (a[i] < 0 || a[i] > 255) {
			return false;
		}

	}

	return true;

}

function fromIpToNumber(ip) {

	var arr = ip.split('.').map( (a) => { return ~~a; } );

	var res = 0;

	for (var i = 0; i < arr.length; i += 1) {
		res *= 256;
		res += arr[i];
	}

	return res;

}

function fromNumberToIp(n) {

	var arr = [];

	for (var i = 0; i < 3; i += 1) {
		arr.unshift( ~~(n - ~~(n / 256) * 256) );
		n /= 256;
		n = ~~n;
	}

	arr.unshift(n);

  var res = {
    ip : arr.join('.'),
    time : (new Date()).getTime()
  }

	return res;

}

if (process.argv.length < 4) {
	console.log('Expected initial and final ip\'s');
	process.exit();
}

if (validIp(process.argv[2]) && validIp(process.argv[3])) {

	let ini = fromIpToNumber(process.argv[2]);
	let fin = fromIpToNumber(process.argv[3]);

	if (ini > fin) {
		let temp = ini;
		ini = fin;
		fin = temp;
	}

	//console.log(fromNumberToIp(ini));

	var req = function(a, b, cant) {

		//console.log('A =', a, 'B =', b);

		for (let i = a; i <= b && i - a + 1 <= cant; i += 1) {
			current += 1;
			//console.log('Current threads: %d', current);
			requester(fromNumberToIp(i));
		}

	};

	control.on('taskEnded', () => {
		console.log('Finished %d/%d\r\n', ended, fin-ini+1);
			req(ini + ended, fin, STEP);
	});

	control.emit('taskEnded');

} else {
	console.log('Invalid IP. Expected two IPv4 values.');
	process.exit();
}