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
module.exports = class NovelOnlineFullScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.baseUrl = 'https://novelfull.com'
        this.chaptersUrlList = null;
        this.titleRegex = null;

    }
    async init() {
        const res = await axios.get(this.novelUrl, getNewAxiosConfig()).catch(e=>console.error(e));
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
        console.log('>>>Fetching chapters')
        const fetchChapterPromises = this.chaptersUrlList.map(chapterUrl=>limit(
            ()=>this.fetchSingleChapter(chapterUrl)
                .catch(
                    (err)=> {
                        console.log(`\n***Error at URL: ${chapterUrl}`)
                        console.error(err)
                    }
                )
            )
        )
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
            .replace(/\n\n\n/gi, '\n\n')
            .replace(/.*pa\s*treon.*/gi, '')
            .trim();
    }

    checkIfExit(text) {

    }

    getTitle() {
        //
        let tempTitle = this.$('.breadcrumb p').children().remove().end().text().trim()

        if (!tempTitle.match(/chapter\s*[\d.]+/i) && tempTitle.match(/^[\d.]+/i)) {
            tempTitle = `Chapter ${tempTitle}`
        }
        this.titleRegex = new RegExp(tempTitle, 'i')
        return sanitize(tempTitle)
    }

    getChaptersList() {
        return this.$('.chapter-list a').toArray().map(item => this.$(item).attr('href'))
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl, getNewAxiosConfig()).catch(e=>console.error(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);


        const novelTextElement = this.$('#vung_doc')
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
