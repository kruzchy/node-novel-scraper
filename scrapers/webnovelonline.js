const cheerio = require('cheerio');
const axios = require('axios')
const rax = require('retry-axios');
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const wrap = require('word-wrap');
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
module.exports = class WebNovelOnlineScraper {
    constructor(novelUrl) {
        this.rootDirectory = './data'
        this.novelUrl = novelUrl;
        this.$ = null;
        this.novelName = null;
        this.novelPath = null;
        this.chaptersUrlList = null;
        this.baseUrl = 'https://webnovelonline.com';
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

    getText(data) {
         let temp =  JSON.parse(data.match(/<script>.*initial_data.*<\/script>/i)[0].split(/initial_data_\s*=/i)[1].replace(/;<\/script>/i, '').trim()).filter(item=>item)[1].chapter.trim()
        if (temp.match(/<p>/gi)) {
            temp = htmlToText.fromString(temp, {wordwrap: null})
        }
         return temp;
    }

    checkIfExit() {
    }

    getTitle() {
        return sanitize(this.$('.chapter-info h3').text().trim().replace(/\b([\d.]*) (chapter \1)/i, '$2'))
    }

    getChaptersList() {
        return this.$('div[role=\'listitem\'] a').toArray().map(item => this.baseUrl + this.$(item).attr('href'))
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl, getNewAxiosConfig()).catch(e=>console.log(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);
        // this.processHtml()


        const novelTextElement = this.$('.chapter-content')
        const text = this.getText(res.data)
        const title = this.getTitle()

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
