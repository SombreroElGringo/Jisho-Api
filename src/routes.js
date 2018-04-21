const API_URI = process.env.API_URI;

// Controllers
const searchController = require('./controllers/search.js');

module.exports = (app) => {
    
    app.get(`${API_URI}`, (req, res, next) => {
         res.json({data: `Welcome to my Jisho's Api`});
    });

    app.get(`${API_URI}/search/kanji/:kanji`, searchController.searchKanji);

    app.get(`${API_URI}/search/words/:word`, searchController.searchWords);

    app.get(`${API_URI}/search/sentences/:word`, searchController.searchSentences);

    return app;
}