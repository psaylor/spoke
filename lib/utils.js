'use strict';

var fs = require('fs');
var Promise = require('promise');
var xml2js = require('xml2js');

var utils = {};

utils.readFile = Promise.denodeify(fs.readFile);

var xmlParserOptions = {
    trim: true,  // trim leading and trailing whitespace in xml nodes
    explicitArray: false,  // don't put single elements in an array
};
var xmlParser = new xml2js.Parser(xmlParserOptions);
/* Returns a promise that will be fulfilled with the parsed xml data */
utils.parseXML = function(xmlString) {
    var parsePromise = new Promise(function(fulfill, reject) {
        xmlParser.parseString(xmlString, function(err, data) {
            if (err) {
                reject(err);
            } else {
                fulfill(data);
            }
        });
    });
    return parsePromise;
};

/* Returns a promise that will be fulfilled with the parsed xml data */
utils.parseXMLFile = function(xmlFile) {
    return utils.readFile(xmlFile).then(utils.parseXML);
};

utils.normalizeString = function (string){
    var punctuationRegex = /[.,!?""''-;:]/g;
    var normalized = string.replace(punctuationRegex, '');
    normalized = normalized.toLowerCase();
    return normalized;
};

module.exports = utils;
