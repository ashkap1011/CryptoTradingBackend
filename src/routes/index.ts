import express from "express"

const router = express.Router()

router.get('/', function (req, res) {
    res.render('index', { title: 'Hey', message: 'Hello there!' })
})




//routes for getting data of trades    






export {router}