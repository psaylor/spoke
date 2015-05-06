'use strict';

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var util = require('util');

var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var spawn = require('child_process').spawn;

var through = require('through');
var debug = require('debug')('spoke:recognizer');
var _ = require('underscore');
var Promise = require('bluebird');

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

Recognizer.scriptsDir = path.join(__dirname, '..', 'scripts');

Recognizer.DEFAULTS = {
    // The sample rate required by the recognizer
    recognizerSampleRate: 16000,

    recognitionScript: path.join(Recognizer.scriptsDir, 'nut_recognizer.sh'),

    forcedAlignmentScript: path.join(Recognizer.scriptsDir, 'forced_alignment.sh'),

    mispronunciationInitScript: 
        path.join(Recognizer.scriptsDir, 'mispronunciation_init.sh');
    mispronunciationDetectionScript: 
        path.join(Recognizer.scriptsDir, 'mispronunciation_detection.sh'),

};

util.inherits(Recognizer, EventEmitter);
module.exports = Recognizer;

/* Add methods from the recognizer submodules */
require('./recognition')(Recognizer.prototype);
require('./alignment')(Recognizer.prototype);
require('./mispronunciation')(Recognizer.prototype);
