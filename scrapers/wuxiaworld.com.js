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

module.exports = class WuxiaWorldComScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.firstChapterUrl = null;
        this.currentChapterUrl = null;
        this.nextChapterExists = true;
        this.chaptersUrlList = null;
    }
    async init() {
        const res = await axios.get(this.novelUrl);
        this.$ = cheerio.load(res.data);
        this.novelName = sanitize(this.$('h2').text().trim());
        this.novelPath = `${this.rootDirectory}/${this.novelName}`
        try {
            fs.accessSync(this.novelPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(this.novelPath)
        }
        this.currentChapterUrl = this.firstChapterUrl;
        this.chaptersUrlList = this.getChaptersList()
    }
    async fetchChapters() {
        await limiter.schedule(()=>{
            const fetchChapterPromises = this.chaptersUrlList.map(chapterUrl=>this.fetchSingleChapter(chapterUrl))
            return Promise.allSettled(fetchChapterPromises)
        });
        // while (this.nextChapterExists) {
        //     await this.fetchSingleChapter();
        // }
    }

    processHtml() {
        this.$('center').remove()
        this.$('img').remove()
    }

    getText(textElement) {
        return htmlToText.fromString(textElement.toString(), {
            wordwrap: 130
        });
    }

    checkIfExit(text) {
        if (!text.match(/chapter [\d.]+\s*:.*/i)) process.exit()
    }

    getTitle(text) {
        return sanitize(text.match(/chapter [\d.]+\s*:.*/i)[0].replace(':', ' -'))
    }

    getChaptersList() {
        return this.$('.wp-manga-chapter a').toArray().map(item => this.$(item).attr('href'))
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl);
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);

        this.processHtml()

        const novelTextElement = this.$('.text-left');
        const text = this.getText(novelTextElement);
        this.checkIfExit(text)
        const title = this.getTitle(text);

        const chapterPath = `${this.novelPath}/${title}`
        const chapterFilePath = `${this.novelPath}/${title}/${title}.txt`


        try {
            fs.accessSync(chapterPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(chapterPath)
        }

        fs.writeFileSync(chapterFilePath, text)
        console.log(`>>>Created file "${title}.txt"`)

        // //Check if there is a next chapter
        // if (!this.$('.nav-next').length) {
        //     this.nextChapterExists = false
        // } else {
        //     this.currentChapterUrl = this.$('.nav-next a').attr('href')
        // }
    }

}
