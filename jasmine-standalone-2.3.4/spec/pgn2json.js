describe('pgn2json', function () {
    it('should not be null', function () {
        expect(pgn2json).not.toBe(null);
    });
});

describe('#tagValueRegExpFactory', function () {
    it('should return a regexp', function () {
        var result = pgn2json._private.tagValueRegExpFactory('event');
        expect(result).not.toBe(null);
        expect(result instanceof RegExp).toBe(true);
    });

    it('should create a regular expression to match a tag', function () {
        var reEvent = pgn2json._private.tagValueRegExpFactory('event');
        var reResult = pgn2json._private.tagValueRegExpFactory('result');
        var reWhite = pgn2json._private.tagValueRegExpFactory('Kasparov');
        var goodLine = '[Event "A Very Good Event"][Result "*"]';
        expect(reEvent.test(goodLine)).toBe(true);
        expect(reResult.test(goodLine)).toBe(true);
        expect(reWhite.test(goodLine)).toBe(false);
    });
});

describe('#getTagPair', function () {
    it('should return meta data if it exists', function () {
        var eventLine = '[Event "F/S Return Match"][RedHerring "*"]';
        var eventResult = pgn2json._private.getTagPair('event', eventLine);
        var hasHerring = /herring/i.test(eventResult);
        expect(eventResult).not.toBe(null);
        expect(eventResult.event).toBe('F/S Return Match');
        expect(hasHerring).toBe(false);

        var resultLine = '[Result "1/2-1/2"]';
        var resultResult = pgn2json._private.getTagPair('result', resultLine);
        expect(resultResult).not.toBe(null);
        expect(resultResult.result).toBe('1/2-1/2');
    });

    it('should return null if the data does not exist', function () {
        var eventLine = '[Event "F/S Return Match"]';
        var result = pgn2json._private.getTagPair('result', eventLine);
        expect(result).toBe(null);
    });
});

describe('#removePgnComments', function () {
    it('should remove only data in brackets', function () {
        var str = 'Nxf7 {Oh hell yeah}';
        var result = pgn2json._private.removePgnComments(str);
        expect(result).toBe('Nxf7 ');
    });
});

describe('#removeAnnotationSymbols', function () {
    it('should remove blunder annotations', function () {
        var str = 'Nxf7??';
        var result = pgn2json._private.removeAnnotationSymbols(str);
        expect(result).toBe('Nxf7');
    });

    it('should remove mistake annotations', function () {
        var str = 'Nxf7?';
        var result = pgn2json._private.removeAnnotationSymbols(str);
        expect(result).toBe('Nxf7');
    });

    it('should remove dubious move annotations', function () {
        var str = 'Nxf7?!';
        var result = pgn2json._private.removeAnnotationSymbols(str);
        expect(result).toBe('Nxf7');
    });

    it('should remove interesting move annotations', function () {
        var str = 'Nxf7!?';
        var result = pgn2json._private.removeAnnotationSymbols(str);
        expect(result).toBe('Nxf7');
    });

    it('should remove good move annotations', function () {
        var str = 'Nxf7!';
        var result = pgn2json._private.removeAnnotationSymbols(str);
        expect(result).toBe('Nxf7');
    });

    it('should remove brilliant move annotations', function () {
        var str = 'Nxf7!!';
        var result = pgn2json._private.removeAnnotationSymbols(str);
        expect(result).toBe('Nxf7');
    });
});

describe('#getMoveString', function () {
    it('should get the string of moves when white wins', function () {
        var str = '[Blah] 1.e4 c5 2. Nf3 g6   3.d4 cxd4 1-0';
        var result = pgn2json._private.getMoveString(str);
        expect(result).toBe('1.e4 c5 2. Nf3 g6   3.d4 cxd4 ');
    });

    it('should get the string of moves when black wins', function () {
        var str = '[Blah] 1.e4 c5 2. Nf3 g6   3.d4 cxd4 0-1';
        var result = pgn2json._private.getMoveString(str);
        expect(result).toBe('1.e4 c5 2. Nf3 g6   3.d4 cxd4 ');
    });

    it('should get the string of moves for a tie', function () {
        var str = '[Blah] 1.e4 c5 2. Nf3 g6   3.d4 cxd4 1/2-1/2';
        var result = pgn2json._private.getMoveString(str);
        expect(result).toBe('1.e4 c5 2. Nf3 g6   3.d4 cxd4 ');
    });

    it('should get the string of moves when the game is ongoing', function () {
        var str = '[Blah] 1.e4 c5 2. Nf3 g6   3.d4 cxd4';
        var result = pgn2json._private.getMoveString(str);
        expect(result).toBe('1.e4 c5 2. Nf3 g6   3.d4 cxd4');
    });
});

describe('#moveStringToArray', function () {
    it('should return null for an empty string', function () {
        expect(pgn2json._private.moveStringToArray('')).toBe(null);
    });

    it('should return an array of size 4 for 2 turns', function () {
        var moves = '1. Nf3 d5 2.c4 e6';
        expect(pgn2json._private.moveStringToArray(moves).length).toBe(4);
    });

    it('should preserve the move order', function () {
        var moves = '1. Nf3 d5 2.c4 e6';
        var moveArr = pgn2json._private.moveStringToArray(moves);

        expect(moveArr[0]).toBe('Nf3');
        expect(moveArr[1]).toBe('d5');
        expect(moveArr[2]).toBe('c4');
        expect(moveArr[3]).toBe('e6');
    });

    it('should handle an odd number of moves', function () {
        var moves = '1.Nf3 d5 2.c4 e6 3.g3 0-1';
        var moveArr = pgn2json._private.moveStringToArray(moves);
        expect(moveArr.length).toBe(5);
        expect(moveArr[0]).toBe('Nf3');
        expect(moveArr[1]).toBe('d5');
        expect(moveArr[2]).toBe('c4');
        expect(moveArr[3]).toBe('e6');
        expect(moveArr[4]).toBe('g3');
    });

    it('should handle valid SAN', function () {
        var string = 'Nbd7 Rae8 Nxe4 R7xe4';
        var arr = pgn2json._private.moveStringToArray(string);

        expect(arr[0]).toBe('Nbd7');
        expect(arr[1]).toBe('Rae8');
        expect(arr[2]).toBe('Nxe4');
        expect(arr[3]).toBe('R7xe4');
    });

    it('should handle promotions', function () {
        var string = 'axb1=Q+ Kf2';
        var arr = pgn2json._private.moveStringToArray(string);

        expect(arr.length).toBe(2);
        expect(arr[0]).toBe('axb1=Q+');
        expect(arr[1]).toBe('Kf2');
    });
    
    it('should handle checkmates', function () {
        var string = 'axb1=Q#';
        var arr = pgn2json._private.moveStringToArray(string);
        expect(arr.length).toBe(1);
        expect(arr[0]).toBe('axb1=Q#');
    });
});
