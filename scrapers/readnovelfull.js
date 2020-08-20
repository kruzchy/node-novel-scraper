const cheerio = require('cheerio');
const axios = require('axios')
const {readNovelFullConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class ReadNovelFullScraper extends Scraper{
    scraperName = readNovelFullConstant;
    baseUrl = 'https://readnovelfull.com'
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h3.title';
        this.chapterTextSelector = '#chr-content';
        this.chapterTitleSelector = '.chr-text';
    }

    async getChapterLinks() {
        const novelId = this.$('div#rating').attr('data-novel-id')
        const res = await axios.get(`https://readnovelfull.com/ajax/chapter-archive?novelId=${novelId}`, this.getNewAxiosConfig())
        const $ = cheerio.load(res.data);
        return $('.list-chapter li a').toArray().map(item => this.baseUrl + $(item).attr('href'))
    }


    async getProcessedChaptersList(initialChaptersList) {
        return initialChaptersList;
    }

    async getChaptersList() {
        console.log('>>>Fetching Chapters')
        let initialChaptersList = await this.getChapterLinks()
        return await this.getProcessedChaptersList(initialChaptersList)
    }

    processCheerioDOMTree() {
    }

    processChapterTitle(tempTitle) {
        return sanitize(
            tempTitle
                .replace(/[:]/, ' -')
                .replace(/(chapter.*)chapter.*\.\s/gi, `$1`)
                .trim()
        )
    }

    processChapterText(text) {
        return text
            .trim()
    }
}
