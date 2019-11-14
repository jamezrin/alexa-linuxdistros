const cheerio = require('cheerio');
const request = require('request-promise');

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

module.exports = { fetchDistroRanking }