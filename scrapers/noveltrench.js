const {novelTrenchConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class novelTrenchScraper extends Scraper{
    scraperName = novelTrenchConstant
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h1';
        this.chapterTextSelector = '.text-left';
        this.chapterTitleSelector = '.breadcrumb .active';
    }

    async getChapterLinks() {
        return  this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'));
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    getTitle() {
        let tempTitle = this.$(this.$(this.chapterTitleSelector).toArray()[0]).text().trim()
        return this.processChapterTitle(tempTitle)
    }

    processChapterTitle(tempTitle) {
        return sanitize(
            tempTitle
                .replace(/[:]/, ' -')
                .replace(/^\w/, (c) => c.toUpperCase())
                .trim()
        )
    }

    processChapterText(text) {
        return text
            .trim()
    }
}
