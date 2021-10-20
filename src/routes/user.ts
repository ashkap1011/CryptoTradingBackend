import express from "express"
import { runInNewContext } from "vm"
import User from "../models/User"
import UserAccount, { WalletItem, ExecutedOrder, CryptoEquity } from "../models/Wallet"
import UserActiveOrders, {ActiveOrder, Currency, orderType} from "../models/ActiveOrder"
import { addListener } from "process"
import { Schema } from "mongoose"
import axios from "axios"
import { rejects } from "assert"
import { resolve } from "path"


const router = express.Router()

//@desc          
//@route    GET /user
router.get('/', function (req, res) {
    res.send('ji')
})


//@desc          
//@route    GET /user
router.post('/signup', function (req, res) {
    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){ 
        return;
    }
    
    let credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password
    
    let username = credentialsArray[0]
    let password = credentialsArray[1]
    
    User.exists({username: username}).then(isNotUniqueSignUp =>{

        if(isNotUniqueSignUp){
            notUniqueSignUp(res)
        } else{
            uniqueSignUp(username,password,res) //TODO MAYBE ADD WALLET FOR USER TOO
        }
    })
        
})

function invalidAuthHeader(req:any, res:any){
    if(req.headers.authorization == null){
        res.send({
            isSuccessful: false,
            message: "Invalid Input"
        })
        return true
    } 
    return false
}

function parseAuthorisationHeader(req:any){
    let authHeader = ""
    authHeader = req.headers.authorization
    console.log("encoded:" + authHeader)
    let encodedCredentials =  authHeader.split(" ").slice(-1)[0]
    console.log("endoded:" + encodedCredentials)
    let decodedCredentials =  Buffer.from(encodedCredentials,"base64").toString()  //gets the word
    console.log("decodedCreds: " + decodedCredentials.toString())
    return decodedCredentials.split(":")
}

function uniqueSignUp(username:String,password:String,res:any){
    let newRegistration = new User({
                username: username,
                password: password
            })

    newRegistration.save().then(newUser =>{
    instantiateUserAccount(newUser._id)
    }).catch(err =>{
        console.log("new signup error: " + err)
    })


    res.send({
                isSuccessful: true,
                message: "Signup Successful"
            })        
}

function notUniqueSignUp(res:any){
    res.send({
                isSuccessful: false,
                message: "Username already exists"
            })
}

router.post('/login', function (req, res) {
    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){
        return;
    }
    
    let credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password

    User.exists({username: credentialsArray[0],password: credentialsArray[1] }).then(isValidUser => {
        
        if(isValidUser){
            loginSuccessful(res)
        } else{
            loginUnsuccesful(res)
        }
    })
})

//creates wallet model 
function instantiateUserAccount(userId:Schema.Types.ObjectId){
        const account = new UserAccount({
            userId: userId,
            wallet : [{symbol: BTC, quantity: 0, lockedQuantity:0}],
            executedOrders: [],
        })
        account.save()
        const userActiveOrders = new UserActiveOrders({
            userId: userId,
            activeOrders: [],
        })
        userActiveOrders.save().then(res => console.log("useractiveorder saved:" +res)).catch(err =>{console.log(err)})
}

function loginSuccessful(res:any){
    res.send({
        isSuccessful: true,
        message: "Successful Login"
    })
}

function loginUnsuccesful(res:any){
    res.send({
        isSuccessful: false,
        message: "Incorrect Username or Password"
    })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/test', function (req:any,res:any){
    //getAltcoinValueInBTC("XVG",10000000)

    console.log("res.body:"+ req.body)
    console.log(req.body.isBuy)
    console.log(req.body.symbol)
})


//@desc     returns wallet of user    
//@route    GET /user/wallet
router.get('/wallet', function (req, res) {
    //TODO 
    //check if valid user, get their id and use that to get their wallet
    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){ //TODO maybe not necessary
        return;
    }
    
    let credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password
    
    User.findOne({username: credentialsArray[0],password: credentialsArray[1]}).then(user => {
        if(user != null){
            UserAccount.findOne({userId: user.id}).then(account =>{
                if(account != null){
                    res.send(account.wallet)
                }
            })
        }
    })

    //res.send([{"id": 2, "symbol": "XVG", "quantity": 1.3},{"id": 2, "symbol": "XVG", "quantity": 1.3}])
})


