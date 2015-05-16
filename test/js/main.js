require.config({
    paths: {
        /* Configure location for third-party libraries, using CDN and a local fallback */
        'jquery': [
            'https://code.jquery.com/jquery-1.11.0.min',
        ],
        'spoke': 'spoke',
    },
});

require(['jquery', 'spoke'], 
    function($, spoke) {
        /**
        * YOUR CODE HERE
        */
        console.log('loaded spoke:', spoke);

        var socket = spoke.sharedSocket.getSocket();
        var ioStream = spoke.sharedSocket.ioStream;

        /* Volume Meter Test */
        var volumeMeterElement = $('.myVolumeMeter');
        var volumeMeter = spoke.microphone.VolumeMeter(volumeMeterElement);
        volumeMeter.on('volumeLevel.spoke.volumeMeter', function (event, volumeLevel) {
            /* Do whatever you want with the volume level here */
        });

        /* Recorder Test */
        var recordButtonElement = $('.myRecordButton');
        var recordButtonColorLayer = recordButtonElement.find('.fa-microphone.stroked');
        var recorder = spoke.Recorder(recordButtonElement);

        recorder.on('start.spoke.recorder', {}, function (e) {
            console.log('Started spoke recorder:', e);
            recordButtonColorLayer.toggleClass('stroked-blue stroked-red');
        });

        recorder.on('stop.spoke.recorder', {}, function (e) {
            console.log('Stopped spoke recorder:', e);
            recordButtonColorLayer.toggleClass('stroked-blue stroked-red');
        });

        socket.on('success.spoke.recorder', function (filename) {
            console.log('Got recorder success status from server:', filename);
        });
        socket.on('error.spoke.recorder', function (err) {
            console.log('Got recorder error status from server:', err);
        });

        /* Custom recognizer event handlers */
        var customResultsElement = $('#demo1 .myRecognitionResults');
        socket.on('result.spoke.recognizer', function (result) {
            console.log('Result from custom speech recognition:', result);
            customResultsElement.text(result);
        });
        socket.on('error.spoke.recognizer', function (err) {
            console.log('Error during custom speech recognition:', err);
            customResultsElement.text('Error');
        });

        /* Custom forced alignment event handlers */
        var alignmentText = spoke.utils.normalizeString($('#alignmentText').html());
        console.log('Expected text:', alignmentText);
        var alignmentConfig = {
            socketioEvents: {
                emitAudioStream: 'alignAudioStream'
            },
            audioMetadata: {
                text: alignmentText,
            },
        };
        var alignmentButtonElement = $('#demo3 .myRecordSentenceButton');
        var alignmentSuccessElement = $('#alignmentSuccess');
        var alignmentRecorder = spoke.Recorder(alignmentButtonElement, alignmentConfig);
        alignmentButtonElement.click(function (event) {
            $(this).toggleClass('btn-primary btn-warning');
        });
        socket.on('result.spoke.alignment', function (result) {
            console.log('Result from custom forced alignment:', result);
            alignmentSuccessElement.removeClass('hidden');
        });

        /* Custom mispro  event handlers */
        var misproText = spoke.utils.normalizeString($('#misproText').html());
        console.log('Expected text:', misproText);
        var misproConfig = {
            socketioEvents: {
                emitAudioStream: 'misproAudioStream'
            },
            audioMetadata: {
                text: misproText,
            },
        };
        var misproButtonElement = $('#demo4 .myRecordSentenceButton');
        var misproSuccessElement = $('#misproSuccess');
        var misproRecorder = spoke.Recorder(misproButtonElement, misproConfig);
        misproButtonElement.click(function (event) {
            $(this).toggleClass('btn-primary btn-warning');
        });
        socket.on('result.spoke.mispro', function (result) {
            console.log('Result from custom mispro detection:', result);
            misproSuccessElement.removeClass('hidden');
        });

        /* Player Test */
        $('.myPlayBtn').on('click', function (event) {
            console.log('Sending play request');
            socket.emit('playRequest', $(this).data('playlength') === 'short');
        });

        // Listen for playback result, and play it
        ioStream(socket).on('playResult', function (audioStream, data) {
            console.log('Playback result for ', data);
            var player = spoke.Player(audioStream);
            player.on('ready.spoke.player', function () {
                console.log('Audio ready to play.');
            });
            player.on('done.spoke.player', function () {
                console.log('Audio finished playing.');
            });
        });


        /* Recognizer Test */
        /* TODO rename this Recognizer b/c wrapper around Google SR*/
        var recognizerButtonElement = $('.myRecognizeButton');
        var recognizerButtonColor = recognizerButtonElement.find('.stroked');
        var resultsElement = $('#demo2 .myRecognitionResults');
        var recognizer = spoke.recognizer.Recognizer(recognizerButtonElement);

        recognizer.on('start.spoke.recognizer', function (event) {
            console.log('Spoke Recognizer start', event);
            recognizerButtonColor.toggleClass('stroked-green stroked-orange');
        });

        recognizer.on('stop.spoke.recognizer', function (event) {
            console.log('Spoke Recognizer stop', event);
            recognizerButtonColor.toggleClass('stroked-green stroked-orange');
        });

        recognizer.on('finalResult.spoke.recognizer', function (event, data) {
            console.log('Final result from speech recognition:', event, data);
            resultsElement.text(data);
        });

});