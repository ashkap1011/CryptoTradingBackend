import express from "express"
const router = express.Router()

//need to authenticate

//@desc          
//@route    GET /user
router.get('/', function (req, res) {
    res.send('ji')
})





export {router as userRoutes}