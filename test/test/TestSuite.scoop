
//-----------------------------------------------------------------------------
// Copyright (c) 2010 Patrick Mueller
// Licensed under the MIT license: 
// http://www.opensource.org/licenses/mit-license.php
//-----------------------------------------------------------------------------

//-------------------------------------------------------------------
class TestSuite

//-------------------------------------------------------------------
static method suiteSetUp
static method suiteTearDown

//-------------------------------------------------------------------
method setUp
method tearDown

//-------------------------------------------------------------------
method assertEqual(expected, actual, message)
    if (expected == actual) return

    this.fail(message || expected + " != " + actual)

//-------------------------------------------------------------------
method assertStrictEqual(expected, actual, message)
    if (expected === actual) return
    
    this.fail(message || expected + " !== " + actual)

//-------------------------------------------------------------------
method assertTrue(actual, message)
    if (actual) return

    this.fail(message || actual + " is not truthy")

//-------------------------------------------------------------------
method assertFalse(actual, message)
    if (actual == null) return
    
    this.fail(message || actual + " is not falsey")

//-------------------------------------------------------------------
method fail(message)
    var ex = new Error(message || "failure")
    ex.isAssertionError = true
    throw ex
