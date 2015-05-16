'use strict';
var fs = require('fs');
var parse = require('csv').parse;
var transform = require('csv').transform;
var combine = require('stream-combiner')

// var FILLER_REGEX = /<[a-zA-Z]+>/;
var FILLER_REGEX = /([a-zA-Z]*)-?<([a-zA-Z]+)>/;
var SUBSTITUTION = /<sub>/;
var DELETION = /<del>/;
var INSERTION = /<ins>/;

var SILENCE_PHONEME = 'sil';

var WORD_START = 'I';
var WORD_END = 'E';
var WORD_START_AND_END = 'IE';

var gen_mispro_transform_function = function () {
    var gathering = false;
    var current_object = null;

    var transform_reduce_function = function(record) {
        var word_boundary = record.word_boundary;
        // console.log("Transforming record", record);

        if (gathering) {

            // check if phonemes are correct
            var recognized_phoneme = record.recognized_phoneme;
            var expected_phoneme = record.expected_phoneme;
            if (recognized_phoneme !== expected_phoneme) {
                console.log("Phoneme mismatch: ", expected_phoneme, recognized_phoneme);
                current_object.hasError = true;
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
                var phoneme_error = (recognized_phoneme !== expected_phoneme);
                current_object = {
                    start_sample : record.start_sample,
                    word : record.word,
                    // phonemes : (record.phoneme !== SILENCE_PHONEME) ? [record.phoneme] : [],  // accumulate the phonemes in a list,
                    isFiller : FILLER_REGEX.test(record.word),
                    hasError: phoneme_error,
                };

            } else if (word_boundary === WORD_START_AND_END) {
                var phoneme_error = (recognized_phoneme !== expected_phoneme);
                var return_object = {
                    start_sample : record.start_sample,
                    end_sample : record.end_sample,
                    word : record.word,
                    // phonemes : [record.phoneme],  // accumulate the phonemes in a list,
                    isFiller : FILLER_REGEX.test(record.word),
                    hasError: phoneme_error,
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

var MisproTransformer = function () {
    var parseOptions = {
        delimiter: ' ',
        auto_parse: true,
        columns: ['start_sample', 'end_sample', 'expected_phoneme', 'recognized_phoneme', 'phoneme_score', 'word', 'word_boundary'],
    };
    var parser = parse(parseOptions);

    var transformer = transform(gen_mispro_transform_function());

    var combinedStream = combine(parser, transformer);

    return combinedStream;

};

module.exports = MisproTransformer;