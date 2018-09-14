#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const program = require('commander');
const trimRight = require('trim-right');
const docx = require('docx');
const imgSize = require('image-size');
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

const range = (start, end) => [...Array(1 + end - start).keys()].map(v => start + v);
const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
const files = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isFile());

program
  .version('0.0.1', '-v, --version')
  .option('-i, --id <id>', 'The ID of the lab (ex. 1A or 3C)')
  .option('-p, --part [part]', 'The specific part to compile. Not specifying it will imply that all parts sould be processed.', parseInt)
  .parse(process.argv);

// check program arguments
isPresentAsExpected(program.id, 'id of the lab');

// check config args
let config_check_args = [
  [config['labs-directory'], 'labs-directory'],
  [config.author, 'author'],
];

config_check_args.forEach(([val, desc]) => isPresentAsExpected(val, desc, true));

// get needed values
let id = program.id;
let parts = [ program.part ];
let rootDir = config['labs-directory'];
let author = config.author;

// create directories
let labDir = path.join(rootDir, `lab-${id}`);
let partDirs = dirs(labDir);
if (!fs.existsSync(labDir)) {
  console.log("Error: The specified folder could not be found with the given id.");
  process.exit(1);
}

let partsArray = parts[0] && parts.length > 0 ? parts : range(1, partDirs.length);
let labPartsDirs = partsArray.map(num => ({ part: num, dir: path.join(labDir, `part-${num}`) }));
let nonExistingDirs = labPartsDirs.filter(info => !fs.existsSync(info.dir));

// worn the user that certain parts don't exist and that it will be skipped
if (nonExistingDirs.length > 0) {
  console.log('Warning! The following part directories will be skipped since they do not exist:');
  nonExistingDirs.forEach(dir => console.log(' - ' + dir));
  process.exit(1);
}

function compileReport({ dir, part }) {
  let allFiles = files(dir).map(file => path.join(dir, file.toLowerCase()));
  let codeFiles = allFiles.filter(file => file.endsWith('.cpp'));
  let screenshots = allFiles.filter(file => file.endsWith('.png'));

  const DEFAULT_MARGIN = 100 * 5;
  let report = new docx.Document({
    creator: author,
    title: `Lab ${id.toUpperCase()}-${part} Report`
  }, {
    orientation: "landscape",
    top: DEFAULT_MARGIN,
    right: DEFAULT_MARGIN,
    bottom: DEFAULT_MARGIN,
    left: DEFAULT_MARGIN,
  });

  for (let file of codeFiles) {
    let codeLines = fs.readFileSync(file, 'utf-8').trim().split('\n').map(trimRight);
    for (let line of codeLines) {
      let content = new docx.Paragraph().spacing({ before: 0, after: 0 });
      if (line)
        content.addRun(new docx.TextRun(line).font("Consolas"))
      report.addParagraph(content);
    }

    report.createParagraph().pageBreak();
  }

  for (let file of screenshots) {
    let { width, height } = imgSize(file);
    let image = report.createImage(fs.readFileSync(file), width, height);
    image.scale(0.95);
  }

  let packer = new docx.Packer(report);
  packer
    .toBuffer(report)
    .then(buffer => {
      fs.outputFileSync(`Lab ${id.toUpperCase()}-${part}.docx`, buffer);
    });
}

for (let index in labPartsDirs) {
  let partDir = labPartsDirs[index];
  console.log(`Creating part ${index}...`);
  compileReport(partDir)
}

console.log(`All done!`);