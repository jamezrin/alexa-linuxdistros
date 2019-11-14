const provider = require('./provider');
const fs = require('fs');

provider.fetchDistroRanking().then(rankingObj => {
    console.log('Columns:', rankingObj.length);
    console.log('Distros (1st col):', rankingObj[0].distros.length);
    const rankingJson = JSON.stringify(rankingObj);
    fs.writeFileSync('ranking.json', rankingJson);
    console.log('Wrote distros to ranking.json')
})