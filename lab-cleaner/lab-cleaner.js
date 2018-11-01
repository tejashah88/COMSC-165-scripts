#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const program = require('commander');
const config = require('./config.json');

function isPresentAsExpected(val, desc) {
  if (!val) {
    console.log(`The ${desc} is required!`);
    process.exit(1);
  }
}

const range = (start, end) => [...Array(1 + end - start).keys()].map(v => start + v);
const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
const files = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isFile());

program
  .version('0.0.1', '-v, --version')
  .parse(process.argv);

// check config args
isPresentAsExpected(config['labs-directory'], 'labs-directory', true)

// get needed values
let id = program.id;
let rootDir = config['labs-directory'];

// create directories
let labDirs = dirs(rootDir);
let labPartsDirs = labDirs
  .map(lab => ({ lab, parts: dirs(path.join(rootDir, lab)) }))
  .map(info => info.parts.map(part => path.join(info.lab, part)))
  .reduce((acc, cur) => {
    acc.push(...cur);
    return acc;
  }, [])
  .map(part => path.join(rootDir, part));

function getJunkFiles(dir) {
  let allFiles = files(dir).map(file => path.join(dir, file.toLowerCase()));
  let junkFiles = allFiles.filter(file => file.endsWith('.exe') || file.endsWith('.o') || file.endsWith('.docx'));
  return junkFiles;
}

(async () => {
  let allJunkFiles = labPartsDirs
    .map(labPart => getJunkFiles(labPart))
    .reduce((acc, cur) => {
      acc.push(...cur);
      return acc;
    }, []);

  if (allJunkFiles.length) {
    console.log(`Detected ${allJunkFiles.length} junk files! Deleting...`);
    await Promise.all(allJunkFiles.map(file => fs.remove(file)));
    console.log('All done!');
  } else
    console.log("No junk files detected!");
})();