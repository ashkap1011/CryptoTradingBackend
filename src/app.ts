/**
 * Required External Modules
 */
import express from "express";
import path from "path"
import cors from "cors";
import helmet from "helmet";
import * as dotenv from "dotenv";
import * as pug from 'pug';
import {connectDB} from './config/db';
import {userRoutes} from './routes/user'
import {router} from './routes/index'
import {getMarketData} from './marketdata'


//Commented out as it uses too much £ in VM, controls sockets for ticker data and market feed charts

/*
var app2 = require('express')();
var http = require('http').createServer(app2);
var io = require('socket.io')(http);

// app2.use(cors());

app2.get('/', (req:any, res:any) => {
  res.send('<script src="/socket.io/socket.io.js"></script><script>var socket = io(); socket.on(\'someevent\', function(msg){console.log(msg)})</script>');
});

io.on('connection', (sockets:any) => {
  console.log('a user connected');
});


var WebSocket = require('ws');

let socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_5m")

socket.onmessage = (event: { data: string; }) => {
  var json = JSON.parse(event.data)

  getMarketData().then(marketData =>{
    console.log("MARKETDATA----------" + marketData[1].price.toString())
    io.emit('marketdata', marketData);
  })
  
            
  // This will emit the event to all connected sockets
  //io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' })
  
  //check data
  //console.log(JSON.parse(event.data));
}

*/

/**
 * Load Config
 */

dotenv.config({path: __dirname+ '/config/.env'});

connectDB()

if (!process.env.PORT) {
    process.exit(1);
 }
 
 const PORT: number = parseInt(process.env.PORT as string, 10);
 const app = express();

/**
 *  App Configuration
 */

//maybe add helmet
app.use(cors());
app.use(express.json());
app.set('view engine', 'pug');

//Static folder
app.use(express.static(path.join(__dirname + '/public')));

//Views folder
app.set('views',path.join(__dirname + '/views'))

/**
 * Server Activation
 */
const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });

//Routes
app.use('/', router)
app.use('/user',userRoutes)






