import { parseResolution, getNextBarTime } from './helpers.js'

let subscriptionItem = {}

let subscribedAddress = "So11111111111111111111111111111111111111112";

// Create WebSocket connection.
const socket = new WebSocket(
  `wss://public-api.birdeye.so/socket?x-api-key=${process.env.NEXT_PUBLIC_CANDLESTICK_API_KEY}`,
  'echo-protocol'
)

// Connection opened
socket.addEventListener('open', (event) => {
  console.log('[socket] Connected')
})

// Listen for messages
socket.addEventListener('message', (msg) => {
  const data = JSON.parse(msg.data)
  if (data.type !== 'PRICE_DATA') return console.log(data)
  //console.log("[streaming] update ", data.data.address, subscribedAddress);

  if(data.data.address && data.data.address !== subscribedAddress) return console.log("[streaming] skip: slip");
  
  const currTime = data.data.unixTime * 1000
  const lastBar = subscriptionItem.lastBar
  const resolution = subscriptionItem.resolution
  const nextBarTime = getNextBarTime(lastBar, resolution)

  let bar

  if (currTime >= nextBarTime) {
    bar = {
      time: nextBarTime,
      open: data.data.o,
      high: data.data.h,
      low: data.data.l,
      close: data.data.c,
      volume: data.data.v,
    }
    console.log('[socket] Generate new bar')
  } else {
    bar = {
      ...lastBar,
      high: Math.max(lastBar.high, data.data.h),
      low: Math.min(lastBar.low, data.data.l),
      close: data.data.c,
      volume: data.data.v,
    }
    console.log('[socket] Update the latest bar by price')
  }

  subscriptionItem.lastBar = bar
  subscriptionItem.callback(bar)
})

export function subscribeOnStream(
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback,
  lastBar
) {
  subscriptionItem = {
    resolution,
    lastBar,
    callback: onRealtimeCallback,
  }

  const msg = {
    type: 'SUBSCRIBE_PRICE',
    data: {
      chartType: parseResolution(resolution),
      address: symbolInfo.address,
      currency: 'usd',
    },
  }
  subscribedAddress = symbolInfo.address;
  
  if(socket.readyState === socket.OPEN) {
    console.log("[socket] open");
    socket.send(JSON.stringify({type: 'UNSUBSCRIBE_PRICE'}))
    socket.send(JSON.stringify(msg))
  } else if(socket.readyState === socket.CONNECTING) {
    console.log("[socket] connecting");
    let _listener = socket.addEventListener('open', (event) => {
      console.log("[socket] open");
      socket.send(JSON.stringify({type: 'UNSUBSCRIBE_PRICE'}))
      socket.send(JSON.stringify(msg))
      socket.removeEventListener('open', _listener);
    });
  }
  
}

export function unsubscribeFromStream() {
  // const msg = {
  //   type: 'UNSUBSCRIBE_PRICE',
  // }
  // socket.send(JSON.stringify({type: 'UNSUBSCRIBE_PRICE'}))
  // socket.send(JSON.stringify(msg))
}