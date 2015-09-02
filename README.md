# jsbuild3

JsBuild system for emp.ria framework

[![Build Status](https://travis-ci.org/viatsyshyn/jsbuild3.png)](https://travis-ci.org/viatsyshyn/jsbuild3)
[![NPM version](https://img.shields.io/npm/v/emp.ria-jsbuild3.svg?style=flat)](https://www.npmjs.com/package/emp.ria-jsbuild3)

## Getting Started


```shell
npm install -g emp.ria-jsbuild3 --save-dev
```

Once the package has been installed, you may use it fomr shell:

Build jsbuild.json in current folder

```shell
jsbuild3
```

Specify path to jsbuild.json, build will be relative to config base dir

```shell
jsbuild3 --config /my/path/to/jsbuild.json
```

Specify exact modules to build, comma separated list

```shell
jsbuild3 --modules ModuleA,ModuleB
```

## jsbuild.json example

```js
{
  "version": "3.0",
  "framework": "/my/path/to/emp.ria-framework/",
  "options": {
    "uglifyjs": {
      "output": {
        "beautify": false
      },
      "compress": {
        "dead_code": true
      },
      "mangle": {
      }
    }
  },
  
  "assets": {
    // internal jade assets compiler
    "jade": { 
      "compiler": "emp.ria-jade", // compiler npm, must be installed seperatly
      "options": { // jade compiler options
        "client": true,
        "compileDebug": false,
        "self": true
      }
    },
      
    // internal txt and json assets compilers
    "txt": {}, 
    "json": {},
      
    // custom assets compiler
    "custom-plugin": {
      "path": "/path/to/custom/plugin.js" // relative to jsbuild.json, please use lib/assets/jade.js as an example
    }
  },
  
  "modules": [{
    "name": "Main",
    "app": "app.DemoApp",
    "out": "scripts/DemoApp.compiled.js",
    
    "prepend": [
      "lib/jade.runtime.js"
    ],
    
    "globals": [
      "jQuery",
      "jade"
    ] 
  }]
}
```

