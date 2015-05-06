'use strict';

var socketIO = require('socket.io');
var ss = require('socket.io-stream');
var fs = require('fs');

var Spoke = require('../index');

var socketHandler = function (server) {
    console.log('Adding socket handling to the server...');
    var io = socketIO(server);

    io.on('connection', function (socket) {
        console.log('Connected to client socket');
        var timestamp = new Date().getTime();
        var recordingsDir = 'recordings/' + timestamp;
        fs.mkdirSync(recordingsDir);
        console.log('Saving recordings from this session to', recordingsDir);

        var recorder = new Spoke.Recorder();
        var player = new Spoke.Player();

        var recordingNum = 0;
        ss(socket).on('audioStream', function (stream, data) {
            console.log('Receiving raw audio stream with data', data);
            var rawFilename = recordingsDir + '/rec_' + recordingNum + '.raw';
            var wavFilename = recordingsDir + '/rec_' + recordingNum + '.wav';
            console.log('Saving to raw file:', rawFilename);
            recorder.saveRaw(stream, rawFilename);
            console.log('Saving to wav file:', wavFilename);
            recorder.convertAndSave(stream, wavFilename);

            stream.on('end', function () {
                console.log('Audio stream ended.');
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

