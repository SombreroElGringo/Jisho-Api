'use strict'
const request = require('request-promise');
const htmlEntities = new (require('html-entities').XmlEntities)();
const htmlparser = require('htmlparser');

const JISHO_API = process.env.JISHO_API;
const JISHO_SCRAPE_BASE_URI = process.env.JISHO_SCRAPE_BASE_URI;
const JISHO_STROKE_ORDER_DIAGRAM_BASE_URI = process.env.JISHO_STROKE_ORDER_DIAGRAM_BASE_URI;

const ONYOMI = 'On';
const KUNYOMI = 'Kun';

const uriForKanjiSearch = (kanji) => JISHO_SCRAPE_BASE_URI + encodeURIComponent(kanji) + '%23kanji';

const uriForStrokeOrderDiagram = (kanji) => JISHO_STROKE_ORDER_DIAGRAM_BASE_URI + kanji.charCodeAt(0).toString() + '_frames.png';



exports.getKanjiData = (kanji) => {
    return new Promise( (resolve, reject) => {

        const uri = uriForKanjiSearch(kanji);
        const timeout = 10000; 
        
        request({
            uri: uri,
            json: false,
            timeout: timeout,
        })
        .then(htmlContent => {
            const result = parseKanjiHTMLContent(htmlContent, kanji);
            return resolve(result)
        })
    });
}


const parseKanjiHTMLContent = (html, kanji) => {
    let result = {
        query: kanji,
        found: containsKanjiGlyph(html, kanji),
    };

    if(!result.found) return result;

    result.gradeNumber = getIntBetweenStrings(html, 'taught in <strong>grade', '</strong>');
    result.level = getStringBetweenStrings(html, 'taught in <strong>', '</strong>');
    result.jlpt = getStringBetweenStrings(html, 'level <strong>', '</strong>');
    result.strokeCount = getIntBetweenStrings(html, '<strong>', '</strong> strokes');
    result.meaning = superTrim(getStringBetweenStrings(html, `<div class="kanji-details__main-meanings">`, '</div>'));
    result.kunyomi = getKunyomi(html);
    result.kunyomiExamples = getKunyomiExamples(html);
    result.onyomi = getOnyomi(html);
    result.onyomiExamples = getOnyomiExamples(html);
    result.radical = getRadical(html);
    result.parts = getParts(html);
    result.strokeOrderDiagramUri = uriForStrokeOrderDiagram(kanji);
    result.uri = uriForKanjiSearch(kanji);
     
    return result;
}

const getIntBetweenStrings = (html, start, end) => {
    const stringBetweenStrings = getStringBetweenStrings(html, start, end);
    if(stringBetweenStrings) {
        return parseInt(stringBetweenStrings);
    }
}

const getStringBetweenStrings = (html, start, end) => {
    const startStringLocation = html.indexOf(start, end);
    if(startStringLocation === -1) {
        return null;
    }
    const startIndex = startStringLocation + start.length;
    const endIndex = html.indexOf(end, startIndex);
    if(endIndex >= 0) {
        return getDataBetweenIndicies(html, startIndex, endIndex);
    }
}

const getDataBetweenIndicies = (html, startIndex, endIndex) => {
    const result = html.substring(startIndex, endIndex);
    return superTrim(result);
}

const getKunyomi = (html) => getYomi(html, KUNYOMI);

const getKunyomiExamples = (html) => getYomiExamples(html, KUNYOMI);

const getOnyomi = (html) => getYomi(html, ONYOMI);

const getOnyomiExamples = (html) => getYomiExamples(html, ONYOMI);

const getYomi = (html, yomiSymbol) => {
    const yomiSection = getStringBetweenStrings(html, `<dt>${yomiSymbol}:</dt>`, '</dl>');
    if(yomiSection) {
        const yomiString = getStringBetweenStrings(yomiSection, `<dd class="kanji-details__main-readings-list" lang="ja">`, '</dd>');
        if(yomiString) {
            const readings = parseAnchorsToArray(yomiString);
            return readings;
        }
    }
    return [];
}

