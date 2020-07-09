const axios = require('axios');
const UserAgent = require('user-agents')
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const fs = require('fs');

const wrap = require('word-wrap');

const start = async ()=>{
    const url = 'https://bestlightnovel.com/novel_888125844/chapter_2263'
    const res = await axios.get(url)
    const $ = cheerio.load(res.data)
   const data = $('.breadcrumb p').children().remove().end().text().trim()
    console.log(data)
};
start();
//this.$('script').toArray().map(item=>this.$(item).html()).filter(item=>item.match(/initial_data/i))[0]
// res.data.match(/<script>.*initial_data.*<\/script>/i)[0].split('=')[1].replace(/;<\/script>/i, '')
//JSON.parse(res.data.match(/<script>.*initial_data.*<\/script>/i)[0].split('=')[1].replace(/;<\/script>/i, '')).filter(item=>item)[1].chapter.trim()
