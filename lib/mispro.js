'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var debug = require('debug')('spoke:mispronunciation');
var _ = require('underscore');
var Promise = require('bluebird');
var through = require('through');

var Mispro = function (outputDir, options) {
    if(!(this instanceof Mispro)) {
        return new Mispro(outputDir, options);
    }
    this.outputDir = outputDir;
    /* Combines the provided options with the defaults into a new object.
    Properties in options override those in defauls. */
    options = options || {};
    this.settings = _.extend({}, Mispro.DEFAULTS, options);
    debug('Created new Mispro with settings', this.settings);
    // this._initialized = false;
    // this._initDir(outputDir);
};

Mispro.scriptsDir = path.join(__dirname, '..', 'scripts');

Mispro.DEFAULTS = {
    // The sample rate required by the recognizer
    recognizerSampleRate: 16000,

    misproPreprocessScript: 
        path.join(Mispro.scriptsDir, 'mispro_preprocess.sh'),
    misproDetectionScript:
        path.join(Mispro.scriptsDir, 'mispro_detection.sh'),

    initScript:
        path.join(Mispro.scriptsDir, 'init_dir.sh'),
};

Mispro.prototype._initDir = function (cb) {
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

Mispro.prototype.process = function (inputFile, cb) {
    debug('Running mispronunciation preprocessing on', inputFile, 'in', this.outputDir);
    cb = cb || _.noop;
    var uttname = path.basename(inputFile, path.extname(inputFile));
    var command = [this.settings.misproPreprocessScript, this.outputDir, uttname].join(' ');
    debug('Running mispronunciation preprocessing with command:', command);
    var self = this;
    var child = exec(command, function (err, stdout, stderr) {
        debug('Mispro preprocess stdout:', stdout);
        debug('Mispro preprocess stderr:', stderr);
        if (err) {
            debug('Mispro preprocess exec error:', err);
            cb(err);
            return;
        }
        cb(null, self.outputDir);
    });
};

Mispro.prototype.misproDetection = function (cb) {
    debug('Running mispronunciation detection on', this.outputDir);
    cb = cb || _.noop;
    var command = [this.settings.misproDetectionScript, this.outputDir].join(' ');
    var child = exec(command, function (err, stdout, stderr) {
        debug('Mispro detection stdout:', stdout);
        debug('Mispro detection stderr:', stderr);
        if (err) {
            debug('Mispro detection exec error:', err);
            cb(err, null);
            return;
        }
        cb(null, stdout);
    });
};

Mispro.prototype.misproDetectionStream = function() {
    // body...
};


Mispro.prototype.getMisproResults = function (misproOutput) {
    // TODO parse the mispro output
    return misproOutput;
};

Mispro.prototype._initDirAsync = Promise.promisify(Mispro.prototype._initDir);
Mispro.prototype.processAsync = Promise.promisify(Mispro.prototype.process);
Mispro.prototype.misproDetectionAsync = 
    Promise.promisify(Mispro.prototype.misproDetection);
Mispro.prototype.getMisproResultsAsync = 
    Promise.promisify(Mispro.prototype.getMisproResults);

module.exports = Mispro;