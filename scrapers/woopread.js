const cheerio = require('cheerio');
const axios = require('axios')
const {woopReadComConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class WoopReadScraper extends Scraper{
    scraperName = woopReadComConstant
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h1';
        this.chapterTextSelector = '.text-left';
        this.chapterTitleSelector = '.breadcrumb .active';
    }

    async getChapterLinks() {
        return  this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'));
    }

    processCheerioDOMTree() {
        this.$('center').remove()
        this.$('img').remove()
    }

    processChapterTitle(tempTitle) {
        return sanitize(tempTitle.replace(/[:]/, ' -').trim())
    }

    processChapterText(text) {
        return text
            .replace(/.*wait to read ahead\?(.*|\s|\n)+$/i, '')
            .trim()
    }
}
