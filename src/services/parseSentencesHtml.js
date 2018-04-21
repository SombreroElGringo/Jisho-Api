'use strict';

const htmlparser = require('htmlparser');

const JISHO_SCRAPE_BASE_URI = process.env.JISHO_SCRAPE_BASE_URI;

const KANJI_REGEX = /[\u4e00-\u9faf\u3400-\u4dbf]/g;

const uriForSentencesSearch = (kanji) => JISHO_SCRAPE_BASE_URI + encodeURIComponent(kanji) + '%23sentences';


exports.parseSentencesHTMLContent = (html, phrase) => {
    let results = [];
    const exampleSectionStartString = '<ul class=\"japanese_sentence japanese japanese_gothic clearfix\" lang=\"ja\">';
    const exampleSectionEndString = '<span class=\"inline_copyright\">';
    let exampleSectionStartIndex = 0;

    while (true) {
        // +1 to move to the next instance of sectionStartString. Otherwise we'd infinite loop finding the same one over and over.
        exampleSectionStartIndex = html.indexOf(exampleSectionStartString, exampleSectionStartIndex) + 1;
        let exampleSectionEndIndex = html.indexOf(exampleSectionEndString, exampleSectionStartIndex);
        if (exampleSectionStartIndex !== 0 && exampleSectionEndIndex !== -1) {
            let exampleSection = html.substring(exampleSectionStartIndex, exampleSectionEndIndex + exampleSectionEndString.length);
            results.push(parseExampleSection(exampleSection));
        } else {
            break;
        }
    }
    
    return {
        query: phrase,
        found: results.length > 0,
        results: results,
        uri: uriForSentencesSearch(phrase),
        phrase: phrase,
    };
}

  
const parseKanjiLine = (japaneseSectionDom) => {
    let result = [];
    for (let i = 0; i < japaneseSectionDom.length - 1; ++i) {
        let kanjiFuriganaPair = japaneseSectionDom[i].children;
        if (kanjiFuriganaPair) {
            result.push(kanjiFuriganaPair[kanjiFuriganaPair.length - 1].children[0].raw);
        } else {
            let kanji = japaneseSectionDom[i].raw.replace(/\\n/g, '').trim();
            if (!kanji) {
                result.push(undefined);
            } else {
                result.push(kanji);
            }
        }
    }
    return result;
}
  
const parseKanaLine = (japaneseSectionDom, parsedKanjiLine) => {
    let result = [];
    for (let i = 0; i < japaneseSectionDom.length - 1; ++i) {
        let kanjiFuriganaPair = japaneseSectionDom[i].children;
        if (kanjiFuriganaPair && kanjiFuriganaPair[0].children) {
            let kana = kanjiFuriganaPair[0].children[0].raw;
            let kanji = parsedKanjiLine[i];
            let kanjiRegexMatches = kanji.match(KANJI_REGEX);
            if (kanji.startsWith(kana)) {
                result.push(kanji);
            } else if (kanjiRegexMatches) {
                let lastMatch = kanjiRegexMatches[kanjiRegexMatches.length - 1];
                let lastMatchIndex = kanji.lastIndexOf(lastMatch);
                let nonFuriPart = kanji.substring(lastMatchIndex + 1);
                result.push(kana + nonFuriPart);
            } else {
                result.push(kanji);
            }
        } else if (parsedKanjiLine[i]) {
            result.push(parsedKanjiLine[i]);
        }
    }  
    return result;
}
  
const getExampleEnglish = (exampleSectionHtml) => {
    const englishSectionStartString = '<span class=\"english\">';
    const englishSectionEndString = '</span';
    let englishSectionStartIndex = exampleSectionHtml.indexOf(englishSectionStartString);
    let englishSectionEndIndex = exampleSectionHtml.indexOf(englishSectionEndString, englishSectionStartIndex);
    return exampleSectionHtml.substring(englishSectionStartIndex + englishSectionStartString.length, englishSectionEndIndex);
}
  
const addKanjiAndKana = (exampleSectionHtml, intermediaryResult) => {
    const japaneseSectionStartString = '<ul class=\"japanese_sentence japanese japanese_gothic clearfix\" lang=\"ja\">';
    const japaneseSectionEndString = '</ul>';
    let japaneseSectionStartIndex = exampleSectionHtml.indexOf(japaneseSectionStartString) + japaneseSectionStartString.length;
    let japaneseSectionEndIndex = exampleSectionHtml.indexOf(japaneseSectionEndString);
    let japaneseSectionText = exampleSectionHtml.substring(japaneseSectionStartIndex, japaneseSectionEndIndex);
    let parseHandler = new htmlparser.DefaultHandler(function(error, dom) {});
    let parser = new htmlparser.Parser(parseHandler);
    parser.parseComplete(japaneseSectionText);
    let japaneseDom = parseHandler.dom;
  
    let parsedKanjiLine = parseKanjiLine(japaneseDom);
    intermediaryResult.kanji = parsedKanjiLine.join('');
    intermediaryResult.kana = parseKanaLine(japaneseDom, parsedKanjiLine).join('');
    return intermediaryResult;
}
  
const parseExampleSection = (exampleSectionHtml) => {
    let result = {};
    result.english = getExampleEnglish(exampleSectionHtml);
    return addKanjiAndKana(exampleSectionHtml, result);
}
  
  
  
   