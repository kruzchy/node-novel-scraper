const axios = require('axios');
const url = 'https://wordexcerpt.com/series/heroine-saves-a-gentleman/';
const fs = require('fs');
const main = async () => {
    const res = await axios.get(url);
    fs.writeFileSync("E:\\Desktop\\useless\\dfd\\new.html", res.data)
};

main()
