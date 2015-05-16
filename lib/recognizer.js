'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');

var exec = require('child_process').exec;

var debug = require('debug')('spoke:recognizer');
var _ = require('underscore');
var Promise = require('bluebird');


var Recognizer = function (options) {
    if(!(this instanceof Recognizer)) {
        return new Recognizer(options);
    }

    /* Combines the provided options with the defaults into a new object.
    Properties in options override those in defauls. */
    options = options || {};
    this.settings = _.extend({}, Recognizer.DEFAULTS, options);
    debug('Created new Recognizer with settings', this.settings);
};

Recognizer.scriptsDir = path.join(__dirname, '..', 'scripts');

Recognizer.DEFAULTS = {
    // The sample rate required by the recognizer
    recognizerSampleRate: 16000,

    recognitionScript:
        path.join(Recognizer.scriptsDir, 'nut_recognizer.sh'),
};

Recognizer.prototype.recognize = function (wavFile, cb) { 
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

// Recognizer.prototype.recognizeAsync = function (wavFile) {
//     var self = this; 
//     var promise = new Promise(function recognizePromise(resolve, reject) {
//         debug('Running', self.settings.recognitionScript, 'recognition on', wavFile);
//         console.log('Running');
//         var command = [self.settings.recognitionScript, wavFile].join(' ');
//         var child = exec(command, function (err, stdout, stderr) {
//             debug('Recognizer stdout:', stdout);
//             debug('Recognizer stderr:', stderr);
//             if (err) {
//                 debug('Recognizer exec error:', err);
//                 reject(err);
//                 return;
//             }
//             resolve(stdout);
//         });
//     });
//     return promise;
// };

Recognizer.prototype.recognizeAsync = Promise.promisify(Recognizer.prototype.recognize);

module.exports = Recognizer;