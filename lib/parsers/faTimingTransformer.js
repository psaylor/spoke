'use strict';
var parse = require('csv').parse;
var transform = require('csv').transform;
var combine = require('stream-combiner')

var FILLER_REGEX = /<([a-zA-Z]+)>/;

var SILENCE_PHONEME = 'sil';

var WORD_START = 'I';
var WORD_END = 'E';
var WORD_START_AND_END = 'IE';

var gen_transform_function = function () {
    var gathering = false;
    var current_object = null;

    var transform_reduce_function = function(record) {
        var word_boundary = record.word_boundary;

        if (gathering) {

            // add the phoneme from this row
            var phoneme = record.phoneme;
            if (phoneme !== SILENCE_PHONEME) {
                current_object.phonemes.push(phoneme);
            }

            // set end and emit if it's the end of the word
            if (word_boundary === WORD_END) {
                current_object.end_sample = record.end_sample;
                gathering = false;
                var return_object = current_object;
                current_object = null;
                if (!return_object.isFiller) {
                    return return_object;
                }
                
            } 

        } else { // non-gathering state

            if (word_boundary === WORD_START) {
                gathering = true; // now in gathering state
                current_object = {
                    start_sample : record.start_sample,
                    word : record.word,
                    phonemes : (record.phoneme !== SILENCE_PHONEME) ? [record.phoneme] : [],  // accumulate the phonemes in a list,
                    isFiller : FILLER_REGEX.test(record.word),
                };

            } else if (word_boundary === WORD_START_AND_END) {
                var return_object = {
                    start_sample : record.start_sample,
                    end_sample : record.end_sample,
                    word : record.word,
                    phonemes : [record.phoneme],  // accumulate the phonemes in a list,
                    isFiller : FILLER_REGEX.test(record.word),
                };
                if (return_object.isFiller) {
                    // hesitation like <uh> or <um>
                } else {
                    // emit the current object if it's not filler
                    return return_object;
                }
                
            }
            // ignore other rows b/c not in gathering state
        }
        return null;

    };
    return transform_reduce_function;
};


var TimingTransformer = function() {

    var parseOptions = {
        delimiter: ' ',  // use one space to delimit columns
        auto_parse: true,  // convert read data types to native types
        columns: ['start_sample', 'end_sample', 'phoneme', 'word', 'word_boundary'],
    };
    var parser = parse(parseOptions);

    var transformer = transform(gen_transform_function());

    var combinedStream = combine(parser, transformer);

    return combinedStream;

};

module.exports = TimingTransformer;