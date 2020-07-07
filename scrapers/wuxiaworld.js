const cheerio = require('cheerio');
const axios = require('axios')
const puppeteer = require('puppeteer')
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');
module.exports = class WuxiaWorldScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.firstChapterUrl = null;
        this.currentChapterUrl = null;
        this.nextChapterExists = true;
        this.page = null;
        this.browser = null;
        this.init()
    }
    async init() {
        try {
            this.browser = await puppeteer.launch({headless: false});
            [this.page] = await this.browser.pages();
            await this.page.goto(this.novelUrl, {waitUntil: 'networkidle0'})
            const data = await this.page.content();
        } catch (e) {
            console.error(e)
        }
        this.$ = cheerio.load(data);
        this.novelName = sanitize(this.$('h3').text().trim());
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
    async fetchSingleChapter() {
        await this.page.goto(this.currentChapterUrl)
        const htmlData = this.page.content();
        this.$ = cheerio.load(htmlData);


        const novelTextElement = this.$('.text-left')
        const text = htmlToText.fromString(novelTextElement.toString(), {
            wordwrap: 130
        });
        if (!text.match(/chapter [\d.]+\s*:.*/i)) process.exit()
        const title = sanitize(text.match(/chapter [\d.]+\s*:.*/i)[0].replace(':', ' -'))

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
        if (!this.$('.nav-next').length) {
            this.nextChapterExists = false
        } else {
            this.currentChapterUrl = this.$('.nav-next a').attr('href')
        }
    }

}
