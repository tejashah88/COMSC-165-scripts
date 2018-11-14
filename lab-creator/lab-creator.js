#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const program = require('commander');
const dedent = require('dedent');
const got = require('got');
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

const generateFileName = (id, partNum) => id.length === 1 ? `lab-${id}${partNum}.cpp` : `lab-${id}-${partNum}.cpp`;
const generateIndentation = (type, amt) => type == 'spaces' ? ' '.repeat(amt) : '\t';

function generateCppCode(id, partNum, course, author, indent, libraryCode) {
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
    #include <iomanip>
    #include <fstream>
    #include <vector>

    using namespace std;

    ${libraryCode.split('\n').map((line, index) => index == 0 ? line : indent + line).join('\n')}

    int main() {
    ${indent}cout << "Hello World!" << endl;
    ${indent}return 0;
    }
  `).trim();
}

const range = (start, end) => [...Array(1 + end - start).keys()].map(v => start + v);

program
  .version('0.0.1', '-v, --version')
  .option('-i, --id <id>', 'The ID of the lab (ex. 1a, 3c, 2, or 6)')
  .option('-p, --parts <parts>', 'The number of parts in the lab', parseInt)
  .parse(process.argv);

// check program arguments
isPresentAsExpected(program.id, 'id of the lab');
isPresentAsExpected(program.parts, 'number of parts in the lab');

// check config args
let config_check_args = [
  [config['labs-directory'], 'labs directory'],
  [config.course, 'course'],
  [config.author, 'author'],
  [config['gist-code-url'], 'gist code url'],
  [config.indentation, 'indentation'],
  [config.indentation.type, 'indentation type'],
  [config.indentation.amount, 'indentation amount']
];

config_check_args.forEach(([val, desc]) => isPresentAsExpected(val, desc, true));

// get needed values
let { id, parts } = program;
id = id.toLowerCase();
let rootDir = config['labs-directory'];
let { course, author, indentation } = config;
let gistUrl = config['gist-code-url'];
let indentType = indentation.type;
let indentAmt = indentation.amount;

let indent = generateIndentation(indentType, indentAmt);

// create directories
let newLabDir = path.join(rootDir, `lab-${id}`);
let partsArray = range(1, parts);

if (!isNaN(Number(id)))
  partsArray = partsArray.map(num => String.fromCharCode(96 + num).toUpperCase());

let labPartsInfo = partsArray.map(num => {
  let partNum = num;
  let dir = path.join(newLabDir, `part-${num}`);
  let file = generateFileName(id, num);
  let combined = path.join(dir, file);
  return { partNum: num, dir, file, combined };
});

let allDirs = [newLabDir, ...labPartsInfo.map(info => info.dir)];
let existingDirs = allDirs.filter(fs.pathExistsSync);

// don't override any existing directories
if (existingDirs.length > 0) {
  console.log('Error! The following directories would be overridden with this operation:');
  existingDirs.forEach(dir => console.log(' - ' + dir));
  process.exit(1);
}

(async () => {
  let libraryCode = '';
  if (gistUrl) {
    try {
      libraryCode = (await got(gistUrl)).body;
    } catch (err) {
      console.log('Unable to pull remote code from given gist url!');
    }
  }

  await Promise.all(
    labPartsInfo.map(info => {
      let { partNum, dir, file, combined } = info;
      let code = generateCppCode(id, partNum, course, author, indent, libraryCode);
      console.log(`Creating lab environment ${id.toUpperCase()}-${partNum}...`);
      return fs.outputFile(combined, code);
    })
  );
})();