const cheerio = require('cheerio');
const axios = require('axios')
const rax = require('retry-axios');
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');
const interceptorId = rax.attach();
module.exports = class novelTrenchScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.firstChapterUrl = null;
        this.currentChapterUrl = null;
        this.nextChapterExists = true;
        this.init()
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
        this.firstChapterUrl = this.$('.wp-manga-chapter:last-child a').attr('href');
        this.currentChapterUrl = this.firstChapterUrl;
    }
    async fetchChapters() {
        while (this.nextChapterExists) {
            await this.fetchSingleChapter();
        }
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

    async fetchSingleChapter() {
        const res =  await axios.get(this.currentChapterUrl);
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
        console.log(`>>>Created file "${chapterFilePath}"`)

        //Check if there is a next chapter
        if (!this.$('.nav-next').length && !this.$('.next_page').length) {
            this.nextChapterExists = false
        } else {
            this.currentChapterUrl = this.$('.nav-next a').attr('href')
        }
    }

}
