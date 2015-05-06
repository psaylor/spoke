'use strict';

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var debug = require('debug')('spoke:player');
var _ = require('underscore');
var Promise = require('bluebird');

var SoxCommand = require('sox-audio');
var TimeFormat = SoxCommand.TimeFormat;

var Player = function (options) {
    if(!(this instanceof Player)) {
        return new Player(options);
    }
    options = options || {};
    /* Combines the provided options with the defaults into a new object.
    Properties in options override those in defauls. */
    this.settings = _.extend({}, Player.DEFAULTS, options);
    debug('Created new Player with settings', this.settings);
    EventEmitter.call(this);
};

Player.DEFAULTS = {
    /* The base directory to search for audio files in */
    audioDir: '',
};

util.inherits(Player, EventEmitter);

/**
    Trims a wav audio file, and sends the section of audio from startSample to
    endSample to the provided outputPipe
    You can provide a callback which will get passed an error if there was one,
    or the result if successful: cb(err, result)
    Returns this Player instance for chaining
*/
Player.prototype.trimAudio = function (wavInput, outputPipe, startSample, endSample, cb) {
    cb = cb || _.noop;
    var command = this._createTrimSoxCommand(wavInput, outputPipe, startSample, endSample)

    command.on('error', function (err, stdout, stderr) {
        cb(err, wavInput);
    });

    command.on('end', function (stdout, stderr) {
        cb(null, outputPipe);
    });

    command.run();
    return this;
};

Player.prototype.trimAudioAsync = function (wavInput, outputPipe, startSample, endSample) {
    var self = this;
    return new Promise(function trimAudioPromise(resolve, reject) {
        var command = self._createTrimSoxCommand(wavInput, outputPipe, startSample, endSample)

        command.on('error', function (err, stdout, stderr) {
            reject(err);
        });

        command.on('end', function (stdout, stderr) {
            resolve(outputPipe);
        });

        command.run();
    });
};

Player.prototype._createTrimSoxCommand = function(wavInput, outputPipe, startSample, endSample) {
    var startTimeFormatted = this._formatTimeAbsoluteSample(startSample);
    var endTimeFormatted = this._formatTimeAbsoluteSample(endSample);

    var command = SoxCommand(wavInput)
        .inputFileType('wav')
        .output(outputPipe)
        .outputFileType('wav')
        .trim(startTimeFormatted, endTimeFormatted);

    command.on('error', function (err, stdout, stderr) {
        debug('Error trimming audio input', wavInput, 'from', startSample, 'to', endSample);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    command.on('end', function (stdout, stderr) {
        debug('SoxCommand successfully trimmed', wavInput, 'from', startSample, 'to', endSample);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });
    return command;
};

Player.prototype._formatTimeAbsoluteSample = function (sampleNumber) {
    return '=' + sampleNumber + 's';
};


module.exports = Player;