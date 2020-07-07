const axios = require('axios');
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const { prompt } = require('enquirer');
const fs = require('fs');
const sanitize = require("sanitize-filename");

// // const url = 'https://wordexcerpt.com/series/i-dont-want-to-be-loved/';
// const url = 'https://noveltrench.com/manga/the-favored-son-of-heaven/';
// let nextChapterExists = true;
// let chapterUrl;
// let continued = false;
const wordExcerptScraper = require('./scrapers/wordexcerpt')
const novelTrenchScraper = require('./scrapers/noveltrench')
const wuxiaWorldScraper = require('./scrapers/wuxiaworld')
const novelFullScraper = require('./scrapers/novelfull')
try {
    fs.accessSync('./data', fs.constants.F_OK)
} catch (e) {
    fs.mkdirSync('./data')
}

class App {
    constructor(novelUrl) {
        this.scraper = null;
        this.novelUrl = novelUrl;
        this.novelName = null;
        this.firstChapterUrl = null;
        this.scrapers = {
            wordexcerpt: wordExcerptScraper,
            noveltrench: novelTrenchScraper,
            wuxiaworld: wuxiaWorldScraper,
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
