const axios = require('axios');
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const { prompt } = require('enquirer');
const fs = require('fs');

const wordExcerptScraper = require('./scrapers/wordexcerpt')
const novelTrenchScraper = require('./scrapers/noveltrench')
const wuxiaWorldComScraper = require('./scrapers/wuxiaworld.com')
const novelFullScraper = require('./scrapers/novelfull')
const wuxiaWorldSiteScraper = require('./scrapers/wuxiaworld.site')
const readLightNovelOrgScraper = require('./scrapers/readlightnovel.org')

try {
    fs.accessSync('./data', fs.constants.F_OK)
} catch (e) {
    fs.mkdirSync('./data')
}

class App {
    constructor(novelUrl) {
        this.scraper = null;
        this.novelUrl = novelUrl;
        this.scrapers = {
            wordexcerpt: wordExcerptScraper,
            noveltrench: novelTrenchScraper,
            'wuxiaworld.com': wuxiaWorldComScraper,
            'wuxiaworld.site': wuxiaWorldSiteScraper,
            'readlightnovel.org': readLightNovelOrgScraper,
            novelfull: novelFullScraper
        }
        this.initScraper()
    }

    initScraper() {
        for (let scraperKey of Object.keys(this.scrapers)) {
            if (this.novelUrl.includes(scraperKey)) {
                this.scraper = new this.scrapers[scraperKey](this.novelUrl)
                break
            }
        }
    }

}



const start = async () => {
    const response = await prompt({
        type: 'input',
        name: 'novelUrl',
        message: 'Enter Novel URL'
    });
    const app = new App(response.novelUrl)
    await app.scraper.init();
    await app.scraper.fetchChapters();
};
start();
