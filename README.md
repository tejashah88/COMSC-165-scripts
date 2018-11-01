# COMSC-165-scripts
This repo containes a bunch of automation scripts for managing my DVC COMSC-165 labwork.


## Lab creator
It creates a set of folders and C++ starter files to quickly get started with the labs.

### First-time setup
You'll need to run this step if you want to run this command anywhere else.
```bash
cd lab-creator
npm link
```

### Usage
```bash
create-lab --id <id> --parts <parts>
```

* `id` = the identifier of a lab (ex. the ID in 'Lab 1A' is '1A')
  * if the `id` is two characters big (like '1A' or '3D'), then the generated parts directory will be 'part-1', 'part-2', etc.
  * if the `id` is one character big (like '2' or '6'), then the generated parts directory will be 'part-A', 'part-B', etc.
* `parts` = the number of parts in a part

There's also a config that let's you edit some of the global settings. Duplicate `lab-creator/config.default.json`, call it `config.json`, and fill out all the fields.

Config settings:
* `labs-directory` - The root directory of the labs
* `course` - The course number (ex. COMSC-165)
* `author` - Your name
* `gist-code-url` (optional) - The url for pulling boilerplate code from a Gist hosted from GitHub.
* `indentation` - Settings for indentation for the generated code
  * `type` - either 'spaces' or 'tabs' (defaults to 'tabs')
  * `amount` - The amount of spaces to indent with (doesn't apply to tabs)


## Lab compiler
It compiles the code and screenshots into a Word document for each part detected.

### First-time setup
You'll need to run this step if you want to run this command anywhere else.
```bash
cd lab-compiler
npm link
```

### Usage
```bash
compile-lab --id <id> --part [part]
```

* `id` = the identifier of a lab (ex. the ID in 'Lab 1A' is '1A')
  * if the `id` is two characters big (like '1A' or '3D'), then the expected parts directory will be 'part-1', 'part-2', etc.
  * if the `id` is one character big (like '2' or '6'), then the expected parts directory will be 'part-A', 'part-B', etc.
* `part` = the specific part number to compile; if this is left out, all parts will be compiled

There's also a config that let's you edit some of the global settings. Duplicate `lab-compiler/config.default.json`, call it `config.json`, and fill out all the fields.

Config settings:
* `labs-directory` - The root directory of the labs
* `author` - Your name


## Lab cleaner
It cleans any generated files (i.e. '.exe', '.o', and '.docx' files) after you are done with a lab

### First-time setup
You'll need to run this step if you want to run this command anywhere else.
```bash
cd lab-cleaner
npm link
```

### Usage
```bash
clean-labs
```

There's also a config that let's you edit some of the global settings. Duplicate `lab-cleaner/config.default.json`, call it `config.json`, and fill out all the fields.

Config settings:
* `labs-directory` - The root directory of the labs