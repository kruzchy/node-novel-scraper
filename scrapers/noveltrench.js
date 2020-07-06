const cheerio = require('cheerio');
const axios = require('axios')
module.exports = class novelTrenchScraper {
    constructor(novelUrl) {
        this.novelUrl = novelUrl;
        this.$ = cheerio.load()
    }


}
