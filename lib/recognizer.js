'use strict';

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var spawn = require('child_process').spawn;
var path = require('path');
var util = require('util');

var through = require('through');
var debug = require('debug')('spoke:recognizer');
var _ = require('underscore');
var Promise = require('bluebird');

var SoxCommand = require('sox-audio');
var TimeFormat = SoxCommand.TimeFormat;
var TimingTransformer = require('parser').TimingTransformer;

var Recognizer = function (options) {
    if(!(this instanceof Recognizer)) {
        return new Recognizer(options);
    }
    options = options || {};
    /* Combines the provided options with the defaults into a new object.
    Properties in options override those in defauls. */
    this.settings = _.extend({}, Recognizer.DEFAULTS, options);
    debug('Created new Recognizer with settings', this.settings);
    EventEmitter.call(this);
};

Recognizer.DEFAULTS = {

};

util.inherits(Recognizer, EventEmitter);

var RECOGNIZER_SAMPLE_RATE = 16000;
var TIMING_OUPUT_FORMAT = '%s/time/%s';


Recognizer.recognize = function (wavFile, cb) {
    console.log("Running recognition on ", wavFile);
    var command = ['./recognizer.sh', wavFile].join(' ');
    var child = exec(command,
        function (error, stdout, stderr) {
            console.log('Recognition stdout', stdout);
            console.log('Recognition stderr', stderr);
            if (error !== null) {
                console.log('Recognition exec error', error);
            }
            cb(stdout);
    });
};

Recognizer.forcedAlignment = function (wavFile, txtFile, outputDir, cb) {
    console.log('Running forced alignment on', wavFile, 'and', txtFile);
    var command = ['./lib/recognizer.sh', wavFile, txtFile, outputDir].join(' ');
    var child = exec(command,
        function (error, stdout, stderr) {
            console.log('Forced Alignment stdout', stdout);
            console.log('Forced Alignment stderr', stderr);
            if (error !== null) {
                console.log('Forced Alignment exec error', error);
                cb(error);
                return;
            }
            var resultFile = util.format(TIMING_OUPUT_FORMAT, outputDir, 
                path.basename(txtFile));
            cb(null, resultFile);
        });
};

Recognizer.getAlignmentResults = function (alignmentFile, cb) {
    var wordBoundaries = [];
    var aggregate = through (
        function write (wordBoundary) {
            wordBoundaries.push(wordBoundary);
        },
        function end () {
            cb(null, wordBoundaries);
        });

    var readStream = fs.createReadStream(alignmentFile);
    readStream.pipe(TimingTransformer())
        .pipe(aggregate);
};

module.exports = Recognizer;