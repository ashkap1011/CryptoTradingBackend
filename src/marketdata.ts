
import axios from "axios"



export async function getMarketData(): Promise<any>{

    
    const altcoinTradingPair = ["BTC/USDT","XVG/BTC", "XRP/BTC", "BNB/BTC","ETH/BTC","TRX/BTC"]

    var marketData = []

    for(var i =0; i < altcoinTradingPair.length; i++){  
        let price = await getTradingPairPrice(altcoinTradingPair[i])
        marketData.push({symbol:altcoinTradingPair[i], price: price })
    }
    
    return marketData
    
}


//TODO FIX THIS PROMISE
async function getTradingPairPrice(tradingPair:String): Promise<number>{
    const baseurl: string = 'https://api.binance.com/api/v1/ticker/price?symbol=';
    
    const url = baseurl + tradingPair.replace("/","")

    let price = await axios.get(url).then(response => { 
        //console.log(tradingPair + " price: " + response.data.price) 
        return response.data.price * 1
        //return price != undefined ? price :1    
        }).catch(err=>{
             console.log(err)
        })

    if(price != undefined){
        return price
    } return -1 
}




// async function getTradingPairPrice(tradingPair:String): Promise<number>{
//     const baseurl: string = 'https://api.binance.com/api/v1/ticker/price?symbol=';
//     const url = baseurl + tradingPair

//     let price = await axios.get(url).then(response => { 
//         //console.log(tradingPair + " price: " + response.data.price) 
//         return response.data.price * 1
//         //return price != undefined ? price :1    
//         }).catch(err=>{
//            // console.log(err)
//         })

//     if(price != undefined){
//         return price
//     } return -1 
// }






// marketData.map(coin=>{
    //     getTradingPairPrice(coin.symbol).then(price=>{
    //         coin.price = price
    //     })
    // })

    // return marketData

    // altcoinTradingPair.forEach(tradPair =>{
    //     getTradingPairPrice(tradPair).then(price=>{
    //         console.log("hey")
    //         marketData.push({symbol:tradPair, price: price })
    //         console.log("MARKETDATA----------" + marketData.toString())
    //     })
    // })