import express from "express"


const router = express.Router()

router.get('/marketChart/:tradingPair', (req, res) => {
    const pair = {pair: req.params.tradingPair};
    res.render('marketchart', { tradingPair: JSON.stringify(pair)})
})

router.get('/', (req, res) =>{
    res.render('index')
})



//routes for getting data of trades    






export {router}