'use strict';

var fs = require('fs');
var util = require('util');

var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var spawn = require('child_process').spawn;

var debug = require('debug')('spoke:recognition');
var _ = require('underscore');
var Promise = require('bluebird');


/* Add recognition methods to the Recognizer prototype */
module.exports = function (proto) {

    proto.recognize = function (wavFile, cb) {
        debug('Running', this.settings.recognitionScript, 'recognition on', wavFile);
        var command = [this.settings.recognitionScript, wavFile].join(' ');
        var child = exec(command, function (err, stdout, stderr) {
            debug('Recognizer stdout:', stdout);
            debug('Recognizer stderr:', stderr);
            if (err) {
                debug('Recognizer exec error:', err);
                cb(err, wavFile);
                return;
            }
            cb(null, stdout);
        });
    };

};
