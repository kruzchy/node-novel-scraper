const axios = require('axios');
const UserAgent = require('user-agents')
const cheerio = require('cheerio');
const htmlToText = require('html-to-text');
// const start = async ()=>{
//     const userAgent = new UserAgent();
//     const headers = {
//         'authority': 'readlightnovels.net',
//         'accept': 'application/json, text/javascript, */*; q=0.01',
//         'x-requested-with': 'XMLHttpRequest',
//         'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Mobile Safari/537.36',
//         'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
//         'origin': 'https://readlightnovels.net',
//         'sec-fetch-site': 'same-origin',
//         'sec-fetch-mode': 'cors',
//         'sec-fetch-dest': 'empty',
//         'referer': 'https://readlightnovels.net/genius-girl.html',
//         'accept-language': 'en-US,en;q=0.9',
//         'cookie': '__cfduid=dfe430d3e4f25efb8afaa343e7d6796e71594137161',
//     }
//     const axiosConfig = {
//         headers: headers
//         }
//     // const res = await axios.get('https://www.lightnovelworld.com/novel/martial-world-wuji-tianxia', axiosConfig)
//     const url = 'https://readlightnovels.net/wp-admin/admin-ajax.php'
//     const axiosData = {
//         action: 'tw_ajax',
//         type: 'pagination',
//         id: '243243',
//         page: '2'
//     }
//
//     const res = await axios.post(url, axiosData, axiosConfig).catch(e=>console.error(e))
//     console.log(res.data)
//     const text = htmlToText.fromString($('.desc').toString(), {
//         wordwrap: 130
//     });
//     console.log(text)
// }
const start = ()=>{
    const str = 'CHAPTER 150 CHAPTER 150 - THE WICKED WOMAN COMES ASHORE, PART VIII';
    const data = str.replace(/\b(chapter [\d.]+).*\1/i, '$1')
    console.log(data)
};
start();
