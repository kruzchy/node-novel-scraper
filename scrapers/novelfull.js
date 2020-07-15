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
module.exports = class NovelFullScraper {
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
        this.novelName = sanitize(this.$(this.$('h3.title').toArray()[0]).text().trim());
        this.novelPath = `${this.rootDirectory}/${this.novelName}`
        try {
            fs.accessSync(this.novelPath, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(this.novelPath)
        }
        await this.getChaptersList()
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
            .replace(/if you find any errors(.|\s)*/i, '')
            .trim();
    // .replace(/(\n|.)*editor group:.*/i, '')
    // .replace(/(\n|.)*editor:.*/i, '')
    //         .replace(/(\n|.)*translator:.*/i, '')
    //         .replace(/(\n|.)*author:.*/i, '')
    //         .replace(/(\n|.)*author:.*/i, '')
    }

    checkIfExit(text) {

    }

    getTitle() {
        let title =  this.$('.chapter-text').text();
        this.titleRegex = new RegExp(`.*${title}.*`, 'i')
        title = sanitize(title.replace(/[:.]/g, ' -').replace(/\b(chapter [\d.]+).*\1/i, '$1'))
        return title;
    }

    async getChaptersList() {
        const chaptersList = [];
        const lastPageNumber = this.$('.last a').attr('href').split('?page=')[1].split('&')[0]
        const getPageUrl = (pageNumber)=>{
            return this.baseUrl + this.$('.last a').attr('href').split('?')[0] + `?page=${pageNumber}&per-page=50`
        };
        for (let pageNum=1; pageNum <= lastPageNumber; pageNum++) {
            const url = getPageUrl(pageNum)
            const res = await axios.get(url, getNewAxiosConfig());
            const $ = cheerio.load(res.data);
            $('.list-chapter li a').toArray().forEach(item => chaptersList.push(this.baseUrl + $(item).attr('href')))
        }
        this.chaptersUrlList = chaptersList;
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl, getNewAxiosConfig()).catch(e=>console.error(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);


        const novelTextElement = this.$('#chapter-content')
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
