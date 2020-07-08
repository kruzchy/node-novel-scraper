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
    minTime: 100,
    maxConcurrent: 8
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
module.exports = class ReadNovelFullScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl+'#tab-chapters-title';
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.baseUrl = 'https://readnovelfull.com'
        this.chaptersUrlList = null;
    }
    async init() {
        const res = await axios.get(this.novelUrl, axiosConfig).catch(e=>console.error(e));
        this.$ = cheerio.load(res.data);
        this.novelName = sanitize(this.$(this.$('h3.title').toArray()[0]).text().trim());
        this.novelPath = `${this.rootDirectory}/${this.novelName}`
        try {
            fs.accessSync(this.novelPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(this.novelPath)
        }
        this.chaptersUrlList = await this.getChaptersList()
    }
    async fetchChapters() {
        await limiter.schedule(()=>{
            console.log('>>>Fetching chapters')
            const fetchChapterPromises = this.chaptersUrlList.map(chapterUrl=>this.fetchSingleChapter(chapterUrl))
            bar1.start(fetchChapterPromises.length, 0)
            return Promise.all(fetchChapterPromises)
        });
        bar1.stop()
    }

    processHtml() {

    }

    getText(textElement) {
        return htmlToText.fromString(textElement.toString(), {
            wordwrap: 130
        })
            .trim();
    }

    checkIfExit(text) {

    }

    getTitle(text) {
        const titleMatch = text.match(/(volume .* )?chapter [\d.]+.*/i)
        let title;
        if (!titleMatch) {
            title = this.$('.chr-text').text()
        } else {
            title = sanitize(titleMatch[0])
        }
        title = sanitize(title.replace(/(chapter.*)chapter.*\.\s/gi, `$1`)
            .replace(/[:.]/g, ' -'))
        return title;
    }

    async getChaptersList() {
        const novelId = this.$('div#rating').attr('data-novel-id')
        const res = await axios.get(`https://readnovelfull.com/ajax/chapter-archive?novelId=${novelId}`, axiosConfig)
        const $ = cheerio.load(res.data);
        return $('.list-chapter li a').toArray().map(item => this.baseUrl + $(item).attr('href'))
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl, axiosConfig).catch(e=>console.error(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);


        const novelTextElement = this.$('#chr-content')
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
        bar1.increment()
        // console.log(`>>>Created file "${title}.txt"`)

    }

}
