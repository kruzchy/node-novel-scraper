const cheerio = require('cheerio');
const axios = require('axios')
const {boxNovelComConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class BoxNovelScraper extends Scraper{
    scraperName = boxNovelComConstant
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h3';
        this.chapterTextSelector = '.text-left';
        this.chapterTitleSelector = '.text-left h3';
    }

    getNovelName() {
        return this.$(this.novelNameSelector).children().remove().end().text().trim()
    }

    async getChapterLinks() {
        return  this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'));
    }

    processChapterTitle(tempTitle) {
        return sanitize(tempTitle.replace(/[:.]/, ' -').trim())
    }

    processChapterText(text) {
        return text
            .trim()
    }
}

