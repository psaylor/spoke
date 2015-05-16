var socketIO = require('socket.io');
var ss = require('socket.io-stream');
var fs = require('fs');
var Promise = require('bluebird');
var fsAsync = Promise.promisifyAll(require('fs'));
var path = require('path');
var util = require('util');

var Spoke = require('../index');

var DATA_DIR_PROD = '/data/sls/scratch/psaylor/data/%d';
var RECORDINGS_DIR_PROD = '/data/sls/scratch/psaylor/recordings/%d';
var RECORDINGS_DIR_DEV = path.join(__dirname, 'recordings', '%d');

/**
    also get a sep forced alignment script that doesn't depend on those things
*/

var socketHandler = function (server, app) {
    console.log('Adding socket handling to the server...');
    var io = socketIO(server);
    console.log('Running in', app.get('env'), 'mode');
    var REC_DIR = app.get('env') == 'development' ? RECORDINGS_DIR_DEV : RECORDINGS_DIR_PROD;
    var DATA_DIR = app.get('env') == 'development' ? RECORDINGS_DIR_DEV : DATA_DIR_PROD;

    io.on('connection', function (socket) {
        console.log('Connected to client socket');
        var timestamp = new Date().getTime();
        var recordingsDir =  util.format(REC_DIR, timestamp);
        var dataDir = util.format(DATA_DIR, timestamp);

        fs.mkdirSync(recordingsDir);
        if (dataDir !== recordingsDir) {
            fs.mkdirSync(dataDir);
        }
        
        console.log('Saving recordings from this session to', recordingsDir);

        /* Use Spoke library for processing audio to/from client */
        var recorder = new Spoke.Recorder();
        var player = new Spoke.Player();
        var recognizer = new Spoke.Recognizer();
        var alignment = new Spoke.Alignment(dataDir);
        var mispro = new Spoke.Mispro(dataDir);

        alignment._initDir();
        // mispro._initDir();

        var recordingNum = 0;
        ss(socket).on('audioStream', function (stream, data) {
            console.log('Receiving raw audio stream with data', data);
            var rawFilename = recordingsDir + '/rec_' + recordingNum + '.raw';
            var wavFilename = recordingsDir + '/rec_' + recordingNum + '.wav';
            console.log('Saving to raw file:', rawFilename);
            console.log('Saving to wav file:', wavFilename);
            recordingNum++;
            
            recorder.saveRawAsync(stream, rawFilename)
                .then(function () {
                    console.log('Raw audio saved with promises!');
                });


            /* The this arg for recognizer is not getting set properly, 
            so we have to either 
            bind(recognizer) to set this=recognizer before
            executing the promise using the recognizer 
            convertAndSaveAsync(...)
                .bind(recognizer)
                .then(recognizer.recognizeAsync)
            or
            use explicit functions inside then */
            recorder.convertAndSaveAsync(stream, wavFilename)
                .catch(function reject (err) {
                    socket.emit('error.spoke.recorder', err);
                })
                .then(function resolve (result) {
                    socket.emit('success.spoke.recorder', result);
                    return recognizer.recognizeAsync(result);
                })
                .catch(function reject (err) {
                    socket.emit('error.spoke.recognizer', err);
                })
                .then(function resolve (result) {
                    console.log('Recognition result:', result);
                    socket.emit('result.spoke.recognizer', result);
                });

            stream.on('end', function () {
                console.log('Audio stream ended.');
            });
        });

        ss(socket).on('alignAudioStream', function (stream, data) {
            console.log('Receiving raw audio stream for alignment with data', data);
            var wavFilename = path.join(recordingsDir, 'rec_' + recordingNum + '.wav');
            var txtFilename = path.join(recordingsDir, 'rec_' + recordingNum + '.txt');
            console.log('Saving to wav file:', wavFilename);
            console.log('Saving to txt file:', txtFilename);
            recordingNum++;

            var txtPromise = fsAsync.writeFileAsync(txtFilename, data.text);

            var recordingPromise = recorder.convertAndSaveAsync(stream, wavFilename);
            recordingPromise.catch(function reject (err) {
                    socket.emit('error.spoke.recorder', err);
                })
                .then(function resolve (result) {
                    console.log('Wav saved to', result);
                    socket.emit('success.spoke.recorder', result); 
                });

            Promise.join(recordingPromise, txtPromise)
                .then(function(result) {
                    console.log('Now doing forced alignment with result', result);
                    return alignment.forcedAlignmentAsync(wavFilename, txtFilename);
                })
                .catch(function reject (err) {
                    console.log('Forced alignment error', err);
                    socket.emit('error.spoke.alignment', err);
                })
                .then(function resolve (result) {
                    console.log('Alignment result:', result);
                    socket.emit('result.spoke.alignment', result);
                });

            stream.on('end', function () {
                console.log('Alignment audio stream ended.');
            });
        });

        ss(socket).on('misproAudioStream', function (stream, data) {
            console.log('Receiving raw audio stream for mispro detection with data', data);
            var wavFilename = path.join(recordingsDir, 'rec_' + recordingNum + '.wav');
            var txtFilename = path.join(recordingsDir, 'rec_' + recordingNum + '.txt');
            console.log('Saving to wav file:', wavFilename);
            console.log('Saving to txt file:', txtFilename);
            recordingNum++;

            var txtPromise = fsAsync.writeFileAsync(txtFilename, data.text);

            var recordingPromise = recorder.convertAndSaveAsync(stream, wavFilename);
            recordingPromise.catch(function reject (err) {
                    socket.emit('error.spoke.recorder', err);
                })
                .then(function resolve (result) {
                    console.log('Wav saved to', result);
                    socket.emit('success.spoke.recorder', result); 
                });

            Promise.join(recordingPromise, txtPromise)
                .then(function(result) {
                    console.log('Now doing forced alignment with result', result);
                    return alignment.forcedAlignmentAsync(wavFilename, txtFilename);
                })
                .catch(function reject (err) {
                    console.log('Forced alignment error', err);
                    socket.emit('error.spoke.alignment', err);
                })
                .then(function resolve (result) {
                    console.log('Alignment result:', result);
                    socket.emit('result.spoke.alignment', result);
                    return mispro.processAsync(wavFilename);
                })
                .catch(function reject (err) {
                    console.log('Mispro process error:', err);
                    socket.emit('error.spoke.mispro', err);
                })
                .then(function resolve (result) {
                    console.log('Mispro processing finished with result', result);
                    return mispro.misproDetectionAsync();
                })
                .catch(function reject (error) {
                    socket.emit('error.spoke.mispro', err);
                })
                .then(function resolve (result) {
                    socket.emit('result.spoke.mispro', result);
                });

            /*If no prints or socket emits are needed, you can just chain everything
            with .call statements to provide a variable thisArg so it gets called properly
            cannot call then with just the method name b/c this becomes undefined */
        });

        socket.on('playRequest', function (shortened) {
            shortened = shortened || false;
            console.log('Received play request. For shortened clip?', shortened);

            // setup a stream to communicate with client
            var stream = ss.createStream();
            var meta = {type: 'rain', shortened: shortened};
            ss(socket).emit('playResult', stream, meta);

            // trim the audio and pipe the wav file onto the socket.io stream
            var rainWav = __dirname + '/rain.wav';
            var endSample = shortened ? 62600 : 122600;
            player.trimAudio(rainWav, stream, 0, endSample);
        });

        socket.on('disconnect', function () { 
            console.log('Socket disconnected');
        });
    });
};

module.exports = socketHandler;

