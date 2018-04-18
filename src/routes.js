const API_URI = process.env.API_URI;

// Controllers
const searchController = require('./controllers/search.js');

module.exports = (app) => {
    
    app.get(`${API_URI}`, (req, res, next) => {
         res.json({data: 'hello'});
    });

    app.get(`${API_URI}/search/kanji/:kanji`, searchController.searchKanji);

    return app;
}