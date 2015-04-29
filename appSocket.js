var socketIO = require('socket.io');
var ss = require('socket.io-stream');
var util = require('util');
var fs = require('fs');
var extfs = require('extfs');
var Recognizer = require('./lib/recognizer');

// %d is for the recording timestamp
// var RECORDINGS_DIRECTORY_FORMAT = '/data/sls/scratch/psaylor/recordings/%d';
var RECORDINGS_DIRECTORY_FORMAT = __dirname + '/recordings/%d'

// %d is for a number unique to each utterance within the same session
var RAW_FILE_NAME_FORMAT = '%s/utterance_%d.raw';
var WAV_FILE_NAME_FORMAT = '%s/utterance_%d.wav';
var TXT_FILE_NAME_FORMAT = '%s/utterance_%d.txt';

var DATA_DIRECTORY_FORMAT = '/data/sls/scratch/psaylor/data/%d';
var TIMINGS_DIRECTORY_FORMAT = '%s/time';
var MISPRO_DIRECTORY_FORMAT = '%s/misp';
// first and second %d are speaker, which is timestamp
// third %d is utterance number
var TIMING_FILE_NAME_PATTERN = /utterance_\d+(?=.txt)/;
var TIMING_FILE_ID_PATTERN = /\d+/;
var TIMING_PATH_FORMAT = '%s/%s';
var MISPRO_FILE_NAME_PATTERN = '%s/utterance_%d.out';
var UTTERANCE_ID_PATTERN = /utterance_(\d)+.out/;

var AppSocket = function(server) {
    var io = socketIO(server);

    io.on('connection', function(socket) {
        console.log('Connected to client socket'); 
        var timestamp = new Date().getTime();
        var recordingsDir = util.format(RECORDINGS_DIRECTORY_FORMAT, timestamp);
        var dataOutputDir = util.format(DATA_DIRECTORY_FORMAT, timestamp);

        var timingData = {};

        fs.mkdirSync(recordingsDir);

        ss(socket).on('audioStream', function(stream, data) {
            console.log('Receiving stream audio for data', data);

            var streamId = data.fragment;
            var streamText = data.text.toLowerCase().replace('.', '') + '\n';
            var clientSampleRate = data.sampleRate;

            var rawFileName = util.format(RAW_FILE_NAME_FORMAT, recordingsDir, streamId);
            var wavFileName = util.format(WAV_FILE_NAME_FORMAT, recordingsDir, streamId);
            var txtFileName = util.format(TXT_FILE_NAME_FORMAT, recordingsDir, streamId);

            console.log('Saving raw audio to file ' + rawFileName);
            console.log('Saving converted wav audio to file ' + wavFileName);

            var rawFileWriter = fs.createWriteStream(rawFileName, {encoding: 'binary'});
            fs.writeFile(txtFileName, streamText);

            stream.on('end', function(e) {
                console.log('audio stream', streamId, 'ended');
            });

            var onRecognitionResult = function (err, result) {
                if (err) {
                    console.log('Error with recognizing', wavFileName, err);
                    return;
                }
                console.log('Recognition for', wavFileName, ':', result);
            };

            var onForcedAlignmentResult = function (err, alignmentFile) {
                if (err) {
                    socket.emit('audioStreamResult', {
                        success: false,
                        fragment: streamId,
                    });
                    return;
                }
                console.log('Forced alignment for', wavFileName, ':', alignmentFile);
                Recognizer.getAlignmentResults(alignmentFile, 
                    function(err, fragmentTimingData) {
                        if (err) {
                            console.log('Alignment Results error:', err);
                            return;
                        }
                        console.log('Alignment Results:', fragmentTimingData);
                        timingData[streamId] = fragmentTimingData;
                        socket.emit('audioStreamResult', {
                            success: (err === null),
                            fragment: streamId,
                        });
                });
               
            };

            var onWavConversion = function (err, result) {
                if (err) {
                    console.log('Error converting wav file', err);
                    return;
                }
                Recognizer.forcedAlignment(wavFileName, txtFileName, 
                    dataOutputDir, onForcedAlignmentResult);
            };

            stream.pipe(rawFileWriter);
            stream.on('data', function(data) {
                console.log('Stream data: ', data);
            });
            Recognizer.convertToWav(stream, clientSampleRate, wavFileName, onWavConversion);
            
        });

        /* 
        A playback request specifying the fragment to playback
        */
        socket.on('playbackRequest', function (data) {
            var wavFileName = util.format(WAV_FILE_NAME_FORMAT, recordingsDir, 
                data.startFragment);
            console.log('playback request for', data);
            console.log('timing data for fragment:', timingData[data.startFragment]);
            console.log('timing data for first:', timingData[data.startFragment][data.startIndex]);

            // TODO: check if file name exists first
            var meta = data;
            
            // setup a stream to communicate with client
            var stream = ss.createStream();
            ss(socket).emit('playbackResult', stream, meta);

            // pipe the wav file onto that stream
            var wavStream = fs.createReadStream(wavFileName);
            if ((data.startIndex === 0) && (data.endIndex === -1) && (data.startFragment === data.endFragment)) {
                // playing back a single whole utterance
                wavStream.pipe(stream);
                return;
            }
            var startSample = timingData[data.startFragment][data.startIndex].start_sample;
            var endSample = timingData[data.endFragment][data.endIndex].end_sample;

            // cut the file with sox
            Recognizer.trimAudio(wavStream, stream, startSample, endSample);
            
        });

        socket.on('disconnect', function () {
            console.log('socket disconnect');
            extfs.isEmpty(recordingsDir, function(empty) {
                if (empty) {
                    console.log("Removing recording dir", recordingsDir);
                    fs.rmdir(recordingsDir, function (err) {
                        //ignore errors
                    });
                }
            });
        });

    });

};


module.exports = AppSocket;