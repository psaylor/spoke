var fs = require('fs');
var parse = require('csv').parse;
var transform = require('csv').transform;
var combine = require('stream-combiner')

var clArgs = process.argv;
clArgs.forEach(function(val, index) {
    console.log(index, ':', val);
});