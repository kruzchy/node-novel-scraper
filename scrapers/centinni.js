const cheerio = require('cheerio');
const axios = require('axios')
const {centinniConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class CentinniScraper extends Scraper{
    scraperName = centinniConstant
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

    getTitle() {
        let tempTitle = this.$(this.$(this.chapterTitleSelector).toArray()[0]).text().trim()
        return this.processChapterTitle(tempTitle)
    }

    processChapterTitle(tempTitle) {
        return sanitize(tempTitle.replace(/[:]/, ' -').trim())
    }

    processChapterText(text) {
        return text
            .replace(/Centinni is translating[\S+\n\r\s]+/i, '')
            .replace(/.*((centinni)|(paypal)|(discord)|(patreon)|(ko-?fi)).*/ig, '')
            .trim()
    }
}