//@desc     get trading history
//@route    GET /user/tradinghistory
router.get('/tradinghistory', function (req, res) {
    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){ //TODO maybe not necessary
        return;
    }

    let credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password
    
    User.findOne({username: credentialsArray[0],password: credentialsArray[1]}).then(user => {
        if(user != null){
            UserAccount.findOne({userId: user.id}).then(account =>{
                if(account != null){
                    res.send(account.executedOrders)
                }
            })
        }
    })
})




//@desc     places market order
//@route    GET /user/order/new/market
//req has cryptosymbol, cryptoquantity), isbuy 
router.post('/order/new/market', function (req, res) {

    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){ //TODO maybe not necessary
        return;
    }

    const credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password
    const cryptoSymbol:String = req.body.symbol 
    const cryptoQuantity:number = req.body.quantity
    const isBuy:boolean = req.body.isBuy                        //refers to buying Altcoin i.e. BTC to Altcoin

    User.findOne({username: credentialsArray[0],password: credentialsArray[1]}).then(user => {
        if(user != null){
            UserAccount.findOne({userId: user.id}).then(account =>{
                if(account != null){
                    userHasFunds(account.wallet, cryptoSymbol,cryptoQuantity,isBuy).then(hasFunds =>{
                        if(hasFunds){
                            executeOrder(user._id,account.wallet, cryptoSymbol,cryptoQuantity,isBuy)
                            //TODO  make update trading history run only when order executed
                            updateTradingHistory(user._id, cryptoSymbol,cryptoQuantity,isBuy)
                            res.send({
                                isSuccessful: true,
                                message: "Success!"
                            })
                        }  else{
                            //SEND RESPONSE NOT ENOUGH FUNDS
                            res.send({isSuccessful: false,
                                message: "Not enough funds"})
                        }                   
                    })                     
                      
                }
            })
        }
    })
})


//@desc     places limit order
//@route    GET /user/order/new/limit'
//req has cryptosymbol, cryptoquantity), isbuy, execution price 
router.post('/order/new/limit', function (req, res) {
    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){ //TODO maybe not necessary
        return;
    }

    const credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password
    const cryptoSymbol:String = req.body.symbol 
    const cryptoQuantity:number = req.body.quantity
    const isBuy:boolean = req.body.isBuy                        //refers to buying Altcoin i.e. BTC to Altcoin
    const executionPrice:number = req.body.executionPrice
    User.findOne({username: credentialsArray[0],password: credentialsArray[1]}).then(user => {
        if(user != null){
            UserAccount.findOne({userId: user.id}).then(account =>{
                if(account != null){
                    userHasFunds(account.wallet, cryptoSymbol,cryptoQuantity,isBuy).then(hasFundsForOrder =>{
                        if(hasFundsForOrder){
                            placeLimitOrder(user.id,account.wallet, cryptoSymbol,cryptoQuantity,isBuy,executionPrice)
                            res.send( {isSuccessful: true,
                                        message: "Success!"})
                        } else{
                            res.send({isSuccessful: false,
                                message: "Not enough funds"})
                        }
                    })
                }
            })
        }

    })

})

//@desc     cancel limit order
//@route    GET /user/placeLimitOrder
//req has cryptosymbol, cryptoquantity, isbuy, execution price 
router.post('/cancelLimitOrder', function (req, res) {
    //either use all the same info written above or use given id 
    //then remove the limit order and then remove the locked quantity

})



//@desc     cancel limit order
//@route    GET /user/opentrades
//req has userauthorisation
router.get('/opentrades', function (req, res) {

    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){ //TODO maybe not necessary
        return;
    }

    let credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password
    
    User.findOne({username: credentialsArray[0],password: credentialsArray[1]}).then(user => {
        if(user != null){
            UserActiveOrders.findOne({userId: user.id}).then(activeOrders =>{
                if(activeOrders != null){
                    res.send(activeOrders.activeOrders)
                }
            })
        } else{
            //TODO SEND Something if User not found.
        }
    })



})










