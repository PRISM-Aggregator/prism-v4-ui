import {
  makeApiRequest,
  parseResolution,
} from './helpers.js'
import { subscribeOnStream, unsubscribeFromStream } from './streaming.js'
import store from '@/redux/store.js';

const lastBarsCache = new Map()

const configurationData = {
  supported_resolutions: ['1', '3', '5', '15', '30', '60', '120', '240', '1D', '1W'],
  intraday_multipliers: ['1', '3', '5', '15', '30', '60', '120', '240'],
  exchanges: [],
}

export async function getAllSymbols() {
  const state = store.getState();
  const storage = state.storage; // Assuming contextData is the part of the state you want to fetch

  const _tokenlist = storage.tokenList
  // console.log("[datafeed] tokenlist", _tokenlist)

  if(_tokenlist)
    return _tokenlist

  // if tokenlist is not set when getAllSymbols is called, wait for it to be set

  console.log("[datafeed] tokenlist not retrieved yet, waiting for it to be set")
  return new Promise((resolve, reject) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const tokenList = state.storage.tokenList;

      if (tokenList) {
        console.log("[useMarket] [waitForTokenList] done");
        unsubscribe(); // Unsubscribe to avoid memory leaks
        resolve(tokenList);
      }
    });
  
    // Set a timeout to reject the promise if it takes too long
    setTimeout(() => {
      unsubscribe(); // Corrected unsubscribe call
      reject(new Error('Timeout waiting for TokenList'));
    }, 10000); // Timeout after 30 seconds, for example
  })  
}

export default {
  onReady: (callback) => {
    // console.log('[onReady]: Method call')
    setTimeout(() => callback(configurationData))
  },

  searchSymbols: async (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback
  ) => {},

  resolveSymbol: async (
    symbolAddress,
    onSymbolResolvedCallback,
    onResolveErrorCallback,
    extension
  ) => {
    // console.log('[resolveSymbol]: Method call', symbolAddress)
    const symbols = await getAllSymbols()
    let symbolItem = symbols.find((item) => item.address === symbolAddress)

    if (!symbolItem) {
      console.log('[resolveSymbol]: Cannot resolve symbol', symbolAddress)
      // onResolveErrorCallback('cannot resolve symbol')
      // return
      symbolItem = {
        address: symbolAddress,
        symbol: symbolAddress,
        name: symbolAddress,
      }
    }

    const symbolInfo = {
      address: symbolItem.address,
      ticker: symbolItem.address,
      name: symbolItem.symbol,
      description: symbolItem.symbol + '/USD',
      type: symbolItem.type,
      session: '24x7',
      timezone: 'Etc/UTC',
      minmov: 0.00000001,
      pricescale: 1,
      has_intraday: true,
      has_no_volume: false,
      has_weekly_and_monthly: false,
      supported_resolutions: configurationData.supported_resolutions,
      intraday_multipliers: configurationData.intraday_multipliers,
      volume_precision: 4,
      data_status: 'streaming',
    }

    // console.log('[resolveSymbol]: Symbol resolved', symbolAddress)
    onSymbolResolvedCallback(symbolInfo)
  },

  getBars: async (
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback
  ) => {
    const { from, to, firstDataRequest } = periodParams
    console.log('[getBars]: Method call', symbolInfo, resolution, from, to)
    const urlParameters = {
      address: symbolInfo.address,
      type: parseResolution(resolution),
      time_from: from,
      time_to: to,
    }
    const query = Object.keys(urlParameters)
      .map((name) => `${name}=${encodeURIComponent(urlParameters[name])}`)
      .join('&')
    try {
      const data = await makeApiRequest(`defi/ohlcv?${query}`)
      if (!data.success || data.data.items.length === 0) {
        // "noData" should be set if there is no data in the requested period.
        onHistoryCallback([], {
          noData: true,
        })
        return
      }
      let bars = []
      data.data.items.forEach((bar) => {
        if (bar.unixTime >= from && bar.unixTime < to) {
          bars = [
            ...bars,
            {
              time: bar.unixTime * 1000,
              low: bar.l,
              high: bar.h,
              open: bar.o,
              close: bar.c,
              volume: bar.v
            },
          ]
        }
      })
      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.address, {
          ...bars[bars.length - 1],
        })
      }
      // console.log(`[getBars]: returned ${bars.length} bar(s)`)
      onHistoryCallback(bars, {
        noData: false,
      })
    } catch (error) {
      console.log('[getBars]: Get error', error)
      onErrorCallback(error)
    }
  },

  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback
  ) => {
    console.log(
      '[subscribeBars]: Method call with subscriberUID:',
      subscriberUID
    )
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.address)
    )
  },

  unsubscribeBars: () => {
    console.log('[unsubscribeBars]')
    unsubscribeFromStream()
  },
}