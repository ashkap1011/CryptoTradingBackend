import express from "express"
import { runInNewContext } from "vm"
import User from "../models/User"
import Wallet, { WalletItem } from "../models/Wallet"
import { addListener } from "process"
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
    console.log("unique signup bro")
    let newRegistration = new User({
                username: username,
                password: password
            })

    newRegistration.save().then(newUser =>{
    instantiateWallet(newUser._id)
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
function instantiateWallet(userId:String){
        const wallet = new Wallet({
            userId: userId,
            wallet: [{ "symbol": "XVG", "quantity": 1.5}]
        })
        wallet.save()
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
            Wallet.findOne({userId: user.id}).then(userAccount =>{
                if(userAccount != null){
                    res.send(userAccount.wallet)
                }

            })
        }
    })
        
    //res.send([{"id": 2, "symbol": "XVG", "quantity": 1.3},{"id": 2, "symbol": "XVG", "quantity": 1.3}])
})


function getUserId(){

}

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
    console.log("crypto symbol and password: " + cryptoSymbol + " : " + cryptoQuantity)

    User.findOne({username: credentialsArray[0],password: credentialsArray[1]}).then(user => {       
        if(user != null){
            console.log("not null user yay")
            //check if they have the crypto already, if so then increase quantity otherwise 
            Wallet.findOne({userId: user.id}).then(userAccount =>{
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
        }
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
})

//iterate through wallet to see if user has 
function userHasCrypto(wallet: [WalletItem], cryptoSymbol:String): Boolean{
    for (var i = 0; i < wallet.length; i++) {
        if(wallet[i].symbol == cryptoSymbol){
            return true
        }
    }
    return false
}

function getWalletItemQuantity(wallet: [WalletItem], cryptoSymbol:String): number{
    let quantity = 0
    for (var i = 0; i < wallet.length; i++) {
        if(wallet[i].symbol == cryptoSymbol){
             quantity += wallet[i].quantity
             return quantity
        }
    }
    return quantity
}


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
  */
















export {router as userRoutes}