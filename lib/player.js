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

// takes an audio file and streams it back. Either returns a stream or takes a writable stream to pipe the stream into.
Player.prototype.stream = function (audioInputFile, outputPipe) {
    var audioStream = fs.createReadStream(audioInputFile);
    if (outputPipe) {
        audioStream.pipe(outputPipe);
    } else {
        return audioStream;
    }
};

Player.prototype.trimAndConcatAudio = function (wavInputs, outputPipe, startSample, endSample, cb) {
    cb = cb || _.noop;
    var command = this._createTrimAndConcatSoxCommand(wavInputs, outputPipe, startSample, endSample)

    command.on('error', function (err, stdout, stderr) {
        cb(err, null);
    });

    command.on('end', function (stdout, stderr) {
        cb(null, outputPipe);
    });

    command.run();
    return this;
};

Player.prototype._createTrimSoxCommand = function (wavInput, outputPipe, startSample, endSample) {
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

Player.prototype._createTrimAndConcatSoxCommand = function (wavInputs, outputPipe, startSample, endSample) {
    var startTimeFormatted = this._formatTimeAbsoluteSample(startSample);
    var endTimeFormatted = this._formatTimeAbsoluteSample(endSample);

    var trimFirstFileSubCommand = SoxCommand()
        .input(wavInputs[0])
        .output('-p')
        .outputFileType('wav')
        .trim(startTimeFormatted);

    trimFirstFileSubCommand.on('error', function (err, stdout, stderr) {
        debug('Error trimming first audio input', wavInputs[0], 'from', startSample, 'to end');
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    trimFirstFileSubCommand.on('end', function (stdout, stderr) {
        debug('SoxCommand successfully trimmed first audio input', wavInputs[0], 'from', startSample, 'to end');
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    var trimLastFileSubCommand = SoxCommand()
        .input(wavInputs[wavInputs.length - 1])
        .output('-p')
        .outputFileType('wav')
        .trim(0, endTimeFormatted);

    trimLastFileSubCommand.on('error', function (err, stdout, stderr) {
        debug('Error trimming last audio input', wavInputs[wavInputs.length - 1], 'from beginning to', endSample);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    trimLastFileSubCommand.on('end', function (stdout, stderr) {
        debug('SoxCommand successfully trimmed last audio input', wavInputs[wavInputs.length - 1], 'from beginning to', endSample);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    // add the subcommand to trim the first wav input file
    var command = SoxCommand()
        .inputSubCommand(trimFirstFileSubCommand);

    // add the intervening wav input files untrimmed
    wavInputs.slice(1, -1).forEach(function(fileName) {
        command.input(fileName);
    });

    // add the subcommand to trim the last wav input file,
    // concat all of the inputs together, and send it to the outputpipe
    command.inputSubCommand(trimLastFileSubCommand)
        .output(outputPipe)
        .concat();

    command.on('error', function (err, stdout, stderr) {
        debug('Error concatenating audio inputs', wavInputs, 'from', startSample, 'to', endSample);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    command.on('end', function (stdout, stderr) {
        debug('SoxCommand successfully concatenated', wavInputs, 'from', startSample, 'to', endSample);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });
    return command;
};

Player.prototype._formatTimeAbsoluteSample = function (sampleNumber) {
    return '=' + sampleNumber + 's';
};


module.exports = Player;