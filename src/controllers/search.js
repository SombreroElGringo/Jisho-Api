const fetchJishoData = require('../services/fetchJishoData');

/** 
 *  API
 * @function searchKanji
 * @name /api/v1/search/kanji/:kanji
 * @method GET
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function 
 * @returns {Object} All the data about the meanig of the kanji
 */

exports.searchKanji = async (req, res, next) => {
    const kanji = req.params.kanji;

    let data = await fetchJishoData.getKanjiData(kanji);

    res.status(200).json(data);
};


/** 
 *  API
 * @function searchWords
 * @name /api/v1/search/words/:word
 * @method GET
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function 
 * @returns {Object} Word meaning
 */

exports.searchWords = async (req, res, next) => {
    const word = req.params.word;

    let data = await fetchJishoData.getWordsData(word);

    res.status(200).json(data);
};


/** 
 *  API
 * @function searchSentences
 * @name /api/v1/search/sentences/:word
 * @method GET
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function 
 * @returns {Object} Sentences with the word in parameter
 */

exports.searchSentences = async (req, res, next) => {
    const word = req.params.word;

    let data = await fetchJishoData.getSentencesData(word);

    res.status(200).json(data);
};