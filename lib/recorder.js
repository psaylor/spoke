'use strict';

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var debug = require('debug')('spoke:recorder');
var _ = require('underscore');
var Promise = require('bluebird');

var SoxCommand = require('sox-audio');

var Recorder = function (options) {
    if(!(this instanceof Recorder)) {
        return new Recorder(options);
    }
    options = options || {};
    /* Combines the provided options with the defaults into a new object.
    Properties in options override those in defauls. */
    this.settings = _.extend({}, Recorder.DEFAULTS, options);
    debug('Created new Recorder with settings', this.settings);
    EventEmitter.call(this);
};

Recorder.DEFAULTS = {
    /* Default input configuration for raw input */
    inputEncoding: 'signed',
    inputBits: 16,
    inputChannels: 1,
    inputSampleRate: 44100,

    /* Default output configuration */
    outputFileType: 'wav',
    outputSampleRate: 16000,

    /* Set a recording directory path which all filenames
    will be relative to */
    //TODO: implement this
    recordingDir: '',
};

util.inherits(Recorder, EventEmitter);

/**
    Converts inputAudio, a raw audio file or raw audio stream, to outputFileType
    format with sample rate outputSampleRate (from options, defaults to a 16kHz
    wav format.
    You can provide a callback which will get passed an error if there was one,
    or the result if successful: cb(err, result)
    Or you can add event listeners for 'error' and 'end'
    Returns this Recorder instance for chaining
*/
Recorder.prototype.convertAndSave = function (rawInputAudio, outputAudio, cb) {
    cb = cb || _.noop;
    console.log('Converting and saving to', outputAudio);

    var command = this._createTranscodeSoxCommand(rawInputAudio, outputAudio);

    command.on('error', function (err, stdout, stderr) {
        console
        cb(err, null);
    });

    command.on('end', function (stdout, stderr) {
        cb(null, outputAudio)
    });

    command.run();
    return this;
};

/**
    Converts inputAudio, a raw audio file or raw audio stream, to outputFileType
    format with sample rate outputSampleRate (from options, defaults to a 16kHz
    wav format.
    Returns a Promise which will be fulfilled with the outputAudio stream or file
    upon completion, or rejected with the SoxCommand error upon failure.
*/
Recorder.prototype.convertAndSaveAsync = function (rawInputAudio, outputAudio) {
    var self = this;
    return new Promise(function convertAndSavePromise(resolve, reject) {
        var command = self._createTranscodeSoxCommand(rawInputAudio, outputAudio);
        command.on('error', function (err, stdout, stderr) {
            reject(err);
        });

        command.on('end', function (stdout, stderr) {
            resolve(outputAudio);
        });

        command.run();
    });
};

Recorder.prototype._createTranscodeSoxCommand = function (rawInputAudio, outputAudio) {
    var command = SoxCommand(rawInputAudio)
        .inputSampleRate(this.settings.inputSampleRate)
        .inputEncoding(this.settings.inputEncoding)
        .inputBits(this.settings.inputBits)
        .inputChannels(this.settings.inputChannels)
        .inputFileType('raw')
        .output(outputAudio)
        .outputFileType(this.settings.outputFileType)
        .outputSampleRate(this.settings.outputSampleRate);

    command.on('start', function (cmd) {
        debug('SoxCommand running command:', cmd);
    });

    command.on('error', function (err, stdout, stderr) {
        debug('Error converting and saving rawInputAudio', err.message);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    command.on('end', function (stdout, stderr) {
        debug('SoxCommand converted and saved successfully to', outputAudio);
        debug('SoxCommand stdout:', stdout);
        debug('SoxCommand stderr:', stderr);
    });

    return command;
};

Recorder.prototype.saveRaw = function(rawAudioStream, filename, cb) {
    cb = cb || _.noop;
    var rawFileWriter = this._createRawFileWriter(filename);
    rawFileWriter.on('finish', function () {
        cb(null, filename);
    });
    rawFileWriter.on('error', function (err) {
        cb(err, filename);
    });
    rawAudioStream.pipe(rawFileWriter);
    return this;
};

Recorder.prototype.saveRawAsync = function(rawAudioStream, filename) {
    var self = this;
    return new Promise(function saveRawPromise(resolve, reject) {
        var rawFileWriter = self._createRawFileWriter(filename);

        rawFileWriter.on('finish', function () {
            resolve(filename);
        });

        rawFileWriter.on('error', function (err) {
            reject(error);
        });

        rawAudioStream.pipe(rawFileWriter);
    });
};

/* Creates a writable stream for writing raw audio to a file at filename. Sets
listeners on the stream for debugging */
Recorder.prototype._createRawFileWriter = function (filename) {
    var rawFileWriter = fs.createWriteStream(filename, {encoding: 'binary'});
    rawFileWriter.on('finish', function () {
        debug('Finished writing raw audio to ', filename);
    });

    rawFileWriter.on('error', function (err) {
        debug('Error writing raw audio to ', filename, ':', err);
    });

    return rawFileWriter;
};

module.exports = Recorder;