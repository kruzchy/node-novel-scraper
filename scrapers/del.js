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
    const res = await axios.get('https://www.readlightnovel.org/chrysalis/chapter-5', axiosConfig)
    const htmlData = res.data;
    const $ = cheerio.load(htmlData);
    $('.trinity-player-iframe-wrapper, small, center').remove()
    const text = htmlToText.fromString($('.desc').toString(), {
        wordwrap: 130
    });
    console.log(text)
}
start();
