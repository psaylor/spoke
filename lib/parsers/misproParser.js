'use strict';
var Transform = require('stream').Transform;
var util = require('util');
var split = require('split');
var combine = require('stream-combiner');

var _ = require('underscore');

var headerFormat = '---%s---';

var wordStartMarker = util.format(headerFormat, 'WORD STARTS');
var wordEndMarker = util.format(headerFormat, 'WORD ENDS');

var wordSummaryStartMarker = util.format(headerFormat, 'WORD SUMMARY STARTS');
var wordSummaryEndMarker = util.format(headerFormat, 'WORD SUMMARY ENDS');

var ruleSummaryStartMarker = util.format(headerFormat, 'RULE SUMMARY STARTS');
var ruleSummaryEndMarker = util.format(headerFormat, 'RULE SUMMARY ENDS');

var MisproTransformer = function (options) {

    if (!(this instanceof MisproTransformer)) {
        return new MisproTransformer(options);
    }
    options = options || {};
    this.settings = _.extend({}, MisproTransformer.DEFAULTS, options);
    Transform.call(this, this.settings);
    console.log('Made new MisproTransformer with options', this.settings);

    this._inWord = false;
    this._inWordSummary = false;
    this._inRuleSummary = false;
};

MisproTransformer.DEFAULTS = {
    writableObjectMode: true, // output custom Object instead of Buffer
    readableObjectMode: true, // read in as String instead of Buffer
    objectMode: true,
};

util.inherits(MisproTransformer, Transform);

MisproTransformer.prototype._transform = function (line, encoding, cb) {
    cb = cb || _.noop;
    console.log('Transform line', line);
    switch (line) {
        case wordStartMarker:
            console.log('in word');
            this._inWord = true;
            cb();
            return;
        case wordEndMarker:
            console.log('out of word');
            this._inWord = false;
            cb();
            return;
        case wordSummaryStartMarker:
            console.log('in word summary');
            this._inWordSummary = true;
            cb();
            return;
        case wordSummaryEndMarker:
            console.log('out of word summary');
            this._inWordSummary = false;
            cb();
            return;
        case ruleSummaryStartMarker:
            console.log('in rule summary');
            this._inRuleSummary = true;
            cb();
            return;
        case ruleSummaryEndMarker:
            console.log('out of rule summary');
            this._inRuleSummary = false;
            cb();
            return;
    }

    if (this._inWord) {
        // was w** w <eps>
    }

    if (this._inWordSummary) {
        // was w** utt_id word_id
        console.log('Parsing word mispro:', line);
        var columns = line.split(' ');
        var wordMisproObject = {
            word: columns[0],
            spelling: columns[1],
            utteranceId: columns[2],
            wordId: columns[3]
        };
        this.push(wordMisproObject);
    }

    cb();

};

module.exports = MisproTransformer;