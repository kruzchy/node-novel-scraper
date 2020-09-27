const axios = require('axios');
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const { prompt } = require('enquirer');
const fs = require('fs');
const url = require('url');
const scraperConstants = require('./scrapers/utils/scraperConstants');
const wordExcerptScraper = require('./scrapers/wordexcerpt')
const novelTrenchScraper = require('./scrapers/noveltrench')
const novelFullScraper = require('./scrapers/novelfull')
const novelOnlineFullScraper = require('./scrapers/novelonlinefull')
const readNovelFullScraper = require('./scrapers/readnovelfull')
const readLightNovelOrgScraper = require('./scrapers/readlightnovel.org')
const webNovelOnlineScraper = require('./scrapers/webnovelonline')
const boxNovelScraper = require('./scrapers/boxnovel')
const woopReadScraper = require('./scrapers/woopread')


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
            [scraperConstants.wordExcerptConstant]: wordExcerptScraper,
            [scraperConstants.novelTrenchConstant]: novelTrenchScraper,
            [scraperConstants.readLightNovelOrgConstant]: readLightNovelOrgScraper,
            [scraperConstants.webNovelOnlineConstant]: webNovelOnlineScraper,
            [scraperConstants.novelFullConstant]: novelFullScraper,
            [scraperConstants.novelOnlineFullConstant]: novelOnlineFullScraper,
            [scraperConstants.readNovelFullConstant]: readNovelFullScraper,
            [scraperConstants.boxNovelComConstant]: boxNovelScraper,
            [scraperConstants.woopReadComConstant]: woopReadScraper,
        }
        this.scraper = this.initScraper()
    }

    initScraper() {
        for (let scraperKey of Object.keys(this.scrapers)) {
            if (url.parse(this.novelUrl).hostname.replace(/www\./i, '') === scraperKey) {
                return  new this.scrapers[scraperKey](this.novelUrl)
            }
        }
        console.log('>>>This domain is currently not supported. Please use a valid domain.')
        process.exit()
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
    const timeStart = new Date();
    await app.scraper.fetchChapters();
    const timeEnd = new Date();
    console.log('>>>Download complete!');
    const execMins = Math.trunc((timeEnd-timeStart)/60000);
    const execSecs = Math.round(((timeEnd-timeStart) - execMins*60000)/1000);
    console.log(`>>>Time elapsed: ${execMins}m${execSecs}s`)
};
start();

