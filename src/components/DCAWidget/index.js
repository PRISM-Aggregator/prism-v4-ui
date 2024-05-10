import "./DCAWidget.module.scss";
import { CalendarIcon, ChevronDownIcon,ChevronUpIcon, ChevronRightIcon, DropdownMenuIcon, ArrowRightIcon, Cross1Icon } from "@radix-ui/react-icons";
import SwapIcon from "/public/assets/icons/swap.svg";
import { SOL_TOKEN, ToastMaker, USDC_TOKEN, formatNumber } from "@/utils/utils";
import {useEffect, useState} from "react";
import { format, formatDistance, formatDistanceStrict, formatDuration, interval } from "date-fns";
import { TokenSearchPopup } from "@/components/TokenSearchPopup";
import { DCA, getPrice } from "@prism-hq/prism-dca";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { useDispatch, useSelector } from "react-redux";
import SolscanImage from "/public/assets/icons/solscan.webp";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "../ui/button";
import Link from "next/link";
import { DCAHistoryPopup } from "../dca-history-popup";
import toast, { LoaderIcon } from "react-hot-toast";
import { FeeTiersPopup } from "../fee-tiers-popup";
import { reloadBalances } from "@/redux/state";
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { TimePicker } from "../time-picker";
const TVChartContainer = dynamic(
	() => import('@/components/TVChartContainer').then(mod => mod.TVChartContainer),
	{ ssr: false }
);

export function TokenImage(state, mint) {
  // if (state.tokenList)
  let logoURI = undefined;
  if (state.tokenList)
  logoURI = state.tokenList.find((token) => token.address === mint).logoURI;
  return <img width={24} className="borderCircle" height={24} src={logoURI ? logoURI : "https://i.imgur.com/WRxAdjU.png"} alt="logo" />;
}
export function TokenInfo(state, mint) {
  // if (state.tokenList)
  let token = undefined;
  if (state.tokenList)
    token = state.tokenList.find((token) => token.address === mint);
  return token;
}

