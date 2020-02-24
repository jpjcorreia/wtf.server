var gettext = require('gettext')
  , defaultLocale="en"
  , cookiename="wtf-lang";

var errorLog = function(err){
    if(err!==undefined)
        console.log(err);
};

gettext.init = function (request, response, next) {
    //gettext.loadLanguageFile('./modules/locales/pt_PT.mo', 'pt_PT', errorLog);
    gettext.loadLanguageFile('./modules/locales/pt_PT.po', 'pt', errorLog);
    
    if (typeof request === 'object') {
        gettext.guessLanguage(request);
    }
};

// From https://github.com/mashpie/i18n-node
gettext.guessLanguage = function(request) {
    
    if (typeof request === 'object') {
        var language_header = request.headers['accept-language'],
            languages = [],
            regions = [];

        request.languages = [defaultLocale];
        request.regions = [defaultLocale];
        request.language = defaultLocale;
        request.region = defaultLocale;

        if (language_header) {
            language_header.split(',').forEach(function(l) {
                var header = l.split(';', 1)[0];
                var lr = header.split('-', 2);
                if (lr[0]) {
                    languages.push(lr[0].toLowerCase());
                }
                if (lr[1]) {
                    regions.push(lr[1].toLowerCase());
                }
            });

            if (languages.length > 0) {
                request.languages = languages;
                request.language = languages[0];
            }

            if (regions.length > 0) {
                request.regions = regions;
                request.region = regions[0];
            }
        }

        // setting the language by cookie
        if (cookiename && request.cookies && request.cookies[cookiename]) {
            request.language = request.cookies[cookiename];
        }
        gettext.setlocale('LC_ALL', request.language);
    }
};

gettext.__ = function(string){
    gettext.gettext(string);
};
module.exports = gettext;

//, "gettext": ">=0.0.1"