const cheerio = require('cheerio');
const axios = require('axios')
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');
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
        const res = await axios.get(this.novelUrl);
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
    async fetchSingleChapter() {
        const res =  await axios.get(this.currentChapterUrl);
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);


        const novelTextElement = this.$('#chapter-content')
        const text = htmlToText.fromString(novelTextElement.toString(), {
            wordwrap: 130
        });
        if (!text.match(/chapter [\d.]+.*/i)) process.exit()
        const title = sanitize(text.match(/chapter [\d.]+.*/i)[0].replace(':', ' -'))

        const chapterPath = `${this.novelPath}/${title}`
        const chapterFilePath = `${this.novelPath}/${title}/${title}.txt`



        fs.access(chapterPath, fs.constants.F_OK, err => {
            if (err)  fs.mkdir(chapterPath, err1 => {
                if (err1) console.error(err1)
            })
        })
        fs.writeFile(chapterFilePath, text, err => {
            if (!err) console.log(`>>>Created file "${chapterFilePath}"`)
        })

        //Check if there is a next chapter
        if (!this.$('#next_chap').attr('href')) {
            this.nextChapterExists = false
        } else {
            this.currentChapterUrl = this.baseUrl + this.$('#next_chap').attr('href')
        }
    }

}
