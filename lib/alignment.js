'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var debug = require('debug')('spoke:alignment');
var _ = require('underscore');
var Promise = require('bluebird');
var through = require('through');

var TimingTransformer = require('./parsers/faTimingTransformer');

var Alignment = function (outputDir, options) {
    if(!(this instanceof Alignment)) {
        return new Alignment(outputDir, options);
    }
    this.outputDir = outputDir;
    /* Combines the provided options with the defaults into a new object.
    Properties in options override those in defauls. */
    options = options || {};
    this.settings = _.extend({}, Alignment.DEFAULTS, options);
    debug('Created new Alignment with settings', this.settings);
    // this._initialized = false;
    // this._initDir(outputDir);
};

Alignment.scriptsDir = path.join(__dirname, '..', 'scripts');
Alignment.TIMING_OUPUT_FORMAT = '%s/time/%s';

Alignment.DEFAULTS = {
    // The sample rate required by the recognizer
    recognizerSampleRate: 16000,

    forcedAlignmentScript: 
        path.join(Alignment.scriptsDir, 'forced_alignment.sh'),

    initScript:
        path.join(Alignment.scriptsDir, 'init_dir.sh'),
};

Alignment.prototype._initDir = function (cb) {
    debug('Initializing directory', this.outputDir);
    cb = cb || _.noop;
    var command = [this.settings.initScript, this.outputDir].join(' ');
    var child = exec(command, function (err, stdout, stderr) {
        debug('Init dir stdout:', stdout);
        debug('Init dir stderr:', stderr);
        if (err) {
            debug('Init dir exec error:', err);
            cb(err, null);
            return;
        }
        cb(null, true);
    });
};


Alignment.prototype.forcedAlignment = function (wavFile, txtFile, cb) {
    debug('Running', this.settings.forcedAlignmentScript,
        'forced alignment on', wavFile, 'and', txtFile);
    cb = cb || _.noop;
    var self = this;

    var command = [this.settings.forcedAlignmentScript, wavFile, txtFile, 
        this.outputDir].join(' ');

    var child = exec(command, function (err, stdout, stderr) {
        debug('Forced alignment stdout:', stdout);
        debug('Forced alignment stderr:', stderr);
        if (err) {
            debug('Forced alignment exec error:', err);
            cb(err);
            return;
        }
        var alignmentFile = self._getAlignmentOutputFile(txtFile, self.outputDir);
        cb(null, alignmentFile);
    });
};

/* Constructs the expected output filename from the forced alignment, given
    one of the input files (either the wav or the txt since they should have the
    same basename) and the output directory used for the forced alignment.
*/
Alignment.prototype._getAlignmentOutputFile = function (inputFile, outputDir) {
    return util.format(Alignment.TIMING_OUPUT_FORMAT, outputDir, path.basename(inputFile));
};

Alignment.prototype.getAlignmentResults = function (alignmentFile, cb) {
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

/* Add promisified versions of the main methods */
Alignment.prototype._initDirAsync = Promise.promisify(Alignment.prototype._initDir);
/* This utility function can promisify any function that is in the node style,
meaning it accepts a callback function as the last argument and then calls the
callback with error as the first argument. */
Alignment.prototype.forcedAlignmentAsync = 
    Promise.promisify(Alignment.prototype.forcedAlignment);
Alignment.prototype.getAlignmentResultsAsync = 
    Promise.promisify(Alignment.prototype.getAlignmentResults);

module.exports = Alignment;
