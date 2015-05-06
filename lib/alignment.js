'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');

var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var spawn = require('child_process').spawn;

var debug = require('debug')('spoke:alignment');
var _ = require('underscore');
var Promise = require('bluebird');

var TimingTransformer = require('parser').TimingTransformer;


/* Add recognition methods to a prototype */
module.exports = function (proto) {

    proto.forcedAlignment = function (wavFile, txtFile, outputDir, cb) {
        debug('Running', this.settings.forcedAlignmentScript,
            'forced alignment on', wavFile, 'and', txtFile);
        var command = [this.settings.forcedAlignmentScript, wavFile, txtFile, 
            outputDir].join(' ');
        var child = exec(command, function (err, stdout, stderr) {
            debug('Forced alignment stdout:', stdout);
            debug('Forced alignment stderr:', stderr);
            if (err) {
                debug('Forced alignment exec error:', err);
                cb(err);
                return;
            }
            var alignmentFile = this._getAlignmentOutputFile(txtFile, outputDir);
            cb(null, alignmentFile);
        });
    };

    /* Constructs the expected output filename from the forced alignment, given
        one of the input files (either the wav or the txt since they should have the
        same basename) and the output directory used for the forced alignment.
    */
    var TIMING_OUPUT_FORMAT = '%s/time/%s';
    proto._getAlignmentOutputFile = function (inputFile, outputDir) {
        return util.format(TIMING_OUPUT_FORMAT, outputDir, path.basename(inputFile));
    };

    proto.getAlignmentResults = function (alignmentFile, cb) {
        var wordBoundaries = [];
        var aggregate = through (
            function write (wordBoundary) {
                wordBoundaries.push(wordBoundary);
            },
            function end () {
                cb(null, wordBoundaries);
            });

        var readStream = fs.createReadStream(alignmentFile);
        readStream.pipe(TimingTransformer())
            .pipe(aggregate);
    };

};
