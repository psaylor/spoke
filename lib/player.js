var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var debug = require('debug')('spoke:recorder');
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

};

util.inherits(Player, EventEmitter);

/**
    Converts inputAudio, a raw audio file or raw audio stream, to outputFileType
    format with sample rate outputSampleRate (from options, defaults to a 16kHz
    wav format.
    You can provide a callback which will get passed an error if there was one,
    or the result if successful: cb(err, result)
    Or you can add event listeners for 'error' and 'end'
*/
Player.prototype.trimAudio = function (wavInput, outputPipe, startSample, endSample) {

    var startTimeFormatted = '=' + startSample + 's';
    var endTimeFormatted = '=' + endSample + 's';

    var command = SoxCommand(wavInput)
        .inputFileType('wav')
        .output(outputPipe)
        .outputFileType('wav')
        .trim(startTimeFormatted, endTimeFormatted)
        .run();

    command.on('error', function (err, stdout, stderr) {
        this.emit('trimAudio error', err);
    });

    command.on('end', function (stdout, stderr) {
        this.emit('trimAudio done');
    });

    command.run();
};


module.exports = Player;