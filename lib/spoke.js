'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var debug = require('debug')('spoke:spoke');
var _ = require('underscore');

var Recorder = require('./recorder');
var Player = require('./player');
var Recognizer = require('./recognizer');
var utils = require('./utils');

/* Create a sox command */
var Spoke = function (options) {

    // Make using the 'new' keyword optional
    if (!(this instanceof Spoke)) {
        return new Spoke(options);
    }

    options = options || {};
    this.settings = _.extend({}, Spoke.DEFAULTS, options);
    debug('Spoke configured with settings', this.settings);
    EventEmitter.call(this);
};

Spoke.DEFAULTS = {

};

util.inherits(Spoke, EventEmitter);

/* Add each of the modules to Spoke */
Spoke.Recorder = Recorder;
Spoke.Recognizer = Recognizer;
Spoke.Player = Player;
Spoke.utils = utils;

module.exports = Spoke;