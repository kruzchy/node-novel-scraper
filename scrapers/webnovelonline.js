const cheerio = require('cheerio');
const axios = require('axios')
const {webNovelOnlineConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class WebNovelOnlineScraper extends Scraper{
    scraperName = webNovelOnlineConstant;
    baseUrl = 'https://webnovelonline.com';
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h1';
        this.chapterTextSelector = '.chapter-content';
        this.chapterTitleSelector = '.chapter-info h3';
    }

    getChapterLinks() {
        return this.$('div[role=\'listitem\'] a').toArray().map(item => this.baseUrl + this.$(item).attr('href'));
    }

    async getProcessedChaptersList(initialChaptersList) {
        return initialChaptersList;
    }


    processChapterTitle(tempTitle) {
        return sanitize(
            tempTitle
                .replace(/\b([\d.]*) (chapter \1)/i, '$2')
                .replace(/[:]/, ' -')
                .trim())

    }

    getText(textElement, data) {
        let temp =  JSON.parse(data.match(/<script>.*initial_data.*<\/script>/i)[0].split(/initial_data_\s*=/i)[1].replace(/;<\/script>/i, '').trim()).filter(item=>item)[1].chapter.trim()
        if (temp.match(/<p>/gi)) {
            temp = htmlToText.fromString(temp, {
                wordwrap: null,
                uppercaseHeadings: false
            })
        }
        return temp;
    }

    processChapterText(text) {
        return text
            .trim()
    }
}
