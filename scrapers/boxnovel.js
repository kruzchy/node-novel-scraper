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
        this.chapterTitleSelector = '.text-left>p:first-child, .text-left>h2, .text-left>h3, .text-left>h4' ;
        this.limitNum = 32;
    }

    getNovelName() {
        return this.$(this.novelNameSelector).children().remove().end().text().trim()
    }

    async getChapterLinks() {
        return  this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'));
    }

    // getTitle() {
    //     let tempTitle = this.$(this.chapterTitleSelector).text();
    //     return this.processChapterTitle(tempTitle)
    // }

    processChapterTitle(tempTitle) {
        return sanitize(
            tempTitle
                .replace(/[:]/, ' -')
                .replace(/^(?!Chapter)([\d.]+)(.*)/, 'Chapter $1 - $2')
                .trim()
        )
    }

    processChapterText(text) {
        return text
            .trim()
    }
}

