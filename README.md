# COMSC-165-scripts
This repo containes a bunch of automation scripts for DVC's COMSC-165 labs.

## Lab creator
It creates a set of folders and C++ starter files to quickly get started with the labs.

### Usage
```bash
create-lab --id <id> --parts <parts>
```

* id = the identifier of a lab (ex. the ID in 'Lab 1A' is '1A')
* parts = the number of parts in a part

There's also a config that let's you edit some of the global settings. Copy

Config settings:
* `labs-directory` - The root directory of the labs
* `course` - The course number (ex. COMSC-165)
* `author` - Your name
* `indentation` - Settings for indentation for the generated code
  * `type` - either 'spaces' or 'tabs' (defaults to 'tabs')
  * `amount` - The amount of spaces to indent with (doesn't apply to tabs)