function placeLimitOrder(userId: Schema.Types.ObjectId, userWallet: [WalletItem], altcoinOrderSymbol: String, altcoinOrderQuantity:number,isBuy:Boolean,executionPrice:number){
    //if is buy then lock btc and add to active orders
    //if it is not buy then lock altcoin and add to active order. 
    const userAltcoinBalance:number = getWalletItemQuantity(userWallet,altcoinOrderSymbol)
    const userBTCBalance:number = getBTCFunds(userWallet)    
    console.log("executing order")

     //= getAltcoinValueInBTC(altcoinOrderSymbol,altcoinOrderQuantity)
    getAltcoinPriceInBTC(altcoinOrderSymbol).then(altcoinPrice => {
        const altcoinOrderValueInBTC = altcoinPrice * altcoinOrderQuantity
          
        if(isBuy){
            //Update BTC balance
            const newBTCBalance = userBTCBalance - altcoinOrderValueInBTC
            console.log("isBuy = true, new BTCBALANCE: " + newBTCBalance)
            UserAccount.updateOne({userId: userId, "wallet.symbol": BTC}, {"$set": {'wallet.$.quantity': newBTCBalance, 'wallet.$.lockedQuantity': altcoinOrderValueInBTC}})
                //TPDP IF ERROR THEN...RETURN WHAT MESSAGE MAYBE?
            //Update Altcoin balance
        } else{
            const newAltcoinBalance = userAltcoinBalance - altcoinOrderQuantity
            UserAccount.updateOne({
                "userId": userId, "wallet.symbol": altcoinOrderSymbol},
                {"$set": {'wallet.$.quantity': newAltcoinBalance,'wallet.$.lockedQuantity': altcoinOrderQuantity}})
        }

        const currency:Currency = {symbol: altcoinOrderSymbol, quantity: altcoinOrderQuantity}

        const activeOrder :ActiveOrder = {orderType:orderType.Limit, isBuy:isBuy, currency:currency, executionPrice: executionPrice}
        UserActiveOrders.updateOne({
            "userId": userId}, {"$push": {'activeOrders': activeOrder}})
    })


}




async function userHasFunds(wallet:[WalletItem], altcoinOrderSymbol: String, altcoinOrderQuantity:number,isBuy:Boolean): Promise<Boolean>{
    if(isBuy){      //if true then converting BTC to altcoin, therefore check enough BTC for altcoin total value
            const altcoinPrice = await getAltcoinPriceInBTC(altcoinOrderSymbol)
            const orderValue  = altcoinPrice * altcoinOrderQuantity
            const userBTCFunds = getBTCFunds(wallet)
            console.log("orderValue: " + orderValue)
            console.log("btcfunds: "+ userBTCFunds)
            console.log("Method Name: userHasFunds, isBuy = true, returning if enough BTC funds")
            return (userBTCFunds - orderValue >= 0) ?  true :  false
     } else{
        for (var i = 0; i < wallet.length; i++) {
            if(wallet[i].symbol == altcoinOrderSymbol){
                console.log("Method Name: userHasFunds, isBuy = false, returning if enough Altcoin funds")
                return (wallet[i].quantity >= altcoinOrderQuantity) ? true: false
            }
        }
        console.log("Method Name: userHasFunds, isBuy = false, returning since altcoin not found")
    }
    return false
}

