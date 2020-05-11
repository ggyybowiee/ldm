var shell = require('shelljs');
var path = require('path');

var iDocSrcPath = path.join(process.cwd(), process.argv[2] || './');

var iDocDistPath = path.join(process.cwd(), process.argv[3] || './dist');
shell.rm('-rf', iDocDistPath);
shell.mkdir(iDocDistPath);
var viewPath = path.join(iDocSrcPath, 'viewer');
var designPath = path.join(iDocSrcPath, 'design');
shell.cd(iDocSrcPath);
shell.exec('node timestamp.js');
shell.cd(viewPath);
shell.exec('npm run build');
shell.cd(designPath);
shell.exec('npm run build');


shell.cd(iDocDistPath);
shell.mv(path.join(viewPath, 'dist/'), './viewer/');
shell.mv(path.join(designPath, 'dist/'), './design/');
