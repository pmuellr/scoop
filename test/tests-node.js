var TestRunner = require("test/TestRunner")
var PointTests = require("sample/PointTests")

var testRunner = new TestRunner()
testRunner.addTestSuite(PointTests)
var results = testRunner.run()
TestRunner.resultsToConsole(results)
