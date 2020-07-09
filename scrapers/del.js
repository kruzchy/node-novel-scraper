const axios = require('axios');
const UserAgent = require('user-agents')
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
const fs = require('fs');

const wrap = require('word-wrap');

const start = async ()=>{
    const url = 'https://webnovelonline.com/chapter/library_of_heavens_path/chapter-2185'
    const res = await axios.get(url)
    let temp =  JSON.parse(res.data.match(/<script>.*initial_data.*<\/script>/i)[0].split('=')[1].replace(/;<\/script>/i, '').trim()).filter(item=>item)[1].chapter.trim();
    temp = wrap(temp, {width: 130})
    console.log(temp)
};
start();
//this.$('script').toArray().map(item=>this.$(item).html()).filter(item=>item.match(/initial_data/i))[0]
// res.data.match(/<script>.*initial_data.*<\/script>/i)[0].split('=')[1].replace(/;<\/script>/i, '')
//JSON.parse(res.data.match(/<script>.*initial_data.*<\/script>/i)[0].split('=')[1].replace(/;<\/script>/i, '')).filter(item=>item)[1].chapter.trim()
