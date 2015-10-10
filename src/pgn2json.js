var pgn2json = (function (undefined) {
    'use strict';

    var KNOWN_TAGS = [
        'event',
        'site',
        'date',
        'round',
        'white',
        'black',
        'result'
    ];

    // Return value.
    var api = {

        // Keep "private" functions here
        // Out of the way, but still unit-testable.
        _private: {}
    };

    /**
     * Create regular expressions for extracting tag values from a PGN.
     *
     * @param {string} tagName - the name of the tag to extract.
     * @return {RegExp}
     */
    api._private.tagValueRegExpFactory = function metaDataRegExpFactory(tagName) {
        var regString = '(?:\\[' + tagName + '\\s\\")(.*?)\\"\\]';
        return new RegExp(regString, 'i');
    };

    /**
     * For a given line in a PGN, extract the tag.
     *
     * @param {string} tagName - tag property to extract
     * @param {string} line - the line in the PGN
     * @return {Object}
     */
    api._private.getTagPair = function getTagPair(tagName, line) {
        var re = api._private.tagValueRegExpFactory(tagName);
        var results = re.exec(line);
        var keyValue = {};

        if (!results || !results.length || results.length < 1) {
            return null;
        }

        keyValue[tagName] = results[1];
        return keyValue;
    };

    /**
     * Remove comments from moves.
     *
     * @param {string} moveString
     * @return {string}
     */
    api._private.removePgnComments = function removePgnComments(moveString) {
        var reComment = /{.*}/img;
        return moveString.replace(reComment, '');
    };

    /**
     * Remove common annotation symbols from moves.
     *
     * @param {string} pgnString
     * @return {string}
     */
    api._private.removeAnnotationSymbols = function removeAnnotationSymbols(moveString) {
        var reSymbols = /[!?]/mg;
        return moveString.replace(reSymbols, '');
    };

    /**
     * Get the move string from a PGN.
     *
     * @param {string} pgnString
     * @return {string}
     */
    api._private.getMoveString = function getMoveString(pgnString) {
        var reMovesToEnd = /1\.\s*([a-h][3-4]|N(f|c)3).*/;
        var reResult = /1\s*-\s*0|0\s*-\s*1|1\/2\s*-\s*1\/2/;
        var matches = pgnString.match(reMovesToEnd);

        if (!matches || !matches.length) {
            return null;
        }

        // This still contains the result from the end of the PGN.
        var movesAndFinal = matches[0];
        return movesAndFinal.replace(reResult, '');
    };

    /**
     * Convert a string of moves into an array.
     * `1. Nf3 d5 2.c4` results in the array ['Nf3', 'd5', 'c4']
     *
     * @param {string} moveString
     * @return {Array}
     */
    api._private.moveStringToArray = function moveStringToArray(moveString) {
        // TODO: include promotions
        var reMove = /[a-hRNBQK][1-8]?[a-h]?x?[a-h]?x?[1-8]/g;
        var moves = moveString.match(reMove);

        return moves;
    };

    api.parsePgn = function parsePgn(pgnString) {
        var jsonObject = {};
        var singleLine = pgnString.replace(/\n|\n\r|\r/gm, ' ');

        var moveString = [
            api._private.getMoveString,
            api._private.removePgnComments,
            api._private.removeAnnotationSymbols
        ].reduce(function (value, fn) {
            return fn(value);
        }, singleLine);

        KNOWN_TAGS.forEach(function (tagName) {
            var data = api._private.getTagPair(tagName, singleLine);
            var value = data ? data[tagName] : null;
            jsonObject[tagName] = value;
        });

        jsonObject.moves = api._private.moveStringToArray(moveString);

        return jsonObject;
    };

    return api;

}());
