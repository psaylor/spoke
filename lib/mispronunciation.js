'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');

var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var spawn = require('child_process').spawn;

var debug = require('debug')('spoke:mispronunciation');
var _ = require('underscore');
var Promise = require('bluebird');


/* Add mispronunciation detection methods to the Recognizer prototype */
module.exports = function (proto) {

    proto.misproInit = function (outputDir, cb) {
        debug('Initializing mispronunciation detection for directory', outputDir);
    };

    proto.mispronunciationDetection = function () {
        debug('Running mispronunciation detection');
    };

};