function executeOrder(userId: Schema.Types.ObjectId, userWallet: [WalletItem], altcoinOrderSymbol: String, altcoinOrderQuantity:number,isBuy:Boolean){
    //Retrieves the current balance before carrying out transaction
    const userAltcoinBalance:number = getWalletItemQuantity(userWallet,altcoinOrderSymbol)
    const userBTCBalance:number = getBTCFunds(userWallet)    
    console.log("yes executing order")

     //= getAltcoinValueInBTC(altcoinOrderSymbol,altcoinOrderQuantity)
    getAltcoinPriceInBTC(altcoinOrderSymbol).then(altcoinPrice => {

        const altcoinValueInBTC = altcoinPrice * altcoinOrderQuantity
        let newBTCBalance:number 
        let newAltcoinBalance:number
    
        if(isBuy){  //converting BTC to altcoin
            newBTCBalance = userBTCBalance - altcoinValueInBTC
            newAltcoinBalance = userAltcoinBalance + altcoinOrderQuantity
            //TODO CHECK IF ANY VALUE IS NEG IF SO RETURN RESPONSE SAYING UNSUCCESSFUL AND ERRO MESSAGE AND RETURN
        } else{ //converting altcoin to BTC
            newBTCBalance = userBTCBalance + altcoinValueInBTC     
            newAltcoinBalance = userAltcoinBalance - altcoinOrderQuantity
            //TODO CHECK IF ANY VALUE IS NEG IF SO RETURN RESPONSE SAYING UNSUCCESSFUL AND ERRO MESSAGE AND RETURN
        }

        //Update BTC quantity in wallet
        UserAccount.updateOne({userId: userId, "wallet.symbol": BTC}, {"$set": {'wallet.$.quantity': newBTCBalance}})
         //TPDP IF ERROR THEN...RETURN WHAT MESSAGE MAYBE?
    
        //Update altcoin quantity in wallet

            //Altcoin doesn't exist in the wallet
            if(userAltcoinBalance == 0){
                const walletItem:WalletItem = {symbol: altcoinOrderSymbol, quantity:altcoinOrderQuantity, lockedQuantity:0}
                UserAccount.updateOne({
                    "userId": userId},
                    {"$push": {'wallet': walletItem }})
            } else{
                UserAccount.updateOne({
                    "userId": userId, "wallet.symbol": altcoinOrderSymbol},
                    {"$set": {'wallet.$.quantity': newAltcoinBalance }})
            }        
    })
    
}


function updateTradingHistory(userId: Schema.Types.ObjectId, altcoinOrderSymbol: String, altcoinOrderQuantity:number,isBuy:boolean){

    const altcoinOrder:CryptoEquity = {symbol: altcoinOrderSymbol, quantity: altcoinOrderQuantity}  
    const executedOrder: ExecutedOrder = {cryptoEquity : altcoinOrder, isBuy: isBuy}
    UserAccount.update(
        {"userId": userId}, 
        {$push: {"executedOrders":  executedOrder}},
        {upsert: true, new : true})
    console.log("Method Name: updateTradingHistory")
}

const BTC = "BTC"   //base currency, conversion always happens as BTC <-> Altcoin

function getBTCFunds(wallet: [WalletItem]): number{
    for (var i = 0; i < wallet.length; i++) {
        if(wallet[i].symbol == BTC){
            console.log("Method getBTCfUNDS: returning FUNDS: " + wallet[i].quantity)
            return wallet[i].quantity
        }
    }
    console.log("Method getBTCfUNDS: returning funds: 0")
    return 0
}   


function getWalletItemQuantity(wallet: [WalletItem], cryptoSymbol:String): number{
    let quantity = 0
    for (var i = 0; i < wallet.length; i++) {
        if(wallet[i].symbol == cryptoSymbol){
             quantity += wallet[i].quantity
             console.log("Method getWalletITemQuantity: returning quantity: " + quantity)
             return quantity
        }
    }
    console.log("Method getWalletITemQuantity: returning quantity: " + quantity)
    return quantity
}


async function getAltcoinPriceInBTC(cryptoSymbol:String): Promise<number>{
    const baseurl: string = 'https://api.binance.com/api/v1/ticker/price?symbol=';
    const symbol = cryptoSymbol + BTC
    const url = baseurl + symbol

    let price = await axios.get(url).then(response => { 
        console.log(symbol + " price: " + response.data.price) 
        return response.data.price * 1
        //return price != undefined ? price :1    
        }).catch(err=>{
            console.log(err)
        })

    if(price != undefined){
        return price
    } return -1 
}

//@desc     adds crypto to wallet 
//@route    GET /user/placeLimitOrder
//req has cryptosymbol, cryptoquantity, isbuy, execution price 
router.get('/coin_price/:symbol', function (req, res) {
    //either use all the same info written above or use given id 
    //then remove the limit order and then remove the locked quantity
    console.log(req.params.symbol)

    getAltcoinPriceInBTC(req.params.symbol).then(value=>{
        if(value != -1){
            res.send({
                isSuccessful: true,
                message: value.toString()
            })
        }
        else(
            res.send({
                isSuccessful: false,
                message: value.toString()
            })
        )
    })

})








