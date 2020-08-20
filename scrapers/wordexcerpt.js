const cheerio = require('cheerio');
const axios = require('axios')
const {wordExcerptConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class WordexcerptScraper extends Scraper{
    scraperName = wordExcerptConstant
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h1';
        this.chapterTextSelector = '.text-left';
        this.chapterTitleSelector = '.breadcrumb .active';
    }

    async getChapterLinks() {
        return  this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'));
    }

    async getProcessedChaptersList(initialChaptersList) {
        const res = await axios.get(initialChaptersList[0], this.getNewAxiosConfig());
        const $ = cheerio.load(res.data);
        if ($('.breadcrumb .active').text().trim().match(/an announcement/i)) {
            console.log('>>>Last chapter is an announcement. So ignoring.')
            initialChaptersList.shift()
        }
        return initialChaptersList;
    }

    processCheerioDOMTree() {
        this.$('center').remove()
        this.$('img').remove()
    }

    processChapterTitle(tempTitle) {
        return sanitize(tempTitle.replace(/[:.]/, ' -').trim())
    }

    processChapterText(text) {
        return text
            .replace(/.*wait to read ahead\?(.*|\s|\n)+$/i, '')
            .trim()
    }
}
