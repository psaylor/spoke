var socketIO = require('socket.io');
var ss = require('socket.io-stream');
var fs = require('fs');
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

            /* Cb to run recognition once the wav file is ready */
            var onWavSaved = function (err, outputAudio) {
                console.log('Wav saved:', err, outputAudio);
                if (err) {
                    socket.emit('error.spoke.recorder', err);
                    return;
                }
                socket.emit('success.spoke.recorder', wavFilename);

                recognizer.recognize(wavFilename, function (err, result) {
                    if (err) {
                        socket.emit('error.spoke.recognizer', err);
                        return;
                    }
                    socket.emit('result.spoke.recognizer', result);
                });
            };
            
            recorder.saveRaw(stream, rawFilename);
            recorder.convertAndSave(stream, wavFilename, onWavSaved);

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

            /* Cb to run forced alignment once the wav file is ready */
            var onWavSaved = function (err, outputAudio) {
                console.log('Wav saved:', err, outputAudio);
                if (err) {
                    socket.emit('error.spoke.recorder', err);
                    return;
                }
                socket.emit('success.spoke.recorder', wavFilename);

                alignment.forcedAlignment(wavFilename, txtFilename, 
                    function (err, result) {
                    if (err) {
                        socket.emit('error.spoke.alignment', err);
                        return;
                    }
                    socket.emit('result.spoke.alignment', result);
                });
            };
            
            recorder.convertAndSave(stream, wavFilename, onWavSaved);
            fs.writeFile(txtFilename, data.text);

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

            /* Cb to run forced alignment once the wav file is ready */
            var onWavSaved = function (err, outputAudio) {
                console.log('Wav saved:', err, outputAudio);
                if (err) {
                    socket.emit('error.spoke.recorder', err);
                    return;
                }
                socket.emit('success.spoke.recorder', wavFilename);

                alignment.forcedAlignment(wavFilename, txtFilename, 
                    function (err, result) {
                    if (err) {
                        socket.emit('error.spoke.alignment', err);
                        return;
                    }
                    socket.emit('result.spoke.alignment', result);
                    mispro.process(wavFilename, function (err, result) {
                        if (err) {
                            socket.emit('error.spoke.mispro', err);
                            return;
                        }
                        mispro.misproDetection(function (err, result) {
                            if (err) {
                                socket.emit('error.spoke.mispro', err);
                                return;
                            }
                            socket.emit('result.spoke.mispro', result);
                        });
                    });
                });
            };
            
            recorder.convertAndSave(stream, wavFilename, onWavSaved);
            fs.writeFile(txtFilename, data.text);

            stream.on('end', function () {
                console.log('Alignment audio stream ended.');
            });
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