//@desc     adds crypto to wallet 
//@route    GET /user/wallet/addCrypto
//req has crypto to add so, json with symbol and quantity
router.post('/wallet/addCrypto', function (req, res) {
    //adds crypto to user's wallet

    console.log("adding new crypto")
    res.contentType('application/json')

    if(invalidAuthHeader(req,res)){ //TODO maybe not necessary
        return;
    }
    
    let done = function(err:any, result:any){
        console.log("err:" + err)
        console.log("result: " + result)
    }


    let credentialsArray = parseAuthorisationHeader(req)     //credentials[0] is username, credentials[1] is password
    console.log(req.body)
    let cryptoSymbol:String = req.body.symbol 
    let cryptoQuantity:number = req.body.quantity

    console.log("user and password: " + credentialsArray.toString())
    console.log("crypto symbol and quantity: " + cryptoSymbol + " : " + cryptoQuantity)

    User.findOne({username: credentialsArray[0],password: credentialsArray[1]}).then(user => {       
        if(user != null){
            console.log("not null user yay")
            //check if they have the crypto already, if so then increase quantity otherwise 
            //TODO REQUEST BODY AMOUNT TO ADD. 

            UserAccount.updateOne({userId: user.id, "wallet.symbol": "BTC"}, {"$set": {'wallet.$.quantity': 1}},
                // function(err,doc) {
                //     console.log("BTC is added")
                //     console.log(err)
                //     //TPDP IF ERROR THEN...RETURN WHAT MESSAGE MAYBE?
                // }
                )

                /*

            UserAccount.findOne({userId: user.id}).then(userAccount =>{
                if(userAccount != null){

            
                    

                    if(userHasCrypto(userAccount.wallet, cryptoSymbol)){ //if true then increases quantity of crypto
                        console.log("has crypto already")
                        let quantity = getWalletItemQuantity(userAccount.wallet, cryptoSymbol) + cryptoQuantity
                        console.log("new quantity " + quantity)
                        Wallet.update({"userId": user._id, "wallet.symbol": cryptoSymbol}, {"$set": {'wallet.$.quantity': quantity}},
                        function(err,doc) {
                            console.log(err)
                        })
                    } else{
                        console.log("add brand new crypto to user")
                        var walletItem:WalletItem = {symbol: cryptoSymbol, quantity:cryptoQuantity}
                        console.log("wallet item: " + walletItem.symbol)
                        console.log(!(!Wallet.exists({"userId": user._id})))

                        Wallet.update(
                            { "userId": user._id }, 
                            { $push: { "wallet": walletItem}},
                            {safe: true, upsert: true, new : true},
                            function(err, model) {
                                console.log(err)
                            }
                        );                    //push on to array
                    }
                }
            })
            */
        }
    })

})
    
    /*
    const p = new Wallet({
        userId: '1',
        wallet: [{"id": 2, "symbol": "XVG", "quantity": 1.3}]
    })
    console.log("yese")
    p.save().then(data =>{
        res.json(data)
    }).catch(err=>{
        res.json({message: err})
    })
    
    
*/

/*
//iterate through wallet to see if user has 
function userHasCrypto(wallet: [WalletItem], cryptoSymbol:String): Boolean{
    for (var i = 0; i < wallet.length; i++) {
        if(wallet[i].symbol == cryptoSymbol){
            return true
        }
    }
    return false
}
*/

// user places limit order
/***
 * route: /placeLimitOrder
 * res.body: isbuy, symbol, issell
 * //check user has balance, therefore check user has symbol and quantity, if so execute order and response ok, or not
 *  
 */

 //user places market order
 /***
  * route: /placeMarketOrder
    * res.body: isbuy, symbol, issell
    * //check user has balance, therefore check user has symbol and quantity, if so execute order and response ok, or not
  * 
  * */
  

//when user logins, retrieve and send entire thing


export {router as userRoutes}