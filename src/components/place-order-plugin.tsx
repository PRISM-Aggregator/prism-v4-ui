import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js"
import Image from "next/image";
import { useState } from "react";

interface Token {
  address: PublicKey | string; // Token Mint Address
  balance: number; // User's token balance
  symbol: string; // Token symbol
  name: string; // Token name
  logoURI: string; // Logo url
}

export const PlaceOrderPlugin = ({
  marketAddress,
  userPublicKey,
  baseToken,
  quoteToken,
}: {
  marketAddress: PublicKey,
  userPublicKey: PublicKey,
  baseToken: Token,
  quoteToken: Token
}) => {
  
  const wallet = useWallet();
  const {connection} = useConnection();

  const [limitPrice, setLimitPrice] = useState<any>("");
  const [quantity, setQuantity] = useState<any>("");
  const [outAmount, setOutAmount] = useState<any>("");
  const [orderSide, setOrderSide] = useState(0); // 0 for buy, 1 for sell

  const [base, setBase] = useState(baseToken);
  const [quote, setQuote] = useState(quoteToken);

  const [orderInProgress, setOrderInProgress] = useState<boolean>(false);


  const placeOrder = async () => {
    // Error checks
    if(orderSide === 0) {
      if(quote.balance < quantity) {
        console.error("Insufficient quote balance");
        return;
      }
    } else {
      if(base.balance < outAmount) {
        console.error("Insufficient base balance");
        return;
      }
    }
    if(limitPrice <= 0) {
      console.error("Invalid price");
      return;
    }
    if(quantity <= 0) {
      console.error("Invalid quantity");
      return;
    }
    if(outAmount <= 0) {
      console.error("Invalid out amount");
      return;
    }

    // Place order
    setOrderInProgress(true);

    let apiRequest = await fetch('https://v4.prism.ag/limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        market: marketAddress.toBase58(),
        pubkey: userPublicKey.toBase58(),
        side: orderSide === 0 ? "buy" : "sell",
        price: limitPrice,
        amount: quantity,
        clob: 'v2'
      })
    })
    let apiResponse = await apiRequest.json();
    console.log(apiResponse);
    if(apiResponse.success) {
      // Convert base64 to tx
      const transactionBuffer = Buffer.from(apiResponse.transaction, 'base64');
      let tx = Transaction.from(transactionBuffer);

      // add priority fees
      const PRIORITY_RATE = 1000000;
      const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({microLamports: PRIORITY_RATE});
      
      if(tx.instructions) {
        tx.instructions = [PRIORITY_FEE_IX, ...tx.instructions];
      }
      // if using solana wallet adapter
      // @ts-ignore
      let signedTx = await wallet.signTransaction(tx);
      let txid;
      try {
        txid = await connection.sendRawTransaction(signedTx.serialize(), {skipPreflight: true});
        setOrderInProgress(false);
        console.log('txid', txid)
        // handle confirm tx
      } catch (e) {
        console.error(e);
        setOrderInProgress(false);
        return;
      }
      
    } else {
      // Handle error
      console.error(apiResponse.error);
    }
  }

  const reverseSide = () => {
    setBase(quote);
    setQuote(base);
    setOrderSide(orderSide === 0 ? 1 : 0);
  }

  const setAmount = (quantity: any) => {
    setQuantity(quantity);
    if (quantity) {
      if (orderSide === 0) {
        setOutAmount((parseFloat(quantity) / parseFloat(limitPrice)));
      } else {
        setOutAmount((parseFloat(quantity) * parseFloat(limitPrice)));
      }
    }
  }
  const setBaseAmount = (amount: any) => {
    setOutAmount(amount);
    if (amount) {
      if (orderSide === 0) {
        setQuantity((parseFloat(limitPrice) * parseFloat(amount)));
      } else {
        setQuantity((parseFloat(amount) / parseFloat(limitPrice)));
      }
    }
  }

  const setPrice = (price: any) => {
    setLimitPrice(price);
    if(price) {
      if (quantity) {
        if (orderSide === 0) {
          setOutAmount((parseFloat(quantity) / parseFloat(price)));
        } else {
          setOutAmount((parseFloat(quantity) * parseFloat(price)));
        }
      }
    }
  }


  return <div className="w-full flex flex-col items-center gap-4 border rounded-xl p-4">
    <div className="w-full grid grid-cols-2 items-center border p-2 rounded-xl">
      <div className={`w-full cursor-pointer h-8 ${orderSide === 0 ? "bg-green-500" : "text-muted-foreground"} rounded-sm flex items-center justify-center`} onClick={() => reverseSide()}>
        <p className="text-sm font-bold">Buy</p>
      </div>
      <div className={`w-full cursor-pointer h-8 ${orderSide === 1 ? "bg-red-500" : "text-muted-foreground"} rounded-sm flex items-center justify-center`} onClick={() => reverseSide()}>
        <p className="text-sm font-bold">Sell</p>
      </div>
    </div>
    <div className="w-full flex flex-col gap-1">
      <p className="text-muted-foreground">Limit Price</p>
      <div className="w-full border rounded-lg p-2 relative h-16 flex items-center justify-end">
        <input className={"text-lg absolute w-full h-full bg-transparent border-none z-1 top-0 left-0 px-4 font-bold focus:outline-none"} value={limitPrice} lang="en" onChange={(e) => setPrice(e.target.value)} type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9,]*"/>
        <div className="w-fit bg-[#d7d5e914] border rounded-xl flex items-center gap-2 p-2 pr-2">
          <Image className="rounded-full" src={quoteToken.logoURI} width={24} height={24} alt={quoteToken.symbol} />
          <p className="text-sm font-bold">{quoteToken.symbol}</p>
        </div>
      </div>
    </div>

    <div className="w-full flex flex-col gap-1">
      <div className="flex items-center w-full justify-between">
        <p className="text-muted-foreground">You Pay</p>
        <p className="text-sm font-bold cursor-pointer" onClick={() => setAmount(quote.balance)}>Max: {quote.balance} {quote.symbol}</p>
      </div>
      <div className="w-full border rounded-lg p-2 relative h-16 flex items-center justify-end">
        <input className={"text-lg absolute w-full h-full bg-transparent border-none z-1 top-0 left-0 px-4 font-bold focus:outline-none"} value={quantity} lang="en" onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9,]*"/>
        <div className="w-fit bg-[#d7d5e914] border rounded-xl flex items-center gap-2 p-2 pr-2">
          <Image className="rounded-full" src={quote.logoURI} width={24} height={24} alt={base.symbol} />
          <p className="text-sm font-bold">{quote.symbol}</p>
        </div>
      </div>
    </div>

    <div className="w-full flex flex-col gap-1">
      <p className="text-muted-foreground">You Receive</p>
      <div className="w-full border rounded-lg p-2 relative h-16 flex items-center justify-end">
        <input className={"text-lg absolute w-full h-full bg-transparent border-none z-1 top-0 left-0 px-4 font-bold focus:outline-none"} value={outAmount} lang="en" onChange={(e) => setBaseAmount(e.target.value)} type="number" placeholder="0.00" inputMode='decimal' pattern="[0-9,]*"/>
        <div className="w-fit bg-[#d7d5e914] border rounded-xl flex items-center gap-2 p-2 pr-2">
          <Image className="rounded-full" src={base.logoURI} width={24} height={24} alt={base.symbol} />
          <p className="text-sm font-bold">{base.symbol}</p>
        </div>
      </div>
    </div>

    <div className="w-full flex flex-col gap-1">
      {
        (quantity && outAmount) ?
        (orderSide === 0 && quote.balance >= outAmount) || (orderSide === 1 && base.balance >= quantity) ?
          orderInProgress ?
            <div className="w-full h-14 flex items-center justify-center rounded-xl bg-slate-800 text-muted-foreground font-bold">
              <p className="text-center">Placing Order</p>
            </div>
            :
            <div className="w-full cursor-pointer h-14 flex items-center justify-center rounded-xl bg-green-500 text-black font-bold" onClick={() => placeOrder()}>
              <p className="text-center">Place Order</p>
            </div>
          :
          <div className="w-full h-14 flex items-center justify-center rounded-xl bg-slate-800 text-muted-foreground font-bold">
            <p className="text-center">Insufficient Balance</p>
          </div>
        :
        <div className="w-full h-14 flex items-center justify-center rounded-xl bg-slate-800 text-muted-foreground font-bold">
          <p className="text-center">Enter Details</p>
        </div>
      }
    </div>
  </div>
}