function secondsToDhms(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  
  var dDisplay = d > 0 ? d + (d == 1 ? " day " : " days ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour " : " hours ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute " : " minutes ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
  }

export const DCAWidget = ({
  
}) => {
  const state = useSelector((state) => state.storage);
  const dispatch = useDispatch();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [dca, setDca] = useState(null);
  const [dcas, setDcas] = useState([]);
  const [history, setHistory] = useState({});
  const [updateAccounts, setUpdateAccounts] = useState(true);
  const [timePickerOpened, setTimePickerOpened] = useState(false);
  const [from, setFrom] = useState(USDC_TOKEN);
  const [fromBalance, setFromBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);


  const [to, setTo] = useState(SOL_TOKEN);
  const [price, setPrice] = useState(0);
  const [tokenSearchPopup, setTokenSearchPopup] = useState(-1); // 0 -> base, 1 -> quote
  const [historyPopup, setHistoryPopup] = useState(null);
  const [orderState, setOrderState] = useState(0); // 0 - Loading sdk, 1 - Ready, 2 - Order in Progress

  const [totalTime, setTotalTime] = useState("");
  const [currentDate, setCurrentDate] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [frequency, setFrequency] = useState(0);
  const [interval, setInterval] = useState(1);
  const [timeframe, setTimeframe] = useState(1);
  const [cycles, setCycles] = useState(10);
  const [showPriceSettings, setShowPriceSettings] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [chainMinPrice, setChainMinPrice] = useState(1);
  const [chainMaxPrice, setChainMaxPrice] = useState(999999999999999999999999999999);
  const [feeTiers, setFeeTiers] = useState([
    {amount: 4999, fee: 0.1},
    {amount: 5000, fee: 0.08},
    {amount: 20000, fee: 0.06},
    {amount: 35000, fee: 0.04},
    {amount: 50000, fee: 0.02},
    {amount: 100000, fee: 0}
  ]);
  const [stakedPrism, setStakedPrism] = useState(0);
  const [feePopup, setFeePopup] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date().getTime());
  }, []);
  
  useEffect(() => {
    if (wallet && wallet.connected)
        DCA.init(connection,
          wallet,
          process.env.NEXT_PUBLIC_CANDLESTICK_API_KEY,
          undefined,
          0.005*10**9,
        ).catch((e) => console.error(e)).then(dca => {
          setDca(dca);
          setOrderState(1);
          let tvl = 0;
          dca.stakingAccounts.map((stakingAcc, i) => {
            tvl += stakingAcc.state.weightedTvl.toNumber() / 10**6;
          })
          setStakedPrism(tvl)
          console.log("dca stake",tvl)
          console.log('dca', dca)
        })
  }, [wallet.connected])
  
  useEffect(() => {
    if(state.accounts && from) {
      state.accounts.map(acc => {
        if(acc.address === from.address) {
          setFromBalance(acc.balance);
        }
      })
    }
  }, [from, state.accounts]);

  useEffect(() => {
    if (dca && from && to) {
      getPrice(
        new PublicKey(from.address),
        new PublicKey(to.address),
        process.env.NEXT_PUBLIC_CANDLESTICK_API_KEY
      ).then(price => setPrice(price))
    }
  }, [dca, from, to])

  useEffect(() => {
    if (dca && updateAccounts) {
      setUpdateAccounts(false);
      setDcas(dca.getDcas().sort((a, b) => b.state.remainingOrders.toNumber() - a.state.remainingOrders.toNumber()));
      dca.loadHistory().then(history => setHistory(history))
    }
  }, [dca, updateAccounts])
  
  
  const switchSide = () => {
    setFrom(to);
    setTo(from);
  }

  const selectToken = (token) => { // switch to token from search popup
    if(tokenSearchPopup === 0) { // 0 = from token, 1 = to token
      setFrom(token);
    } else {
      setTo(token);
    }
    setTokenSearchPopup(-1);
  }

  const adjustFrequency = (interval, timeframe, si) => {
    let frequency = 0;
    if (timeframe == 0) frequency = interval * 60;
    if (timeframe == 1) frequency = interval * 60 * 60;
    if (timeframe == 2) frequency = interval * 25 * 60 * 60;
    if (timeframe == 3) frequency = interval * 7 * 24 * 60 * 60;
    if (si) setInterval(interval); else setTimeframe(timeframe);
    setFrequency(frequency)
  }

  const adjustMinPrice = (minPrice) => {
    setMinPrice(minPrice)
    setChainMinPrice(minPrice * 10 ** from.decimals / 10 ** to.decimals * 1_000_000_000_000_000_000);
  }

  const adjustMaxPrice = (maxPrice) => {
    setMaxPrice(maxPrice)
    setChainMaxPrice(maxPrice * 10 ** from.decimals / 10 ** to.decimals * 1_000_000_000_000_000_000);
  }

  const update = () => {
    setRefreshing(true);
    new Promise(resolve => setTimeout(resolve, 2000)).then(() => {
      dca.update().then(() => {
        setUpdateAccounts(true);
        setRefreshing(false);
      })
    })
  }

  const startDca = () => {
    if(fromAmount < 0.01 || cycles < 1 || cycles > 50000 || frequency < 60 || frequency > 60 * 60 * 24 * 7 || minPrice < 0 || maxPrice < 0) {
      toast.error(<div className="flex flex-col">
        <p className="text-md font-bold">Invalid DCA settings</p>
        <p className="text-xs text-muted-foreground">Please check your settings and try again</p>
      </div>,{id:1});
      return;
    }

    toast.loading(
      <div className="flex flex-col">
        <p className="text-md font-bold">Creating DCA Order</p>
        <p className="text-xs text-muted-foreground">Please wait...</p>
      </div>,
      {id:1}
    );
    setOrderState(2);
    dca.setPriorityFee(state.priorityFee * 10**9);
    dca.createUserState(
      fromAmount,
      cycles,
      frequency,
      minPrice == "" ? 1/10**9 : minPrice,
      maxPrice == "" ? 10**9 : maxPrice,
      new PublicKey(from.address),
      new PublicKey(to.address),
      0,
      0
    ).catch(e => {
      if(e.toString().indexOf("TransactionExpiredTimeoutError") !== -1) {
        toast.error(<div className="flex flex-col">
          <p className="text-md font-bold">Order Expired</p>
          <p className="text-xs text-muted-foreground">
            Your transaction wasn't confirmed in 30 seconds. Try increasing priority fee.
          </p>
        </div>, {id:1});
        setTimeout(() => dispatch(reloadBalances()), 5000);
      } else {
        console.log('eee',e)
        toast.error(<div className="flex flex-col">
          <p className="text-md font-bold">Order Failed</p>
          <p className="text-xs text-muted-foreground">{e.message.slice(0,120) + e.message.length > 120 ? "..." : ""}</p>
        </div>, {id:1})
      }
      setOrderState(1);
    }).then((tx) => {
      // Do something with tx
      if(tx) {
        console.log("Create Tx:", tx);
        toast.success(<div className="flex flex-col">
          <p className="text-md font-bold">Order Created</p>
          <p className="text-xs text-muted-foreground">DCA order has been created!</p>
        </div>, {id:1})
        setOrderState(1);
        update();
        setTimeout(() => dispatch(reloadBalances()), 5000);
      }
    })
  }

  const closeDca = (dcaState, type=0) => {
    if(type === 0) {
      toast.loading(ToastMaker("Cancelling DCA", "Please approve the transaction"), {id:1})
    } else toast.loading(ToastMaker("Claiming SOL", "Please approve the transaction"), {id:1})

    dca.setPriorityFee(Number(state.priorityFee) * 10**9);
    dca.closeUserState(dcaState).catch(e => {
      // toast.success(ToastMaker("Transaction Rejected", "You rejected the request"), {id:1})
      console.log("User rejected transaction");
      return;
    }).then((tx) => {
      // Do something with tx
      console.log("Close Tx:", tx);
      if(type === 0) toast.success(ToastMaker("Success", "DCA Order Cancelled"), {id:1})
      else toast.success(ToastMaker("Success", "SOL Claimed"), {id:1})
      update();
    })
  }

  const openHistoryPopup = (publicKey, fromToken, toToken) => {
    if(history[publicKey]) {
      setHistoryPopup({
        history: history[publicKey], 
        from: fromToken, 
        to: toToken
      });
    }
  }

  return <div className="w-svw px-2 md:w-full flex flex-col items-center">
    <div className="w-full flex items-start justify-center gap-4">
      <div className="hidden md:flex w-[608px] h-[556px] border rounded-lg overflow-hidden">
        <div className="w-full">
        {
          to &&
            <TVChartContainer
              market={{
                baseMint: new PublicKey(to.address)
              }}
              openOrders={[]}
              currentTheme={"dark"}
              strategyPreview={[]}
          />
        }
        </div>
      </div>
      <div className="w-full md:max-w-[400px] flex flex-col items-center border rounded-lg bg-background-over gap-4 p-2">
        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <p className="text-sm text-muted-foreground">You pay</p>
            <p className="text-sm cursor-pointer text-muted-foreground" onClick={()=>setFromAmount(fromBalance)}>Balance: {fromBalance} {from.symbol}</p>
          </div>
          
          <div className="w-full flex relative items-center p-3 bg-background border rounded-lg">
            <div className="flex items-center absolute gap-2 cursor-pointer hover:border-cyan-500 transition-all hover:shadow-sm border rounded-sm p-2 bg-background-over" onClick={() => setTokenSearchPopup(0)}>
              {
                from ?
                <img className="rounded-full" src={from ? from.logoURI : "https://i.imgur.com/WRxAdjU.png"} width="24px" height="24px"/>
                :
                <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
              }
              {
                from ? 
                <p className="text-sm font-bold">{from.symbol}</p> 
                :
                <div className="skeleton" style={{width:"40px", height:"20px"}}/>
              }
              <ChevronDownIcon/>
            </div>
            <input className="h-12 w-full text-right bg-transparent outline-none text-xl font-bold" value={fromAmount} lang="en" onChange={(e) => setFromAmount(e.target.value)} type="number" placeholder="0.00" inputMode='numeric' pattern="[0-9]*"/>
          </div>
        </div>
        <div className="w-full flex items-center justify-center relative -mt-[6px] -mb-[32px]">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background hover:border-cyan-500 hover:text-cyan-500 transition-all z-10 border cursor-pointer" onClick={() => switchSide()}>
            <SwapIcon className="-rotate-45" width={20} height={20}/>
          </div>
        </div>
        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <p className="text-sm text-muted-foreground">To Receive</p>
          </div>
          <div className="w-full flex shrink-0 items-center justify-center gap-2 cursor-pointer hover:shadow-sm border rounded-sm p-4 hover:border-cyan-500 transition-all bg-background" onClick={() => setTokenSearchPopup(1)}>
            {
              to ?
              <img className="rounded-full" src={to ? to.logoURI : "https://i.imgur.com/WRxAdjU.png"} width="24px" height="24px"/>
              :
              <div className="skeleton" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
            }
            {
              to ? 
              <p className="text-sm font-bold">{to.symbol}</p> 
              :
              <div className="skeleton" style={{width:"40px", height:"20px"}}/>
            }
            <ChevronDownIcon/>
          </div>
        </div>
        <Button onClick={() => setTimePickerOpened(true)} variant={"outline"} className="w-full h-[42px] rounded-sm text-muted-foreground">
          <p className="text-sm">
            { currentDate &&
              (frequency && cycles) ?
                secondsToDhms(frequency * cycles)
              :
              "Total Time (dd:hh:mm:ss)"
            }
          </p>
        </Button>
        <div className="w-full flex flex-col items-center gap-2">
          <div className="w-full h-8 grid items-center grid-cols-6 gap-1">
            <div onClick={() => {
              setCycles(10);
              setFrequency(60);
            }} className={`w-full bg-background cursor-pointer ${(cycles === 10 && frequency === 60) && 'bg-secondary text-white font-bold'} transition-all hover:bg-secondary hover:text-white rounded-sm text-sm text-muted-foreground h-full flex items-center justify-center`}>
              10m
            </div>
            <div onClick={() => {
              setCycles(30);
              setFrequency(60);
            }} className={`w-full bg-background cursor-pointer ${(cycles === 30 && frequency === 60) && 'bg-secondary text-white font-bold'} transition-all hover:bg-secondary hover:text-white rounded-sm text-sm text-muted-foreground h-full flex items-center justify-center`}>
              30m
            </div>
            <div onClick={() => {
              setCycles(60);
              setFrequency(60);
            }} className={`w-full bg-background cursor-pointer ${(cycles === 60 && frequency === 60) && 'bg-secondary text-white font-bold'} transition-all hover:bg-secondary hover:text-white rounded-sm text-sm text-muted-foreground h-full flex items-center justify-center`}>
              1h
            </div>
            <div onClick={() => {
              setCycles(180);
              setFrequency(120);
            }} className={`w-full bg-background cursor-pointer ${(cycles === 180 && frequency === 60*2) && 'bg-secondary text-white font-bold'} transition-all hover:bg-secondary hover:text-white rounded-sm text-sm text-muted-foreground h-full flex items-center justify-center`}>
              6h
            </div>
            <div onClick={() => {
              setCycles(360);
              setFrequency(60*2);
            }} className={`w-full bg-background cursor-pointer ${(cycles === 360 && frequency === 60*2) && 'bg-secondary text-white font-bold'} transition-all hover:bg-secondary hover:text-white rounded-sm text-sm text-muted-foreground h-full flex items-center justify-center`}>
              12h
            </div>
            <div onClick={() => {
              setCycles(360);
              setFrequency(60*4);
            }} className={`w-full bg-background cursor-pointer ${(cycles === 360 && frequency === 60*4) && 'bg-secondary text-white font-bold'} transition-all hover:bg-secondary hover:text-white rounded-sm text-sm text-muted-foreground h-full flex items-center justify-center`}>
              24h
            </div>
          </div>
        </div>
        <div className="w-full flex items-center justify-between cursor-pointer select-none" onClick={() => setShowPriceSettings(!showPriceSettings)}>
            <p className="text-xs text-muted-foreground">Price Settings</p>
            <ChevronDownIcon className={`${showPriceSettings ? 'rotate-180' : 'rotate-0'} transition-all`}/>
        </div>
        {showPriceSettings &&
        <div className="flex items-center w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="w-full flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-sm font-bold">{formatNumber(price,"auto")}</p>
            </div>
            <div className="w-full flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Min Price per {to.symbol}</p>
              <p className="text-sm text-muted-foreground">Max Price {to.symbol}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="w-full flex col-span-1 relative items-center border rounded-sm p-3 bg-background">
                <input className="w-full h-full bg-transparent outline-none text-xl text-left font-bold" placeholder="0.0" type="number" value={minPrice} onChange={(e) => Number(e.target.value) >= 0 && adjustMinPrice(e.target.value)}/>
              </div>
              <div className="w-full flex col-span-1 relative items-center border rounded-sm p-3 bg-background">
                <input className="w-full h-full bg-transparent outline-none text-xl text-right font-bold" placeholder="0.0" type="number" value={maxPrice} onChange={(e) => Number(e.target.value) >= 0 && adjustMaxPrice(e.target.value)}/>
              </div>
            </div>
          </div>
        </div>}
        <div className="w-full flex items-center justify-center relative">
          <hr className="w-full absolute left-0 border-t"/>
          <div className="z-10 bg-background-over flex items-center gap-1 select-none">
            <p className="text-xs font-bold">Order Review</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full">
          {
            (fromAmount > 0 && cycles > 0) &&
            <div className="w-full flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{from.symbol} spent per cycle:</p>
              <p className="text-sm font-bold">{formatNumber(fromAmount / cycles, "auto") + " " + from.symbol}</p>
            </div>
          }
          {
            (chainMaxPrice && maxPrice !== "") ?
            <div className="w-full flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Max Price:</p>
              <div className="flex items-center gap-1">
                <p className="text-sm"> {formatNumber(chainMaxPrice / 10**15, "auto")} </p>
                <img src={from.logoURI} width={20} height={20} alt="logo"/>
              </div>
            </div>
            :
            ""
          }
          <div className="w-full flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Platform Fee:</p>
              {
                stakedPrism > 0 ?
                feeTiers.filter(tier => stakedPrism > tier.amount).length > 0 ?
                <p className="shinyAnimation text-sm font-bold">
                  {
                    feeTiers.filter(tier => stakedPrism > tier.amount)[feeTiers.filter(tier => stakedPrism > tier.amount).length-1].fee + "%"
                  }
                </p>
                  :
                  <p className="text-sm">
                    0.10%
                  </p>
                : 
                <p className="text-sm">
                  0.10%
                </p>
              }
          </div>
          {
            stakedPrism < 100000 &&
            <div onClick={() => setFeePopup(true)} className="w-full cursor-pointer border flex items-center p-2 bg-background rounded-sm justify-center">
              <p className="text-xs font-bold shinyAnimation">PRISM stakers enjoy reduced fees on DCA</p>
              <ChevronRightIcon/>
            </div>
          }
          
          {
            wallet.connected ?
              orderState === 0 ?
              <div className="w-full gap-2 p-4 flex items-center justify-center rounded-lg bg-black text-muted-foreground">
                <LoaderIcon width={32} height={32}/>
                <p className="text-lg font-bold">Initializing DCA</p>
              </div>
              :
              orderState === 1 ?
                fromAmount > 0 ?
                  fromAmount <= fromBalance ?
                  <div className="cursor-pointer w-full gap-1 p-4 flex items-center justify-center rounded-lg bg-cyan-500 hover:bg-cyan-600 text-black" onClick={() => startDca()}>
                    <p className="text-lg font-bold">Start DCA</p>
                  </div>
                  :
                  <div className="w-full gap-2 p-4 flex items-center justify-center rounded-lg bg-black text-muted-foreground">
                    <p className="text-lg font-bold">Not enough balance</p>
                  </div>
                :
                <div className="w-full gap-2 p-4 flex items-center justify-center rounded-lg bg-black text-muted-foreground">
                  <p className="text-lg font-bold">Enter Amount</p>
                </div>
              :
              <div className="w-full gap-2 p-4 flex items-center justify-center rounded-lg bg-black text-muted-foreground">
                <LoaderIcon width={32} height={32}/>
                <p className="text-lg font-bold">Creating Order</p>
              </div>
            :
            <div className="w-full gap-2 p-4 flex items-center justify-center rounded-lg bg-black text-muted-foreground">
              <p className="text-lg font-bold">Connect Wallet to Begin</p>
            </div>
          }
        </div>
      </div>
    </div>

    <div className="w-full md:max-w-[1024px] border p-2 rounded-lg overflow-hidden mt-6 mb-32">
      <div className="w-full flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          Manage DCAs
        </p>
        {
          refreshing ?
          <Button disabled variant="outline" className="gap-2">
            <LoaderIcon/>
            Refreshing
          </Button>
          :
          <Button variant="outline" onClick={() => {setHistory({}); update();}}>
            Refresh
          </Button>
        }
        
      </div>
      <Table className="w-full overflow-x-scroll">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">View</TableHead>
            <TableHead className="w-[130px] md:w-[150px]">Order</TableHead>
            <TableHead className="text-center">Progress</TableHead>
            <TableHead className="text-right">Options</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="overflow-x-scroll w-full">
          {
            state.tokenList && dcas.map((dca, i) => {
              console.log(dca, history[dca.publicKey.toBase58()]);
              let fromToken = TokenInfo(state, dca.state.contributedToken.toBase58());
              let toToken = TokenInfo(state, dca.state.destinationToken.toBase58());

              return <TableRow key={i}>
                <TableCell>
                  <Link target="_blank" href={"https://solscan.io/account/" + dca.publicKey.toBase58()}>
                    <img src={SolscanImage.src} width={20} height={20} alt="solscan"/>
                  </Link>
                </TableCell>
                <TableCell className="w-[130px] md:w-[200px]">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      <img src={fromToken.logoURI || "https://i.imgur.com/WRxAdjU.png"} width={20} height={20} alt="logo"/>
                      <p className="text-sm">
                        {formatNumber(dca.state.initialDeposit.toNumber() / 10**fromToken.decimals,"auto")}
                        {" "}
                        {fromToken.symbol}
                      </p>
                    </div>
                    <ArrowRightIcon/>
                    <div className="flex items-center gap-1">
                      <img src={toToken.logoURI || "https://i.imgur.com/WRxAdjU.png"} width={20} height={20} alt="logo"/>
                      <p className="text-sm">{toToken.symbol}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant={"ghost"} className="text-center" onClick={() => openHistoryPopup(dca.publicKey.toBase58(), fromToken, toToken)}>
                    <p className="text-sm text-center text-muted-foreground">
                      {"("}
                      {dca.state.executedOrders.toNumber()}
                      {" / "}
                      {dca.state.executedOrders.toNumber() + dca.state.remainingOrders.toNumber()}
                      {")"}
                    </p>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  {
                    dca.state.executedOrders.toNumber() === dca.state.executedOrders.toNumber() + dca.state.remainingOrders.toNumber() ?
                    <Button variant={"outline"} className="text-xs text-cyan-500" size={"sm"} onClick={() => closeDca(dca.publicKey, 1)}>
                    Claim
                    </Button>
                  :
                    <Button variant={"outline"} className="text-xs text-red-500" size={"sm"} onClick={() => closeDca(dca.publicKey, 0)}>
                      Cancel
                    </Button>
                  }
                </TableCell>
              </TableRow>
            })
          }
        </TableBody>
      </Table>
      {
        dcas.length === 0 &&
        <p className="w-full h-full p-4 flex items-center justify-center text-sm text-muted-foreground">Your DCA Orders will show up here</p>
      }
    </div>
    {
      tokenSearchPopup !== -1 &&
        <TokenSearchPopup
          popupOpen={tokenSearchPopup} 
          closePopup={() => setTokenSearchPopup(-1)}
          onSelect={(token) => selectToken(token)}
        />
      }
    {
      historyPopup !== null &&
      <DCAHistoryPopup data={historyPopup} onClose={() => setHistoryPopup(null)}/>
    }
    {
      feePopup &&
      <FeeTiersPopup open={true} tiers={feeTiers} onClose={() => setFeePopup(false)}/>
    }
    {
      timePickerOpened &&
      <TimePicker closePopup={() => setTimePickerOpened(false)} open={timePickerOpened} setFrequency={setFrequency} setCycles={setCycles} />
    }
  </div>

}