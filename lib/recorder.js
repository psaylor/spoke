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

    /* */
};

util.inherits(Recorder, EventEmitter);

/**
    Converts inputAudio, a raw audio file or raw audio stream, to outputFileType
    format with sample rate outputSampleRate (from options, defaults to a 16kHz
    wav format.
    You can provide a callback which will get passed an error if there was one,
    or the result if successful: cb(err, result)
    Or you can add event listeners for 'error' and 'end'
*/
Recorder.prototype.convertAndSave = function (rawInputAudio, outputAudio, cb) {
    cb = cb || _.noop();

    var command = this._createTranscodeSoxCommand();

    command.on('error', function (err, stdout, stderr) {
        this.emit('error', err);
        cb(err, null);
    });

    command.on('end', function (stdout, stderr) {
        this.emit('done', outputAudio);
        cb(null, outputAudio)
    });

    command.run();
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
        var command = self.__createTranscodeSoxCommand();
        command.on('error', function (err, stdout, stderr) {
            reject(err);
        });

        command.on('end', function (stdout, stderr) {
            resolve(outputAudio);
        });

        command.run();
    });
};

Recorder.prototype._createTranscodeSoxCommand = function () {
    var command = SoxCommand(rawInputAudio)
        .inputSampleRate(this.settings.inputSampleRate)
        .inputEncoding(this.settings.inputEncoding)
        .inputBits(this.settings.inputBits)
        .inputChannels(this.settings.inputChannels)
        .inputFileType('raw')
        .output(outputAudio)
        .output(this.settings.outputFileType)
        .outputSampleRate(this.settings.outputSampleRate);

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

Recorder.prototype.saveRaw = function(rawAudioStream, filename) {
    var rawFileWriter = fs.createWriteStream(filename, {encoding: 'binary'});
    rawAudioStream.pipe(rawFileWriter);
};

Recorder.prototype.saveRawAsync = function(rawAudioStream, filename) {
    return new Promise(function saveRawPromise(resolve, reject) {
        var rawFileWriter = fs.createWriteStream(filename, 
            {encoding: 'binary'});
        // TODO: reject on error in filewriter or in stream
        rawAudioStream.pipe(rawFileWriter);
        // TODO: resolve if successful
        resolve(true);
    });
};

module.exports = Recorder;