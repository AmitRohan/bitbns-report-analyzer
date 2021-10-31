const fs = require('fs')
var parse = require('csv-parse')

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();


const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

const reportsPath = './reports/REPORT.csv';

var getObjectsFromReports = (callback) => {
    try {
        fs.readFile(reportsPath, function (err, fileData) {
            parse(fileData, {columns: true, trim: true}, callback)  
        })
    }catch(e){
        console.log("Unable to find file. Please download it from https://bitbns.com/trade/#/profile/trade-report and place it as reports/report.csv");
    }
}

var processDataList = (dataset,inrPrice) => {
    return dataset.reduce((prev,current,curretIndex) => {
        var _new = prev;
        if(current.SIDE=='BUY'){
            _new.coinBal += parseFloat(current.Crypto_Amt)
            _new.money -= (parseFloat(current.Crypto_Amt) * parseFloat(current.Rate))
            _new.fiat -= parseFloat(current.FIAT)
        }else{
            _new.coinBal -= parseFloat(current.Crypto_Amt)
            _new.money += (parseFloat(current.Crypto_Amt) * parseFloat(current.Rate))
            _new.fiat += parseFloat(current.FIAT)
        }
        
        _new.fee += parseFloat(current.Fee)
        _new.value = (_new.coinBal * inrPrice)
        if(_new.value != 0)
            _new.value -= _new.fee

        return _new  
    },{
        fee : 0,
        coinBal : 0,
        money : 0,
        fiat : 0,
        value : 0,
    })
}

getCoinDataFromReport = (key,report) => {
    return report.filter( row => (row.Coin == key));
}

cryptoTradeProcessor = (coinName,inrPrice) => {
    // Your CSV data is in an array of arrys passed to this callback as rows.
    getObjectsFromReports(function (err, fileData) {
        if (err) {
            console.error(err)
            return
        }
        var coinData = getCoinDataFromReport(coinName,fileData);
        
        var processedData = processDataList(coinData,inrPrice);
        var output = "\n\n";
        output += "\n======================================"; 
        output += "\n\t" + coinName + " trade result"; 
        output += "\n======================================"; 
        output += "\n\nCoins Owned : " + processedData.coinBal; 
        output += "\nCurrent Value : " + Math.abs(processedData.value);
        output += "\n\nTotal Fees Paid : " + processedData.fee;
        output += "\nMoney Invested (Without fee) : " + Math.abs(processedData.money);
        output += "\nMoney Invested (With fee) : " + Math.abs(processedData.fiat);
        output += "\n======================================\n"; 
        
        console.log(output)
    })
}
var supportedCoins = [
    "ETH",
    "BTC",
    "QKC",
    "DOGE",
    "SHIB",
    "SAFEMOON",
    "XRP"
];

const fetchLatestDataFromCoinGecko = (coinName) => {
    CoinGeckoClient
        .coins
        .list()
        .then(resp => {
            if(resp.code != 200){
                return;
            }
            resp.data.map( _ => {
                if(_.symbol == coinName.toLowerCase()){
                    CoinGeckoClient.coins.fetch(_.id, {})
                        .then(_resp => {
                            const inrPrice = _resp.data.market_data.current_price.inr
                            cryptoTradeProcessor(coinName,inrPrice)
                        });
            }
        })
    })
}
readline.question(supportedCoins.join('\n') + `\nWhich coin?`, coinName => {
    fetchLatestDataFromCoinGecko(coinName);
        readline.question(`Press any key to exit`, anykey => {
            readline.close()
        })
    readline.close()
})



