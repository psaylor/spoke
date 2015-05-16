'use strict';

var util = require('util');

var debug = require('debug')('spoke:spoke');
var _ = require('underscore');

var socketIO = require('socket.io');
var ss = require('socket.io-stream');

var Recorder = require('./recorder');
var Player = require('./player');
var Recognizer = require('./recognizer');
var Alignment = require('./alignment');
var Mispro = require('./mispro');
var utils = require('./utils');

var Spoke = function (options) {

    // Make using the 'new' keyword optional
    if (!(this instanceof Spoke)) {
        return new Spoke(options);
    }

    options = options || {};
    this.settings = _.extend({}, Spoke.DEFAULTS, options);
    debug('Spoke configured with settings', this.settings);
};

Spoke.DEFAULTS = {

};

/* Add each of the modules to Spoke */
Spoke.Recorder = Recorder;
Spoke.Player = Player;
Spoke.Recognizer = Recognizer;
Spoke.Alignment = Alignment;
Spoke.Mispro = Mispro;
Spoke.utils = utils;

module.exports = Spoke;