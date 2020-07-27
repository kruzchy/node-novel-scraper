const cheerio = require('cheerio');
const axios = require('axios')

const Scraper = require('./utils/scraper')

module.exports = class WordexcerptScraper extends Scraper{
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h1';
        this.chapterTextSelector = '.text-left';
        this.chapterTitleSelector = '.breadcrumb .active';
    }

    getChapterLinks() {
        return  this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'));
    }

    async getProcessedChaptersList(initalChaptersList) {
        const res = await axios.get(initalChaptersList[0], this.getNewAxiosConfig());
        const $ = cheerio.load(res.data);
        if ($('.breadcrumb .active').text().trim().match(/an announcement/i)) {
            console.log('>>>Last chapter is an announcement. So ignoring.')
            initalChaptersList.shift()
        }
        return initalChaptersList;
    }

    processCheerioDOMTree() {
        this.$('center').remove()
        this.$('img').remove()
    }

    processChapterTitle(tempTitle) {
        return tempTitle.replace(/[:.]/, ' -').trim()
    }

    processChapterText(text) {
        return text
            .replace(/.*wait to read ahead\?(.*|\s|\n)+$/i, '')
            .trim()
    }
}