const getYomiExamples = (html, yomiSymbol) => {
    let locatorString = `<h2>${yomiSymbol} reading compounds</h2>`;
    let exampleSectionStartIndex = html.indexOf(locatorString);
    let exampleSectionEndIndex = html.indexOf('</ul>', exampleSectionStartIndex);
    if (exampleSectionStartIndex === -1 || exampleSectionEndIndex === -1) {
        return [];
    }
  
    let exampleSection = html.substring(exampleSectionStartIndex, exampleSectionEndIndex);
    exampleSection = exampleSection.replace(locatorString, '');
    exampleSection = exampleSection.replace('<ul class=\"no-bullet\">', '');
    let examplesLines = exampleSection.split('\n');
  
    const lengthOfExampleInLines = 5;
    const exampleOffset = 1;
    const readingOffset = 2;
    const meaningOffset = 3;
  
    let examples = [];
    let exampleIndex = 0;
    examplesLines = examplesLines.map(line => superTrim(line));
  
    while (examplesLines[0] !== '<li>') {
        examplesLines.shift(1);
    }
    while (examplesLines[examplesLines.length - 1] !== '</li>') {
        examplesLines.pop();
    }
  
    for (let i = 0; i < examplesLines.length; i += lengthOfExampleInLines) {
        examples[exampleIndex] = {
            example: examplesLines[i + exampleOffset],
            reading: examplesLines[i + readingOffset].replace('【', '').replace('】', ''),
            meaning: htmlEntities.decode(examplesLines[i + meaningOffset]),
        };
        ++exampleIndex;
    }
  
    return examples;
}
  
const getRadical = (html) => {
    const radicalMeaningStartString = '<span class="radical_meaning">';
    const radicalMeaningEndString = '</span>';
    let radicalMeaning = getStringBetweenStrings(html, radicalMeaningStartString, radicalMeaningEndString);
  
    if (radicalMeaning) {
        let radicalMeaningStartIndex = html.indexOf(radicalMeaningStartString);
        let radicalMeaningEndIndex = html.indexOf(radicalMeaningEndString, radicalMeaningStartIndex);
        let radicalSymbolStartIndex = radicalMeaningEndIndex + radicalMeaningEndString.length;
        const radicalSymbolEndString = '</span>';
        let radicalSymbolEndIndex = html.indexOf(radicalSymbolEndString, radicalSymbolStartIndex);
        let radicalSymbol = getDataBetweenIndicies(html, radicalSymbolStartIndex, radicalSymbolEndIndex);
        let radicalForms;
        if (radicalSymbol.length > 1) {
            radicalForms = radicalSymbol.substring(1).replace('(', '').replace(')', '').trim().split(', ');
            radicalSymbol = radicalSymbol[0];
        }
        return {symbol: radicalSymbol, forms: radicalForms, meaning: radicalMeaning};
    }
}

const getParts = (html) => {
    let partsSection = getStringBetweenStrings (html, '<dt>Parts:</dt>', '</dl>');
    partsSection = partsSection.replace('<dd>', '').replace('</dd>');
    return parseAnchorsToArray(partsSection);
}


const parseAnchorsToArray = (str) => {
    let a = str;
    let results = [];

    while(a.indexOf('<') !== -1) {
        let result = getStringBetweenStrings(a, '>', '<');
        results.push(result);
        a = a.substring(a.indexOf('</a>') + '</a>'.length);
    }
    return results;
}

const containsKanjiGlyph = (html, kanji) => {
    let kanjiGlyphToken = `<h1 class="character" data-area-name="print" lang="ja">${kanji}</h1>`;
    return html.indexOf(kanjiGlyphToken) !== -1;
}

const superTrim = (str) => {
    if (!str) return null;

    str.replace(/(?:\r\n|\r|\n)/g, '');
    str = str.trim();
    return str;
}