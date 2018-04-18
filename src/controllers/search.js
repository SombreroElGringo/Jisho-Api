const fetchJishoData = require('../services/fetchJishoData');

/** 
 *  API
 * @function searchKanji
 * @name /api/v1/search/kanji/:kanji
 * @method GET
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function 
 * @returns {Object} All the data about the meanig of the world in japanese
 */

exports.searchKanji = async (req, res, next) => {
    const kanji = req.params.kanji;

    let data = await fetchJishoData.getKanjiData(kanji);

    res.json(data);
};