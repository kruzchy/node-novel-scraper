const cheerio = require('cheerio');
const axios = require('axios')
const rax = require('retry-axios');
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');
const cliProgress = require('cli-progress');
const pLimit = require('p-limit');
const limit = pLimit(16);
const UserAgent = require('user-agents')


const myAxiosInstance = axios.create();
const getNewAxiosConfig = () => {
    const userAgent = new UserAgent();
    return {
        headers: {
            'User-Agent': userAgent.toString()
        },
        raxConfig: {
            noResponseRetries: 5,
            retry: 5,
            retryDelay: 100,
            instance: myAxiosInstance,
        }
    }
};
const interceptorId = rax.attach(myAxiosInstance);

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
        this.titleRegex = null;

    }
    async init() {
        const res = await axios.get(this.novelUrl, getNewAxiosConfig()).catch(e=>console.error(e));
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
        console.log('>>>Fetching chapters')
        const fetchChapterPromises = this.chaptersUrlList.map(chapterUrl=>limit(
            ()=>this.fetchSingleChapter(chapterUrl)
                .catch(
                    (err)=> {
                        console.log(`\n***Error at URL: ${chapterUrl}`)
                        console.error(err)
                    }
                )
        ))
        bar1.start(fetchChapterPromises.length, 0)
        await Promise.all(fetchChapterPromises)
        bar1.stop()
    }

    processHtml() {

    }

    getText(textElement) {
        return htmlToText.fromString(textElement.toString(), {
            wordwrap: null,
            uppercaseHeadings: false
        })
            .trim();
    }

    checkIfExit(text) {

    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    getTitle() {
        let title = this.$('.chr-text').text()
        this.titleRegex = new RegExp(`.*${this.escapeRegExp(title)}.*`, 'i')
        title = sanitize(title.replace(/(chapter.*)chapter.*\.\s/gi, `$1`)
            .replace(/[:.]/g, ' -'))
        return title;
    }

    async getChaptersList() {
        const novelId = this.$('div#rating').attr('data-novel-id')
        const res = await axios.get(`https://readnovelfull.com/ajax/chapter-archive?novelId=${novelId}`, getNewAxiosConfig())
        const $ = cheerio.load(res.data);
        return $('.list-chapter li a').toArray().map(item => this.baseUrl + $(item).attr('href'))
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl, getNewAxiosConfig()).catch(e=>console.error(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);


        const novelTextElement = this.$('#chr-content')
        let text = this.getText(novelTextElement)
        const title = this.getTitle()

        !text.match(this.titleRegex) && (this.titleRegex = /^chapter.*/i)
        text = text.replace(this.titleRegex, '<strong>$&</strong>')

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
