//-----------------------------------------------------------------------------
// The MIT License
// 
// Copyright (c) 2010 Patrick Mueller
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// assertions
//-----------------------------------------------------------------------------
var assert = exports.assert = {}

//-----------------------------------------------------------------------------
// Assert that the expected value == the actual value.
//-----------------------------------------------------------------------------
assert.equal = function equal(expected, actual, message) {
    if (expected == actual) return

    assert.fail(message || expected + " != " + actual)
}

//-----------------------------------------------------------------------------
// Assert that the expected value === the actual value.
//-----------------------------------------------------------------------------
assert.strictEqual = function strictEqual(expected, actual, message) {
    if (expected === actual) return
    
    assert.fail(message || expected + " !== " + actual)
}

//-----------------------------------------------------------------------------
// Assert that the expected value is truthy.
//-----------------------------------------------------------------------------
assert.isTrue = function isTrue(actual, message) {
    if (actual) return

    this.fail(message || actual + " is not truthy")
}

//-----------------------------------------------------------------------------
// Assert that the expected value is falsey.
//-----------------------------------------------------------------------------
assert.isFalse = function assertFalse(actual, message) {
    if (!actual) return
    
    this.fail(message || actual + " is not falsey")
}

//-----------------------------------------------------------------------------
// Explicitly cause a test case failure.
//-----------------------------------------------------------------------------
assert.fail = function fail(message) {
    var ex = new Error(message || "failure")
    ex.isAssertionError = true
    throw ex
}

//-----------------------------------------------------------------------------
// test runner
//-----------------------------------------------------------------------------
exports.run = function run(module, logger, results) {

    // test modules must have a name
    if (!module.name) throw new Error("tested module has no name")

    // initial results, if needed    
    if (!results) {
        results = {
            passed: [],
            failed: [],
            errored: []
        }
    }
    
    // collect names of tests
    tests = []
    for (var key in module) {
        if (!key.match(/^test.+/)) continue
        
        var value = module[key]
        if (isFunction(value)) {
            tests.push(key)
        }
    }

    // run suiteSetUp, if available   
    if (isFunction(module.suiteSetUp)) {
        runCatching(module, "suiteSetUp", module.suiteSetUp, logger, results, {dontLogPass: true})
    }
    
    // run each test method
    tests.forEach(function(testName) {
    
        // run setUp, if available
        if (isFunction(module.setUp)) {
            runCatching(module, "setUp", module.setUp, logger, results, {dontLogPass: true})
        }
        
        // run the actual test
        runCatching(module, testName, module[testName], logger, results)
        
        // run tearDown, if available
        if (isFunction(module.tearDown)) {
            runCatching(module, "tearDown", module.tearDown, logger, results, {dontLogPass: true})
        }
    })
    
    // run suiteTearDown, if available   
    if (isFunction(module.suiteTearDown)) {
        runCatching(module, "suiteTearDown", module.suiteTearDown, logger, results, {dontLogPass: true})
    }

    // run sub-suites
    tests = []
    for (var key in module) {
        if (key.match(/^testSuite.+/)) {
            run(module[key], logger, results)
        }
    }
    
    return results
}

//-----------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------
function runCatching(module, funcName, func, logger, results, options) {
    if (!logger) {
        logger = { log: function(){} }
    }
    
    var result = {
        suiteName: module.name,
        funcName:  funcName
    }
    
    try {
        func.call(module)
        
        if (options && options.dontLogPass) return
        
        logger(module.name + ":" + funcName + ": passed")
        results.passed.push(result)
    }
    
    catch (e) {
        if (e.isAssertionError) {
            result.message = e.message
            logger(module.name + ":" + funcName + ": failed")
            results.failed.push(result)
        }
        else {
            result.error   = e.name
            result.message = e.message
            logger(module.name + ":" + funcName + ": error")
            if (e.stack) {
                logger(e.stack)
            }
            results.errored.push(result)
        }
    }
}

//-----------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------
function isFunction(thing) {
    return typeof(thing) == "function"
}

