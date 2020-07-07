const cheerio = require('cheerio');
const axios = require('axios')
const rax = require('retry-axios');
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');
const interceptorId = rax.attach();
module.exports = class NovelFullScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.firstChapterUrl = null;
        this.currentChapterUrl = null;
        this.nextChapterExists = true;
        this.baseUrl = 'https://novelfull.com'
        this.init()
    }
    async init() {
        const res = await axios.get(this.novelUrl).catch(e=>console.error(e));
        this.$ = cheerio.load(res.data);
        this.novelName = sanitize(this.$('h3.title').text().trim());
        this.novelPath = `${this.rootDirectory}/${this.novelName}`
        try {
            fs.accessSync(this.novelPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(this.novelPath)
        }
        this.firstChapterUrl = this.baseUrl + this.$('#list-chapter .row>div:first-child li:first-child a').attr('href');
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
        })
            .replace(/(\n|.)*editor:.*/i, '')
            .replace(/if you find any errors(.|\s)*/i, '')
            .trim();
    }

    checkIfExit(text) {

    }

    getTitle(text) {
        const titleMatch = text.match(/(volume .* )?chapter [\d.]+.*/i)
        let title;
        if (!titleMatch) {
            title = this.$('.chapter-text').text()
        } else {
            title = sanitize(titleMatch[0]
                .replace(/(chapter.*)chapter.*\.\s/gi, `$1`)
                .replace(/[:.]/g, ' -'))
        }
        return title;
    }

    async fetchSingleChapter() {
        const res =  await axios.get(this.currentChapterUrl).catch(e=>console.error(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);


        const novelTextElement = this.$('#chapter-content')
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
        if (!this.$('#next_chap').attr('href')) {
            this.nextChapterExists = false
        } else {
            this.currentChapterUrl = this.baseUrl + this.$('#next_chap').attr('href')
        }
    }

}
