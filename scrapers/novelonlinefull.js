const {novelOnlineFullConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class NovelOnlineFullScraper extends Scraper{
    scraperName = novelOnlineFullConstant
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h1';
        this.chapterTextSelector = '#vung_doc';
        this.chapterTitleSelector = '.breadcrumb p';
    }

    async getChapterLinks() {
        return this.$('.chapter-list a').toArray().map(item => this.$(item).attr('href'))
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    getTitle() {
        let tempTitle = this.$(this.chapterTitleSelector).children().remove().end().text().trim()
        if (!tempTitle.match(/chapter\s*[\d.]+/i) && tempTitle.match(/^[\d.]+/i)) {
            tempTitle = `Chapter ${tempTitle}`
        }
        return this.processChapterTitle(tempTitle)
    }

    processChapterTitle(tempTitle) {
        if (!tempTitle.match(/chapter\s*[\d.]+/i) && tempTitle.match(/^[\d.]+/i)) {
            tempTitle = `Chapter ${tempTitle}`
        }
        return sanitize(tempTitle.trim())
    }

    processChapterText(text) {
        return text
            .replace(/\n\n\n/gi, '\n\n')
            .replace(/.*pa\s*treon.*/gi, '')
            .trim()
    }
}
