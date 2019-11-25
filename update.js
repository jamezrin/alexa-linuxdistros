const cheerio = require('cheerio');
const request = require('request-promise');
const path = require('path');
const fs = require('fs');

async function fetchDistroRanking() {
    const rankingBody = await request('https://distrowatch.com/dwres.php?resource=popularity');
    const $ = cheerio.load(rankingBody);

    const rankingTable = $('table.News td.News1 td.NewsText > table > tbody > tr > td');
    return rankingTable.map(function (index, element) {
        const rankingColumn = $('> table > tbody', element);
        const rankingColumnTitle = $('> tr:nth-child(1)', rankingColumn);
        const rankingColumnDistros = $('> tr:nth-child(1n+2)', rankingColumn);
        return {
            title: rankingColumnTitle.text(),
            distros: rankingColumnDistros.map(function (index, element) {
                return {
                    position: $('.phr1', element).text(),
                    name: $('.phr2', element).text(),
                    hits: $('.phr3', element).text()
                }
            }).toArray()
        };
    }).toArray();
}

console.log('Updating the ranking database...');
fetchDistroRanking().then(rankingResponse => {
    const rankingPath = path.resolve(__dirname, 'src/ranking.json');
    fs.writeFileSync(rankingPath, JSON.stringify(rankingResponse));
    console.log('Successfully updated the ranking database');
});