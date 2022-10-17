const nightmare = require('nightmare');
const os = require('os');
const fs = require('fs');
const rp = require('request-promise');
const path = require('path');
const cli = require('cac')();
const { version } = require('./package.json');

let n = null;
let conf = null;

cli.option('-c, --config <config>', 'Specify the config file.');
cli.option('-s, --separator <separator>', 'Specify the Separator.', {
	default: ':::'
});
cli.option('-d, --display <display>', 'Select browser display.', {
  default: false
});
cli.help();
cli.version(version);
const p = cli.parse();

let confPath = p.options.config || p.options.c;
let separator = p.options.separator || p.options.s;
let isShow = p.options.display || p.options.d;

if(p.options.h || p.options.help || p.options.v || p.options.version) { return; }

if(isEmpty(confPath)) {
	process.stderr.write('ERROR: --config or -c is required.');
	return;
}

try {
	conf = fs.readFileSync(confPath);
} catch(e) {
	process.stderr.write('ERROR: Cannot read the specified file. Exception [' + e + ']');
	return;
}

try {
	isShow = JSON.parse(isShow);
} catch(e) {
	process.stderr.write('ERROR: -d, --display is not boolean.');
	return;
}

try {
	n = new nightmare({
		show: isShow,
		switches: {
			"ignore-certificate-errors": true
		}
	});
} catch(e) {
	process.stderr.write('ERROR: Cannot run Nightmare. Exception [' + e + ']');
	return;
}

(async function() {
	let ret = [];
	let comds = String(conf).split(separator);

	try {
		for(let key in comds) {
			if(!String(comds[key]).trim().startsWith('download')) {
				ret.push(await eval(String('n.' + String(comds[key]).trim()).trim()));
			} else {
				let dir = new Date().getTime();
				for(let i = 0, cnt = ret[ret.length-1].length; i < cnt; i++) {
					download(dir, ret[ret.length-1][i]);
				}
			}
		}

	} catch(e) {
		process.stderr.write('ERROR: Cannot read the Document or HTML. Exception [' + e + ']');
		return;

	} finally {
		n.halt();
	}

	process.stdout.write('SUCCESS: ' + (!isEmpty(ret) ? os.EOL + JSON.stringify(ret): ''));
})();

function isEmpty(o) {
	return (
		o === undefined ||
		o === null ||
		o.length === 0 ||
		Object.keys(o).length === 0 ||
		(Array.from(new Set(o)).length === 1 && (Array.from(new Set(o))[0] === null || Array.from(new Set(o))[0] === undefined))
	);
}

function download(dir, url) {
	let dl = './download/' + dir + '/';
	try {
		fs.promises.mkdir(dl, { recursive: true })
	} catch(e) {}
	const file = fs.createWriteStream(dl + path.basename(url));
	rp(url).pipe(file);
}
