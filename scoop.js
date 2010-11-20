#!/usr/bin/env node

//-----------------------------------------------------------------------------
// Copyright (c) 2010 Patrick Mueller
// Licensed under the MIT license: 
// http://www.opensource.org/licenses/mit-license.php
//-----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// requires
//----------------------------------------------------------------------------
var fs        = require("fs")
var path      = require("path")
var util      = require("util")
var scooj     = require("scooj")
var directive = require("directive")

scooj.installGlobals()

var PROGRAM_NAME

//----------------------------------------------------------------------------
// register compiler for node
//----------------------------------------------------------------------------
if (require.extensions) {
    require.extensions[".scoop"] = function(module, fileName) {
        var source  = fs.readFileSync(fileName, "utf8")
        var content = Processor.compile(fileName, source)
        
        return module._compile(content, fileName)
    }
} 
    
//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function help() {
    console.log(PROGRAM_NAME + " [options] FILE FILE ...")
    console.log()
    console.log("Converts .scoop.js files to .js files (JavaScript).")
    console.log("FILEs which are directories are processed recursively.")
    console.log()
    console.log("options:")
    console.log("   -?      | print this help")
    console.log("   -h      | print this help")
    console.log("   -o DIR  | write files to DIR")
    console.log("   -t      | also convert to Transport/D")
    
    process.exit(0)
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function main() {
    var args = getOptions({o: true, t: false, v: false, h: false, "?": false})

    PROGRAM_NAME = args.program

    if (args.options.h || args.options["?"] || !args.parameters.length) {
        help()
    }

    var options = {
         oDir:       args.options.o || "."
        ,verbose:    args.options.v || false
        ,transportD: args.options.t || false
    }

    args.parameters.forEach(function(fileName) { 
        processFile(fileName, options) 
    })
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function processFile(fileName, options, dirs) {
    if (!dirs) dirs = []
    
    if (!path.existsSync(fileName)) {
        error("file does not exist: '" + fileName + "'")
    }
    
    var stat = fs.statSync(fileName)
    if (stat.isFile()) {
        return processSingleFile(fileName, options, dirs)
    }
    
    if (stat.isDirectory()) {
        var newDirs = dirs.slice()
        newDirs.push(path.basename(fileName))
        
        return processDirectory(fileName, options, newDirs)
    }
    
    if (dirs.length == 0) {
        error("input file is neither a file nor a directory: '" + fileName + "'")
    }
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function processSingleFile(fileName, options, dirs) {
    var match = /(.*)\.scoop\.js$/.exec(fileName)
    if (!match) {
        match = /(.*)\.scoop$/.exec(fileName)
        if (!match) return
    }
    
    var baseFileName = path.basename(match[1])
    var moduleName   = getModuleName(baseFileName, dirs)
    var oFileName
    
    if (options.oDir == "-") {
        oFileName = null
    }
    else if (options.transportD) {
        oFileName = options.oDir + "/" + moduleName + ".transportd.js"
    }
    else {
        oFileName = options.oDir + "/" + moduleName + ".js"
    }
    
    var source = fs.readFileSync(fileName, "utf8")
    
    var processor = new Processor(fileName, source)
    var lines = processor.process()
    var content = lines.join("\n")
    
    if (options.transportD) content = transportDize(moduleName, content)
    
    if (oFileName) {
        var oDirName = path.dirname(oFileName)
        var error = makedirs(oDirName)
        if (error) error("error creating directory: '" + oDirName + "'")
    
        fs.writeFileSync(oFileName, content, "utf8")
        log("wrote: " + oFileName)
    }
    
    else {
        console.log(content)
        console.log()
    }
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function processDirectory(fileName, options, dirs) {
    var entries = fs.readdirSync(fileName)
    
    entries.forEach(function(entry) {
        processFile(fileName + "/" + entry, options, dirs)
    })
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function getModuleName(fileName, dirs) {
    var baseFileName = path.basename(fileName, ".scoop.js")
    
    var moduleName = dirs.slice()
    moduleName.push(baseFileName)
    moduleName = moduleName.join("/")
    
    if (moduleName.substring(0,1) == ".") moduleName = moduleName.substring(1)
    if (moduleName.substring(0,1) == "/") moduleName = moduleName.substring(1)
    
    return moduleName
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function makedirs(dirName) {
    if (path.existsSync(dirName)) return 
    
    dirParts = dirName.split("/")
    if (dirParts.length == 0) return "error"
    
    var error = makedirs(dirParts.slice(0,dirParts.length-1).join("/"))
    if (error) return error
    
    fs.mkdirSync(dirName, 0700)
}
    
//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function replaceSuperInvocations(cls, methodName, methodBody) {
    var pattern1 = /([^\w\$])super\(\s*\)/
    var pattern2 = /([^\w\$])super\(/
    var pattern3 = /([^\w\$])super\.([\w\$]*)\(\s*\)/
    var pattern4 = /([^\w\$])super\.([\w\$]*)\(/
    
    if (!methodName) {
        methodName = "null"
    }
    else {
        methodName = '"' + methodName + '"'
    }
    
    methodBody = methodBody.replace(pattern1, '$1' + cls + '.$super(this, ' + methodName + ')')
    methodBody = methodBody.replace(pattern2, '$1' + cls + '.$super(this, ' + methodName + ',')
    methodBody = methodBody.replace(pattern3, '$1' + cls + '.$super(this, "$2")')
    methodBody = methodBody.replace(pattern4, '$1' + cls + '.$super(this, "$2", ')
    
    return methodBody
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function transportDize(moduleName, contents) {
    var header  = ';require.define({"' + moduleName + '": function(require, exports, module) { '
    var trailer = "\n}});\n"
    
    return header + contents + trailer
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function getOptions(flags) {
    var program = path.basename(process.argv[1], ".js")
    var argv    = process.argv.slice(2)
    
    var parameters = []
    var options    = {}
    
    var index = 0
    while (index < argv.length) {
        var arg = argv[index]
        
        var match = /^-(.)/.exec(arg)
        if (!match) {
            while (index < argv.length) {
                parameters.push(argv[index++])
            }
        }
        
        else {
            var opt = match[1]
            if (flags[opt] == undefined) {
                error("invalid option used: '" + opt + "'")
            }
            
            if (!flags[opt]) {
                options[opt] = true
            }
            else {
                if (index+1 >= argv.length) {
                    error("option needs a value: '" + opt + "'")
                }
                options[opt] = argv[++index]
            }
        }
        
        index += 1
    }
    
    return {program: program, parameters: parameters, options: options}
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function log(message) {
    if (!PROGRAM_NAME) PROGRAM_NAME = path.basename(process.argv[1], ".js")
    util.log(PROGRAM_NAME + ": " + message)
}

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
function error(message) {
    log(message)
    process.exit()
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// process an individual file
//----------------------------------------------------------------------------
var Processor = defClass(module, function Processor(fileName, source) {
    this.fileName     = fileName
    this.source       = source
    this.lines        = []
    this.currentClass = "--NoClassDefined--"
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defStaticMethod(function compile(fileName, source) {
    var processor = new Processor(fileName, source)
    var lines = processor.process()
    return lines.join("\n")
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function process() {
    var handler = new Handler(this)
    
    var dr = new directive.DirectiveReader(this.source, this.fileName)
    
    dr.process(handler)

    return this.lines
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function logError(directive, message, lineOffset) {
    if (!lineOffset) lineOffset = 0
    
    var line = directive.lineNo + lineOffset
    
    message = this.fileName + ":" + line + ": " + message
    util.log(message)
    
    return false
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function collectDirective(directive, header, trailer) {
    if (!trailer) trailer = ""
    
    var insertScoojRequire = (this.lines.length == 0)
    
    if (!directive.body.length) {
        header += trailer
        trailer = null
    }
    
    directive.body.unshift(header)
    if (trailer) directive.body[directive.body.length - 1] += trailer
    
    var lines = this.lines
    directive.comments.forEach(function(line) {
        lines.push(line)
    })
    
    directive.body.forEach(function(line) {
        lines.push(line)
    })
    
    if (insertScoojRequire) {
        var scoojRequire = "var scooj = require('scooj'); "
        var lineNo = (lines[0].substring(0,2) == "#!") ? 1 : 0

        if (typeof(lines[lineNo]) != "string") {
            error("unable to place scooj require line")
        }
        
        lines[lineNo] = "var scooj = require('scooj'); " + lines[lineNo]
    }
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function processClass(directive) {
    var pattern = /\s*(\w+)\s*(\(.*\))?\s*(<<\s*(\w+))?\s*/
        
    var match = pattern.exec(directive.args)
    if (!match) return this.logError(directive, "invalid syntax")
        
    var cls      = match[1]
    var parms    = match[2]
    var supercls = match[4]

    if (!parms) parms = "()"

    var header = "var " + cls + " = scooj.defClass(module, "
    
    if (supercls) header += supercls + ", "
    
    header += "function " + cls + parms + "{"
    
    trailer = "}); var $super = scooj.defSuper();"

    body = replaceSuperInvocations(cls, null, directive.body.join("\n"))
    directive.body = body.split("\n")
    
    this.collectDirective(directive, header, trailer)
    
    this.currentClass = cls
    
    return true
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function processMethod(directive, isStatic) {
    var pattern = /\s*(\w+)\s*(\(.*\))?\s*/
        
    var match = pattern.exec(directive.args)
    if (!match) return this.logError(directive, "invalid syntax")
        
    var method = match[1]
    var parms  = match[2]
    
    if (!parms) parms = "()"

    var func = isStatic ? "defStaticMethod" : "defMethod"
    var header  = "scooj." + func + "(function " + method + parms + "{"
    var trailer = "})"
    
    if (!isStatic) {
        body = replaceSuperInvocations(this.currentClass, method, directive.body.join("\n"))
        directive.body = body.split("\n")
    }
    
    this.collectDirective(directive, header, trailer)
    
    return true
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function processStatic(directive) {
    var pattern = /^\s*method\s*(.*?)\s*$/
    var match = pattern.exec(directive.args)
    if (match) {
        directive.args = match[1]
        return this.processMethod(directive, true)
    }
    
    pattern = /\s*/
    match = pattern.exec(directive.args)
    if (!match) return this.logError(directive, "invalid syntax")

    this.collectDirective(directive, "")
    
    return true
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function processRequire(directive) {
    var pattern = /\s*([^\s]+)\s*/
        
    var match = pattern.exec(directive.args)
    if (!match) return this.logError(directive, "invalid syntax")
        
    var module = match[1]
    var variable = path.basename(module)

    var header = "var " + variable + " = require('" + module + "')"
    
    this.collectDirective(directive, header)
    return true
})


//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
var Handler = defClass(module, function Handler(processor) {
    this.processor = processor
    this.errors    = false
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function handleDirective_class(edata) {
    this.errors = this.errors || !this.processor.processClass(edata.directive)
})
        
//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function handleDirective_method(edata) {
    this.errors = this.errors || !this.processor.processMethod(edata.directive)
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function handleDirective_static(edata) {
    this.errors = this.errors || !this.processor.processStatic(edata.directive)
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function handleDirective_require(edata) {
    this.errors = this.errors || !this.processor.processRequire(edata.directive)
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function processDirective(edata) {
    this.errors = true
    
    var directive = edata.directive
    log(edata.fileName + ":" + directive.lineNo + " unknown directive encountered: '" + directive.name + "'")
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function fileBegin(edata) {
})

//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
defMethod(function fileEnd(edata) {
    if (this.errors) error("stopping processing because of errors")
})
        
//----------------------------------------------------------------------------
//
//----------------------------------------------------------------------------
if (require.main == module) main()

