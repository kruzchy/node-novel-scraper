const axios = require('axios');
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const fs = require('fs');
const sanitize = require("sanitize-filename");
// const url = 'https://wordexcerpt.com/series/i-dont-want-to-be-loved/';
const url = 'https://noveltrench.com/manga/the-favored-son-of-heaven/';
let nextChapterExists = true;
let chapterUrl;
let continued = false;
try {
    fs.accessSync('./data', fs.constants.F_OK)
} catch (e) {
    fs.mkdir('./data', ()=>console.log('>>>Created the folder "data"'))
}


const saveChapter = async (seriesPath, chapUrl, startFrom=null) => {
    if (startFrom && !continued) {
        chapUrl = chapUrl.replace(/\/chapter-(.*)\//, `/chapter-${startFrom}/`);
        continued = true;
    }
    const res = await axios.get(chapUrl);
    const htmlData = res.data;
    const $ = cheerio.load(htmlData);
    if (!$('.nav-next').length) {
        nextChapterExists = false
    } else {
        chapterUrl = $('.nav-next a').attr('href')
    }
    $('center').remove()
    $('p strong:nth-child(2)~*').remove()
    const novelTextElement = $('.text-left')
    const text = htmlToText.fromString(novelTextElement.toString(), {
        wordwrap: 130
    });
    let title;
    title = chapUrl.includes('wordexcerpt.com') ? sanitize(text.match(/chapter [\d.]+\s*:.*/i)[0].replace(':', ' -')) :
            chapUrl.includes('noveltrench.com') ? sanitize($('#chapter-heading').text()) :
            ''
    // const title = sanitize(text.match(/chapter [\d.]+\s*:.*/i)[0].replace(':', ' -'))
    const filePath = `${seriesPath}/${title}.txt`
    let skipFile = false;

    try {
        fs.accessSync(filePath, fs.constants.F_OK)
        skipFile = true
        console.log(`***Skipping file "${filePath}"`)
    } catch (e) {

    }
    if (!nextChapterExists && !skipFile) {
        fs.writeFile(filePath, text, err => {
            if (!err) console.log(`>>>Created file "${filePath}"`)
        })
    } else if (nextChapterExists && !skipFile) {
        fs.writeFileSync(filePath, text)
        console.log(`>>>Created file "${filePath}"`)
    }


}

(async () => {
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)
    const seriesName = sanitize($('h1').text().trim())
    const seriesPath = `./data/${seriesName}`
    try {
        fs.accessSync(seriesPath, fs.constants.F_OK)
    } catch (e) {
        fs.mkdir(seriesPath, ()=>console.log('>>>Created the folder "data"'))
    }
    chapterUrl = $('.wp-manga-chapter:last-child a').attr('href')
    while (nextChapterExists) {
        await saveChapter(seriesPath, chapterUrl, 142);
    }
})()
