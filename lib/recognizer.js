var fs = require('fs');
var SoxCommand = require('sox-audio');
var TimeFormat = SoxCommand.TimeFormat;
var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var spawn = require('child_process').spawn;
var path = require('path');
var util = require('util');
var through = require('through');
var TimingTransformer = require('parser').TimingTransformer;

var Recognizer = function () {

};

var RECOGNIZER_SAMPLE_RATE = 16000;
var TIMING_OUPUT_FORMAT = '%s/time/%s';

Recognizer.convertToWav = function (rawInputFile, sampleRate, wavOutputFile, cb) {
    var command = SoxCommand(rawInputFile)
        .inputSampleRate(sampleRate)
        .inputEncoding('signed')
        .inputBits(16)
        .inputChannels(1)
        .inputFileType('raw')
        .output(wavOutputFile)
        .outputSampleRate(RECOGNIZER_SAMPLE_RATE);
    
    command.on('error', function (err, stdout, stderr) {
        console.log('Cannot process audio: ' + err.message);
        console.log('Sox Command Stdout: ', stdout);
        console.log('Sox Command Stderr: ', stderr)
        cb(err, null);
    });
    command.on('end', function() {
        cb(null, wavOutputFile);
    });
    command.run();
};

Recognizer.recognize = function (wavFile, cb) {
    console.log("Running recognition on ", wavFile);
    var command = ['./recognizer.sh', wavFile].join(' ');
    var child = exec(command,
        function (error, stdout, stderr) {
            console.log('Recognition stdout', stdout);
            console.log('Recognition stderr', stderr);
            if (error !== null) {
                console.log('Recognition exec error', error);
            }
            cb(stdout);
    });
};

Recognizer.forcedAlignment = function (wavFile, txtFile, outputDir, cb) {
    console.log('Running forced alignment on', wavFile, 'and', txtFile);
    var command = ['./lib/recognizer.sh', wavFile, txtFile, outputDir].join(' ');
    var child = exec(command,
        function (error, stdout, stderr) {
            console.log('Forced Alignment stdout', stdout);
            console.log('Forced Alignment stderr', stderr);
            if (error !== null) {
                console.log('Forced Alignment exec error', error);
                cb(error);
                return;
            }
            var resultFile = util.format(TIMING_OUPUT_FORMAT, outputDir, 
                path.basename(txtFile));
            cb(null, resultFile);
        });
};

Recognizer.getAlignmentResults = function (alignmentFile, cb) {
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

/*
WavInput can either be file path or stream
*/
Recognizer.trimAudio = function (wavInput, outputPipe, startSample, endSample) {
    var command = SoxCommand();
    var startTimeFormatted = '=' + startSample + 's';
    var endTimeFormatted = '=' + endSample + 's';
    command.input(wavInput)
        .inputFileType('wav')
        .output(outputPipe)
        .outputFileType('wav')
        .trim(startTimeFormatted, endTimeFormatted)
        .run();
};

module.exports = Recognizer;