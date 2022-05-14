const nightmare = require('nightmare');
const os = require('os');
const fs = require('fs');
const cli = require('cac')();

let n = null;
let conf = null;

cli.option('--config <config>', 'Please specify the config file.');
cli.option('-c <config>', 'Please specify the config file.');
cli.option('--separator <separator>', 'Please specify the Separator. Default ":::"', {
	default: ':::'
});
cli.option('-s <separator>', 'Please specify the Separator. Default ":::"', {
	default: ':::'
});
cli.option('--display <show>', 'Select browser display.', {
  default: false
});
cli.option('-d <show>', 'Select browser display.', {
  default: false
});
cli.help();
cli.version('1.0');
const p = cli.parse();

let confPath = p.options.config || p.options.c;
let separator = p.options.separator || p.options.s;
let isShow = p.options.display || p.options.d;

if(isEmpty(confPath)) {
	process.stderr.write('ERROR: --config or -c is required.');
	return;
}

try {
	conf = fs.readFileSync(confPath);
} catch(e) {
	process.stderr.write('ERROR: Cannot read the specified file.');
	return;
}

n = new nightmare({
	show: true,
	switches: {
		"ignore-certificate-errors": true
	}
});

(async function() {
	let ret = [];
	let comds = String(conf).split(separator);

	try {
		for(let key in comds) {
			ret.push(await eval(String('n.' + String(comds[key]).trim()).trim()));
		}

	} catch(e) {
		process.stderr.write('ERROR: Cannot read the Document or HTML. Exception [' + e + ']');
		return;

	} finally {
		n.halt();
	}

	process.stdout.write(JSON.stringify(ret));
})();

function isEmpty(o) {
	return (o === undefined || o === null || o.length === 0 || Object.keys(o).length === 0);
}
