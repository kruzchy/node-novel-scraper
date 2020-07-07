const cheerio = require('cheerio');
const axios = require('axios')
const rax = require('retry-axios');
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');
const Bottleneck = require('bottleneck')
const cliProgress = require('cli-progress');
const interceptorId = rax.attach();
const limiter = new Bottleneck({
    minTime: 4000,
    maxConcurrent: 4
});
const UserAgent = require('user-agents')
const userAgent = new UserAgent();
const axiosConfig = {
    headers:{
        'User-Agent':userAgent.toString()
    }
}
const bar1 = new cliProgress.SingleBar({
    format: 'Downloading {bar} {value}/{total} Chapters'
}, cliProgress.Presets.shades_classic);
module.exports = class LightNovelWorldScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.chaptersUrlList = null;
        this.bar = null;
        this.baseUrl = 'https://www.lightnovelworld.com'
    }
    async init() {
        const res = await axios.get(this.novelUrl, axiosConfig).catch(e=>console.error(e));
        this.$ = cheerio.load(res.data);
        this.novelName = sanitize(this.$('h1').text().trim());
        this.novelPath = `${this.rootDirectory}/${this.novelName}`
        try {
            fs.accessSync(this.novelPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(this.novelPath)
        }
        await this.getChaptersList()
    }
    async fetchChapters() {
        await limiter.schedule(()=>{
            console.log('>>>Fetching chapters')
            const fetchChapterPromises = this.chaptersUrlList.map(chapterUrl=>this.fetchSingleChapter(chapterUrl))
            // this.bar = new ProgressBar('>>>Downloading [:bar] | :current/:total Chapters', {total: fetchChapterPromises.length, width:20})
            bar1.start(fetchChapterPromises.length, 0)
            return Promise.allSettled(fetchChapterPromises)
        });
        bar1.stop()

    }

    processHtml() {
        this.$('.trinity-player-iframe-wrapper, small, center').remove()
    }

    getText(textElement) {
        return htmlToText.fromString(textElement.toString(), {
            wordwrap: 130
        });
    }

    checkIfExit(text) {
    }

    getTitle(text) {
        return sanitize(text.match(/chapter [\d.]+/i)[0].replace(/[:.]/, ' -'))
    }


    async getChaptersList() {
        const chaptersList = [];

        //.chapter-list li a
        const lastPageRelativeUrl = this.$('.PagedList-skipToLast').length ?
             this.$('.PagedList-skipToLast a').attr('href') :
            this.$('.pagination li:nth-last-child(2) a').attr('href');
        const lastPageUrl = this.baseUrl + lastPageRelativeUrl

        const lastPageNumber = lastPageUrl.split('/').pop()
        const getPageUrl = (pageNumber)=>{
            let tmp = lastPageRelativeUrl.split('/')
            tmp.pop()
            return this.baseUrl + tmp.join('/') + `/${pageNumber}`
        };
        for (let pageNum=1; pageNum <= lastPageNumber; pageNum++) {
            const url = getPageUrl(pageNum)
            const res = await axios.get(url, axiosConfig).catch(e=>console.error(e));
            const $ = cheerio.load(res.data);
            $('.chapter-list li a').toArray().forEach(item => chaptersList.push(this.baseUrl + $(item).attr('href')))
        }
        this.chaptersUrlList = chaptersList;
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl, axiosConfig).catch(e=>console.error(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);

        this.processHtml()

        const novelTextElement = this.$('.desc');
        const text = this.getText(novelTextElement);

        const title = this.getTitle(text);

        const chapterPath = `${this.novelPath}/${title}`
        const chapterFilePath = `${this.novelPath}/${title}/${title}.txt`


        try {
            fs.accessSync(chapterPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(chapterPath)
        }

        fs.writeFileSync(chapterFilePath, text)
        bar1.increment()
        // this.bar.tick();
        // console.log(`>>>Created file "${title}.txt"`)

    }

}
