const axios = require('axios');
const UserAgent = require('user-agents')
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const start = async ()=>{
    const userAgent = new UserAgent();
    const axiosConfig = {
        headers:{
            'User-Agent':userAgent.toString()
            }
        }
    // const res = await axios.get('https://www.lightnovelworld.com/novel/martial-world-wuji-tianxia', axiosConfig)
    const res = await axios.get('https://www.lightnovelworld.com/novel/dual-cultivation', axiosConfig)
    const htmlData = res.data;
    const $ = cheerio.load(htmlData);
    const a = $('.pagination li:nth-last-child(2) a')
    const text = htmlToText.fromString($('.desc').toString(), {
        wordwrap: 130
    });
    console.log(text)
}
start();
