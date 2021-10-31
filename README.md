# BitBns-investment-processor

This project helps you to get better details on your investments on [BitBns](https://bitbns.com/trade/#/) by using their [report](https://bitbns.com/trade/#/profile/trade-report) and coin prices from [coingecko](https://www.coingecko.com/en) using their [API's](https://www.coingecko.com/en/api)

# Example Coin
ETH
BTC
QKC
DOGE
SHIB
SAFEMOON
XRP

# Pre-Requisites
1. [Bit Bns Reports](https://bitbns.com/trade/#/profile/trade-report)
2. [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

# Setup
1. Rename your [Bit Bns Report](https://bitbns.com/trade/#/profile/trade-report) as REPORT.CSV and place it in reports folder.
2. Install Project Dependencies by running ```npm install``` in your root folder

# Run
Run the project and give input based on the menu.

```
    npm start
```
# Docker guide
Run it directly
Save your REPORT.csv in a location and mount it to /reports in container and run it
```
docker run -it -v /home/user/bitbns/report:/reports ghcr.io/
amitrohan/bitbns-report-analyzer:main
```
Or use docker-conpose.yml file and attach into container

# Ref
1. asciichart
2. coingecko-api
3. csv-parse

