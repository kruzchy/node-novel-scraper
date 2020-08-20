const axios = require('axios')
const {readLightNovelOrgConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");
const UserAgent = require('user-agents')

module.exports = class ReadLightNovelOrgScraper extends Scraper{
    scraperName = readLightNovelOrgConstant
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h1';
        this.chapterTextSelector = '.desc';
        this.chapterTitleSelector = null;
        this.userAgent = new UserAgent();
    }

    getTitle() {
        const novelTextElement = this.$(this.chapterTextSelector);
        const text = this.getText(novelTextElement)
        let tempTitle = text.match(/chapter [\d.]+/i)[0]
        return this.processChapterTitle(tempTitle)
    }

    async getChapterLinks() {
        return  this.$('.chapter-chs li a').toArray().map(item => this.$(item).attr('href'))
    }

    async getProcessedChaptersList(initialChaptersList) {
        try {
            const res = await axios.get(initialChaptersList[0], this.getNewAxiosConfig(this.userAgent))
        } catch (e) {
            initialChaptersList.shift();
        }
        return initialChaptersList;
    }

    processCheerioDOMTree() {
        this.$('.trinity-player-iframe-wrapper, small, small+br, center, center+hr, hr+br,.desc div.hidden').remove()
    }

    processChapterTitle(tempTitle) {
        return sanitize(tempTitle.replace(/[:]/, ' -').trim())
    }

    processChapterText(text) {
        return text
            .trim()
    }
}
