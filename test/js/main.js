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
        var recordButtonElement = $(".myRecordButton");
        var recordButtonColorLayer = recordButtonElement.find('.fa-microphone.stroked');
        var recorder = spoke.Recorder(recordButtonElement);

        // Can add listener either on the recordBtn passed in, or on the 
        // recorder instance by first wrapping it as a jQuery object
        // recordButtonElement.on('start.spoke.recorder', onStartEventData, 
        //     function (event) {
        //     console.log('Recording started for', event.data);
        // });

        recorder.on('start.spoke.recorder', {}, function (e) {
            console.log('Started spoke recorder:', e);
            recordButtonColorLayer.toggleClass('stroked-blue stroked-red');
        });

        recorder.on('stop.spoke.recorder', {}, function (e) {
            console.log('Stopped spoke recorder:', e);
            recordButtonColorLayer.toggleClass('stroked-blue stroked-red');
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
        var recognizerButtonElement = $('.myRecognizeButton');
        var recognizerButtonColor = recognizerButtonElement.find('.stroked');
        var resultsElement = $('.myRecognitionResults');
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