const fs = require('fs')
var parse = require('csv-parse')
var asciichart = require ('asciichart')


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
            if(err != null){
                console.log("Unable to find file. Please download it from https://bitbns.com/trade/#/profile/trade-report and place it as reports/report.csv");
                return;
            }
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
            _new.money -= ((parseFloat(current.Crypto_Amt)*100000000) * (parseFloat(current.Rate)*100000000))
			_new.money /= 10000000000000000
            _new.fiat -= parseFloat(current.FIAT)
        }else{
            _new.coinBal -= parseFloat(current.Crypto_Amt)
            _new.money += ((parseFloat(current.Crypto_Amt)*100000000) * (parseFloat(current.Rate)*100000000))
			_new.money /= 10000000000000000
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
    return report.filter( row => (row.Coin.toLowerCase() == key.toLowerCase()));
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
        output += "\n======================================================================"; 
        output += "\n\t" + coinName + " trade result"; 
        output += "\n======================================================================"; 
        output += "\n\nCoins Owned : " + processedData.coinBal + " " + coinName; 
        output += "\nCurrent Value : " + Math.abs(processedData.value) + " INR";
        output += "\n\nTotal Fees Paid : " + processedData.fee + " INR";
        output += "\nMoney Invested (Without fee) : " + Math.abs(processedData.money) + " INR";
        output += "\nMoney Invested (With fee) : " + Math.abs(processedData.fiat) + " INR";
        output += "\n======================================\n"; 
        output += "\nPress any key to exit.\n";         
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
            resp.data.map( coinResp => {
                if(coinResp.symbol == coinName.toLowerCase()){
                    
                    // Get Data
                    console.log("Fetching Latest Coin Data");
                    CoinGeckoClient.coins.fetch(coinResp.id, {})
                        .then(coinDataReponse => {
                            console.log("Latest Coin Data Fetched");
                            const inrPrice = coinDataReponse.data.market_data.current_price.inr
                            
							console.log("Fetching Historic Prices");
							CoinGeckoClient.coins.fetchMarketChart(coinResp.id, {days : 91, vs_currency : 'inr' , interval : 'daily '})
                                .then(coinMarketChartData => {
                                    console.log("Historic Prices Fetched");
                                    const historicPrices = coinMarketChartData
                                                                .data
                                                                .prices
                                                                .filter((x,i)=> i > 61) // save last 5 entry as interval field is not supported yet
                                                                .map(x => { return Math.round(x[1]*10)/10}); // get abs value of price, 2nd param, 1st is timestamp
                                    
                                    var charOutputs = `\n ${coinResp.symbol} Day Wise Chart\t Current Price ${inrPrice} INR`;
                                    charOutputs += "\n======================================"; 
                                    charOutputs += "\n" + asciichart.plot(historicPrices,{ height: 4 })
                                    charOutputs += "\n======================================"; 
                                    console.log(charOutputs)
                                    

                                    console.log("Processing Report");
                                    cryptoTradeProcessor(coinResp.symbol,inrPrice)

                                });

                                
                        });
            }
        })
    })
}
readline.question(supportedCoins.map( (x,i) => (i+1) + " " + x ).join('\n') + `\nWhich option?`, indexToLookFor => {
    var coinName = supportedCoins.filter( (x,i) => i == (indexToLookFor -1))[0]
    fetchLatestDataFromCoinGecko(coinName);
    readline.close();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
})


