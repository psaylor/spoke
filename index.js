var socketIO = require('socket.io');
var ss = require('socket.io-stream');
var fs = require('fs');
var Promise = require('bluebird');
var fsAsync = Promise.promisifyAll(require('fs'));
var path = require('path');
var util = require('util');

var Spoke = require('./lib/spoke');

Spoke.prototype.addSocketHandlers = function (server, options) {
    options = options || {};
    var io = socketIO(server);

    var self = this;
    var recordingNum = 0;

    ss(socket).on('audioStream', function (stream, data) {
            console.log('Receiving raw audio stream for mispro detection with data', data);

            var wavFilename = self._getWavFilename(data);
            var txtFilename = self._getTxtFilename(data);
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
        });

};

module.exports = Spoke;