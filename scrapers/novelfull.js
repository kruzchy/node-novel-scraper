const cheerio = require('cheerio');
const axios = require('axios')
const {novelFullConstant} = require('./utils/scraperConstants')
const Scraper = require('./utils/scraper')
const sanitize = require("sanitize-filename");

module.exports = class NovelFullScraper extends Scraper{
    scraperName = novelFullConstant;
    baseUrl = 'https://novelfull.com'
    constructor(novelUrl) {
        super(novelUrl);
        this.novelNameSelector = 'h3.title';
        this.chapterTextSelector = '#chapter-content';
        this.chapterTitleSelector = '.chapter-text';
    }

    getNovelName() {
        return sanitize(this.$(this.$(this.novelNameSelector).toArray()[0]).text().trim());
    }

    async getChapterLinks() {
        const chaptersList = [];
        const lastPageNumber = this.$('.last a').attr('href').split('?page=')[1].split('&')[0]
        const getPageUrl = (pageNumber)=>{
            return this.baseUrl + this.$('.last a').attr('href').split('?')[0] + `?page=${pageNumber}&per-page=50`
        };
        for (let pageNum=1; pageNum <= lastPageNumber; pageNum++) {
            const url = getPageUrl(pageNum)
            const res = await axios.get(url, this.getNewAxiosConfig()).catch(e=>console.log(e));
            const $ = cheerio.load(res.data);
            $('.list-chapter li a').toArray().forEach(item => chaptersList.push(this.baseUrl + $(item).attr('href')))
        }
        return chaptersList;
    }

    async getProcessedChaptersList(initialChaptersList) {
        return initialChaptersList;
    }

    processChapterTitle(tempTitle) {
        return sanitize(
            tempTitle
                .replace(/[:]/, ' -')
                .replace(/\b(chapter [\d.]+).*\1/i, '$1')
                .trim()
        )
    }

    processChapterText(text) {
        return text
            .replace(/if you find any errors(.|\s)*/i, '')
            .trim()
    }
}
