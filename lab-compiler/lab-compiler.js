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
  .option('-i, --id <id>', 'The ID of the lab (ex. 1a, 3c, 2, or 6)')
  .option('-p, --part [part]', 'The specific part to compile. Not specifying it will imply that all parts sould be processed.', parseInt)
  .parse(process.argv);

// check program arguments
isPresentAsExpected(program.id, 'id of the lab');

// check config args
isPresentAsExpected(config['labs-directory'], 'labs-directory', true)
isPresentAsExpected(config.author, 'author', true)

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

let partsArray = parts.length > 0 && parts[0] ? parts : range(1, partDirs.length);
if (id.length == 1)
  partsArray = partsArray.map(num => String.fromCharCode(96 + num).toUpperCase());

let labPartsDirs = partsArray.map(num => ({ part: num, dir: path.join(labDir, `part-${num}`) }));
let nonExistingDirs = labPartsDirs.filter(info => !fs.pathExistsSync(info.dir));

// warn the user that certain parts don't exist and that it will be skipped
if (nonExistingDirs.length > 0) {
  console.log('Warning! The following part directories will be skipped since they do not exist:');
  nonExistingDirs.forEach(info => console.log(' - ' + info.dir));
  process.exit(1);
}

function makeParagraph() {
  return new docx.Paragraph().spacing({ before: 0, after: 0 });
}

async function compileReport({ dir, part }) {
  let allFiles = files(dir).map(file => path.join(dir, file));
  let codeFiles = allFiles.filter(file => file.endsWith('.cpp') || file.endsWith('.h'));
  let screenshots = allFiles.filter(file => file.toLowerCase().endsWith('.png'));

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

  for (let index in codeFiles) {
    // what genius thought to make 'index' be a string??
    index = parseInt(index);
    let file = codeFiles[index];

    // add name of file
    let fileNamePara = makeParagraph();
    let fileName = path.basename(file);
    fileNamePara.addRun(new docx.TextRun(`File: ${fileName}`).font("Consolas").bold());
    report.addParagraph(fileNamePara);

    // add blank line
    report.addParagraph(makeParagraph());

    let code = await fs.readFile(file, 'utf-8');
    let codeLines = code.trim().split('\n').map(trimRight);

    for (let line of codeLines) {
      let content = makeParagraph();
      if (line)
        content.addRun(new docx.TextRun(line).font("Consolas"));
      // else, just add a blank line
      report.addParagraph(content);
    }

    if (index + 1 !== codeFiles.length)
      report.createParagraph().pageBreak();
  }

  if (screenshots.length)
    report.createParagraph().pageBreak();

  for (let file of screenshots) {
    let { width, height } = imgSize(file);
    let imgBuffer = await fs.readFile(file);
    let image = report.createImage(imgBuffer, width, height);
    image.scale(0.95);
  }

  let packer = new docx.Packer(report);

  try {
    let buffer = await packer.toBuffer(report);
    await fs.outputFile(path.join(dir, `Lab ${id.toUpperCase()}-${part}.docx`), buffer);
  } catch (err) {
    console.error(`Unable to save lab report ${id.toUpperCase()}-${part}: ${err}`);
  }
}

(async () => {
  await Promise.all(
    labPartsDirs.map(partDir => {
      console.log(`Compiling lab report ${id.toUpperCase()}-${partDir.part}...`);
      return compileReport(partDir);
    })
  );

  console.log('All done!');
})();
