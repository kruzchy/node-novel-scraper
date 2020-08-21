const UserAgent = require('user-agents')
const axios = require('axios')
const rax = require('retry-axios');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const cheerio = require('cheerio');
const sanitize = require("sanitize-filename");
const htmlToText = require('html-to-text');
const fs = require('fs');


module.exports = class Scraper {
    rootDirectory = './data'
    scraperName = 'default'
    constructor(novelUrl) {
        this.novelUrl = novelUrl;
        this.bar1 = new cliProgress.SingleBar({
            format: 'Downloading {bar} {value}/{total} Chapters'
        }, cliProgress.Presets.shades_classic);
        this.$ = null;
        this.scraperNamePath = null;
        this.novelName = null;
        this.novelPath = null;
        this.chaptersUrlList = null;
        this.novelNameSelector = null;
        this.chapterTextSelector = null;
        this.chapterTitleSelector = null;
        this.titleRegex = null;
        this.userAgent = null;
        this.limitNum = null;
        this.limit = pLimit(16);
    }

    createDirectoryIfNotExists(directory) {
        try {
            fs.accessSync(directory, fs.constants.F_OK)
        } catch (e) {
            fs.mkdirSync(directory)
        }
    }

    showMethodNotOverriddenError() {
        throw new Error('You have to implement this method!');
    }

    getNewAxiosConfig(ua=null) {
        const myAxiosInstance = axios.create();
        const interceptorId = rax.attach(myAxiosInstance);
        const userAgent = ua?ua:new UserAgent();
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
    }

    getNovelName() {
        return sanitize(this.$(this.novelNameSelector).text().trim())
    }

    async getChapterLinks() {
        //    Implement in children - return initial list of chapter links
        this.showMethodNotOverriddenError()
    }

    getProcessedChaptersList(initialChaptersList) {
        return initialChaptersList;
    }

    async getChaptersList() {
        console.log('>>>Fetching Chapters')
        let initialChaptersList = await this.getChapterLinks()
        return await this.getProcessedChaptersList(initialChaptersList)
    }

    async init() {
        this.limit = this.limitNum ? pLimit(this.limitNum) : this.limit
        this.createDirectoryIfNotExists(this.rootDirectory)
        this.scraperNamePath = `${this.rootDirectory}/${this.scraperName}`
        this.createDirectoryIfNotExists(this.scraperNamePath)

        const res = await axios.get(this.novelUrl, this.getNewAxiosConfig(this.userAgent)).catch(e=>console.error(e));
        this.$ = cheerio.load(res.data);
        this.novelName = this.getNovelName();
        this.novelPath = `${this.rootDirectory}/${this.scraperName}/${this.novelName}`
        this.chaptersUrlList = await this.getChaptersList()

        this.createDirectoryIfNotExists(this.novelPath)
    }

    processCheerioDOMTree() {
    }

    processChapterTitle(tempTitle) {
        return sanitize(tempTitle.replace(/[:]/, ' -').trim())
    }

    getTitle() {
        const tempTitle = this.$(this.chapterTitleSelector).text();
        return this.processChapterTitle(tempTitle)
    }

    processChapterText(text) {
        //    Implement in children - return the chapter Title
        this.showMethodNotOverriddenError()
    }

    getText(textElement, htmlData=null) {
        let tempText = htmlToText.fromString(textElement.toString(), {
            wordwrap: null,
            uppercaseHeadings: false
        })
        return this.processChapterText(tempText)
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    makeTitleTextBold(text, title) {
        let titleRegex = new RegExp(`.*${this.escapeRegExp(title)}.*`, 'i')
        !text.match(titleRegex) && (titleRegex = /^chapter.*/i)
        return text
            .replace(titleRegex, '<strong>$&</strong>')
    }

    async fetchSingleChapter(chapterUrl) {
        const res =  await axios.get(chapterUrl, this.getNewAxiosConfig(this.userAgent)).catch(e=>console.error(e));
        const htmlData = res.data;
        this.$ = cheerio.load(htmlData);

        this.processCheerioDOMTree()

        const novelTextElement = this.$(this.chapterTextSelector);
        const title = this.getTitle();
        const text = this.makeTitleTextBold(this.getText(novelTextElement, htmlData), title);


        const chapterPath = `${this.novelPath}/${title}`
        const chapterFilePath = `${this.novelPath}/${title}/${title}.txt`

        this.createDirectoryIfNotExists(chapterPath)

        fs.writeFileSync(chapterFilePath, text)
        this.bar1.increment()
    }

    async fetchChapters() {
        const fetchChapterPromises = this.chaptersUrlList.map(chapterUrl=>this.limit(
            ()=>this.fetchSingleChapter(chapterUrl)
                .catch(
                    (err)=> {
                        console.log(`\n***Error at URL: ${chapterUrl}`)
                        console.error(err)
                    }
                )
        ))
        this.bar1.start(fetchChapterPromises.length, 0)
        await Promise.all(fetchChapterPromises)
        this.bar1.stop()
    }
}
