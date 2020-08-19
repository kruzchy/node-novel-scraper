const cheerio = require('cheerio');
const axios = require('axios')
const {wordExcerptConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class WordexcerptScraper extends Scraper{
    scraperName = wordExcerptConstant
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h3.title';
        this.chapterTextSelector = '#chapter-content';
        this.chapterTitleSelector = '.chapter-text';
    }

    async getChapterLinks() {
        const chaptersList = [];
        const lastPageNumber = this.$('.last a').attr('href').split('?page=')[1].split('&')[0]
        const getPageUrl = (pageNumber)=>{
            return this.baseUrl + this.$('.last a').attr('href').split('?')[0] + `?page=${pageNumber}&per-page=50`
        };
        for (let pageNum=1; pageNum <= lastPageNumber; pageNum++) {
            const url = getPageUrl(pageNum)
            const res = await axios.get(url, this.getNewAxiosConfig());
            const $ = cheerio.load(res.data);
            $('.list-chapter li a').toArray().forEach(item => chaptersList.push(this.baseUrl + $(item).attr('href')))
        }
        return chaptersList;
    }


    async getProcessedChaptersList(initialChaptersList) {
        return initialChaptersList;
    }

    async getChaptersList() {
        console.log('>>>Fetching Chapters')
        let initialChaptersList = await this.getChapterLinks()
        return await this.getProcessedChaptersList(initialChaptersList)
    }

    processCheerioDOMTree() {
    }

    processChapterTitle(tempTitle) {
        this.titleRegex = new RegExp(`.*${tempTitle}.*`, 'i')
        return sanitize(tempTitle.replace(/[:.]/, ' -').trim())
    }

    processChapterText(text) {
        return text
            .replace(/.*wait to read ahead\?(.*|\s|\n)+$/i, '')
            .trim()
    }
}
