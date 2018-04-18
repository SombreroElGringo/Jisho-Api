const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const chalk = require('chalk');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Express config
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(bodyParser.json());

// App routes
module.exports = require('./src/routes.js')(app);

// Error 404 handler
app.use( (req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handler
app.use((err, req, res, next) => {

    let data = {
        message: err.message,
        status: err.status || 500
    };

    if(app.get('env') === 'development') {
       data.stack = err.stack;
    }

    res.status(data.status).json(data);
});


// Running server

app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
    console.log('---- Press CTRL-C to stop ----\n');
});