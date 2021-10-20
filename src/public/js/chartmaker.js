
//Step 1: Define chart properties.
//Step 2: Create the chart with defined properties and bind it to the DOM element.
//Step 3: Add the CandleStick Series.
//Step 4: Set the data and render.
//Step5 : Plug the socket to the chart


const log = console.log;

var URLPair = tradingPair.pair
// console.log(URLPair)

const chartProperties = {
  height:600,
  timeScale:{
    timeVisible:true,
    secondsVisible:false,
  },


}

const domElement = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(domElement,chartProperties);
const candleSeries = chart.addCandlestickSeries();

candleSeries.applyOptions({

  priceFormat: {
    type: 'volume',
    precision: 9,
    minMove: 0.00000005
  }

})

//creates history
fetch('https://api.binance.com/api/v3/klines?symbol=' + URLPair.toUpperCase() + '&interval=5m&limit=1000')
  .then(res => res.json())
  .then(data => {
    const cdata = data.map(d => {
      return {time:d[0]/1000,open:parseFloat(d[1]),high:parseFloat(d[2]),low:parseFloat(d[3]),close:parseFloat(d[4])}
    });
    candleSeries.setData(cdata);
  })
  .catch(err => log(err))


  //Dynamic Chart
  let socket = new WebSocket('wss://stream.binance.com:9443/ws/'+ URLPair.toLowerCase() +'@kline_5m')
  socket.onmessage = (event) => {
    console.log(JSON.parse(event.data));
    const sd = JSON.parse(event.data) //sd = socketData
    const parsedData = {time:Math.round(sd.k.t/1000),open:parseFloat(sd.k.o),high:parseFloat(sd.k.h),low:parseFloat(sd.k.l),close:parseFloat(sd.k.c)}
    candleSeries.update(parsedData);
  };
  

function pairToURLForm(tradingpair){
  

  return tradingpair.replace("/","")
}

// const log = console.log;

// // var URLPair = pairToURLForm(tradingPair.pair)
// // console.log(URLPair)

// const chartProperties = {
//   height:600,
//   timeScale:{
//     timeVisible:true,
//     secondsVisible:false,
//   }
// }

// const domElement = document.getElementById('tvchart');
// const chart = LightweightCharts.createChart(domElement,chartProperties);
// const candleSeries = chart.addCandlestickSeries();

// //creates history
// fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=1000`)
//   .then(res => res.json())
//   .then(data => {
//     const cdata = data.map(d => {
//       return {time:d[0]/1000,open:parseFloat(d[1]),high:parseFloat(d[2]),low:parseFloat(d[3]),close:parseFloat(d[4])}
//     });
//     candleSeries.setData(cdata);
//   })
//   .catch(err => log(err))


//   //Dynamic Chart
//   let socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_5m")
//   socket.onmessage = (event) => {
//     console.log(JSON.parse(event.data));
//     const sd = JSON.parse(event.data) //sd = socketData
//     const parsedData = {time:Math.round(sd.k.t/1000),open:parseFloat(sd.k.o),high:parseFloat(sd.k.h),low:parseFloat(sd.k.l),close:parseFloat(sd.k.c)}
//     candleSeries.update(parsedData);
//   };
  

// function pairToURLForm(tradingpair){
  

//   return tradingpair.replace("/","")
// }

