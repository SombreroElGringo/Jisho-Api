'use strict'

const request = require('request-promise');

const serviceKanji = require('./parseKanjiHtml');
const serviceSentences = require('./parseSentencesHtml');

const JISHO_API_URI = process.env.JISHO_API_URI;
const JISHO_SCRAPE_BASE_URI = process.env.JISHO_SCRAPE_BASE_URI;
const JISHO_STROKE_ORDER_DIAGRAM_BASE_URI = process.env.JISHO_STROKE_ORDER_DIAGRAM_BASE_URI;

const ONYOMI = 'On';
const KUNYOMI = 'Kun';

const uriForKanjiSearch = (kanji) => JISHO_SCRAPE_BASE_URI + encodeURIComponent(kanji) + '%23kanji';

const uriForSentencesSearch = (kanji) => JISHO_SCRAPE_BASE_URI + encodeURIComponent(kanji) + '%23sentences';

const uriForWordsSearch = (word) => JISHO_API_URI + '?keyword=' + encodeURIComponent(word);

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
            const result = serviceKanji.parseKanjiHTMLContent(htmlContent, kanji);
            resolve(result);
        })
    });
}

exports.getWordsData = (word) => {
    return new Promise( (resolve, reject) => {

        const uri = uriForWordsSearch(word);
    
        request({
            uri: uri,
            json: true,
        })
        .then(json => {
            const result = json;
            resolve(result);
        })
    });
}

exports.getSentencesData = (kanji) => {
    return new Promise( (resolve, reject) => {

        const uri = uriForSentencesSearch(kanji);
        const timeout = 10000; 
        
        request({
            uri: uri,
            json: false,
            timeout: timeout,
        })
        .then(htmlContent => {
            const result = serviceSentences.parseSentencesHTMLContent(htmlContent, kanji);
            resolve(result);
        })
    });
}