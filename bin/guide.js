'use strict';
var inquirer = require('inquirer');
var chalk = require('chalk');
var shell = require('shelljs');

console.log(chalk.blue('这是联新医疗平台的开发向导。'));
console.log('\n');

var questions = [
  {
    type: 'list',
    name: 'command',
    message: '请选择要进行的操作?',
    choices: [{
      key: 1,
      value: 'dev',
      name: '不打包文书，进入开发环境'
    }, {
      key: 2,
      value: 'dev:doc',
      name: '打包文书，进入开发环境'
    }, {
      key: 3,
      value: 'build:doc',
      name: '打包文书'
    }, {
      key: 4,
      value: 'prod',
      name: '打包项目，不打包文书，进入发布环境'
    }, {
      key: 5,
      value: 'release',
      name: '打包项目，并打包文书，进入发布环境'
    }, {
      key: 6,
      value: 'build',
      name: '打包项目，并打包文书'
    }]
  }
];

inquirer.prompt(questions).then(function (answers) {
  shell.exec('npm run ' + answers.command);
});