#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const program = require('commander');
const dedent = require('dedent');
const config = require('./config.json');

function isPresentAsExpected(val, desc, partOfConfig = false) {
  if (!val) {
    if (partOfConfig)
      console.log(`The '${desc}' field needs to be defined in config.json!`);
    else
      console.log(`The ${desc} is required!`);
    process.exit(1);
  }
}

function getCurrentDay() {
  let dateObj = new Date();
  let month = dateObj.getUTCMonth() + 1; //months from 1-12
  let day = dateObj.getUTCDate();
  let year = dateObj.getUTCFullYear();
  return `${month}/${day}/${year}`;
}

const generateFileName = (id, partNum) => `lab-${id}-${partNum}.cpp`;
const generateIndentation = (type, amt) => type == 'spaces' ? ' '.repeat(amt) : '\t';

function generateCppCode(id, partNum, course, author, indent) {
  return dedent(`
    /*
     * Name: Lab ${id.toUpperCase()}-${partNum}
     * Class: ${course}
     * Date: ${getCurrentDay()}
     * Author: ${author}
     * Description: INSERT DESCRIPTION HERE
     */

    #include <iostream>
    #include <string>

    using namespace std;

    int main() {
    ${indent}cout << "Hello World!" << endl;
    ${indent}return 0;
    }
  `).trim()
}

const range = (start, end) => [...Array(1 + end - start).keys()].map(v => start + v);

program
  .version('0.0.1', '-v, --version')
  .option('-i, --id <id>', 'The ID of the lab (ex. 1A or 3C)')
  .option('-p, --parts <parts>', 'The number of parts in the lab', parseInt)
  .parse(process.argv);

// check program arguments
isPresentAsExpected(program.id, 'id of the lab');
isPresentAsExpected(program.parts, 'number of parts in the lab');

// check config args
let config_check_args = [
  [config['labs-directory'], 'labs-directory'],
  [config.course, 'course'],
  [config.author, 'author'],
  [config.indentation, 'indentation'],
  [config.indentation.type, 'indentation type'],
  [config.indentation.amount, 'indentation amount']
];

config_check_args.forEach(([val, desc]) => isPresentAsExpected(val, desc, true));

// get needed values
let { id, parts } = program;
let rootDir = config['labs-directory'];
let { course, author } = config;
let indentType = config.indentation.type;
let indentAmt = config.indentation.amount;

let indent = generateIndentation(indentType, indentAmt);

// create directories
let newLabDir = path.join(rootDir, `lab-${id}`);
let partsArray = range(1, parts);
let labPartsInfo = partsArray.map(num => {
  let partNum = num;
  let dir = path.join(newLabDir, `part-${num}`);
  let file = generateFileName(id, num);
  let combined = path.join(dir, file);
  return { partNum: num, dir, file, combined };
});

let allDirs = [newLabDir, ...labPartsInfo.map(info => info.dir)];
let existingDirs = allDirs.filter(fs.existsSync);

// don't override any existing directories
if (existingDirs.length > 0) {
  console.log('Error! The following directories would be overriden with this operation:');
  existingDirs.forEach(dir => console.log(' - ' + dir));
  process.exit(1);
}

labPartsInfo.forEach(({ partNum, dir, file, combined }) => {
  let code = generateCppCode(id, partNum, course, author, indent);
  fs.outputFileSync(combined, code);
});