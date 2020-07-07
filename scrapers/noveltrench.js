const cheerio = require('cheerio');
const axios = require('axios')
const rax = require('retry-axios');
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');
const Bottleneck = require('bottleneck')
const interceptorId = rax.attach();
const limiter = new Bottleneck({
    minTime: 333,
    maxConcurrent: 8
});

module.exports = class novelTrenchScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.chaptersUrlList = null;
    }
    async init() {
        const res = await axios.get(this.novelUrl);
        this.$ = cheerio.load(res.data);
        this.novelName = sanitize(this.$('h1').text().trim());
        this.novelPath = `${this.rootDirectory}/${this.novelName}`
        try {
            fs.accessSync(this.novelPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(this.novelPath)
        }
        this.chaptersUrlList = this.getChaptersList()
    }
    async fetchChapters() {
        await limiter.schedule(()=>{
            const fetchChapterPromises = this.chaptersUrlList.map(chapterUrl=>this.fetchSingleChapter(chapterUrl))
            return Promise.allSettled(fetchChapterPromises)
        });
    }

    processHtml() {
    }

    getText(textElement) {
        return htmlToText.fromString(textElement.toString(), {
            wordwrap: 130
        });
    }

    checkIfExit(text) {
    }

    getTitle(text) {
        return sanitize(this.$('#chapter-heading').text().match(/chapter .*/i)[0])
    }

    getChaptersList() {
        return this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'))
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl);
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);



        const novelTextElement = this.$('.text-left')
        const text = this.getText(novelTextElement)
        const title = this.getTitle(text)

        const chapterPath = `${this.novelPath}/${title}`
        const chapterFilePath = `${this.novelPath}/${title}/${title}.txt`


        try {
            fs.accessSync(chapterPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(chapterPath)
        }
        fs.writeFileSync(chapterFilePath, text)
        console.log(`>>>Created file "${title}.txt"`)


    }

}
