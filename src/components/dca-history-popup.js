import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import Link from "next/link";
import { useSelector } from "react-redux";
import { formatNumber } from "@/utils/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useState } from "react";

export function TokenInfo(state, mint) {
  // if (state.tokenList)
  let token = undefined;
  if (state.tokenList)
    token = state.tokenList.find((token) => token.address === mint);
  return token;
}

export const DCAHistoryPopup = ({data, onClose}) => {
  const state = useSelector((state) => state.storage);
  
  return <Dialog 
    open={data !== null}
    onOpenChange={() => onClose()}
    
  >
    <DialogTrigger></DialogTrigger>
    <DialogContent className="max-h-[600px] overflow-y-scroll">
      <DialogHeader>
        <DialogTitle>DCA History</DialogTitle>
        <DialogDescription>
          View the history of your DCA Order
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[32px]">Tx</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            (data && state.tokenList) &&
            data.history.map((historyElement, i) => {
            return <TableRow key={i}>
              <TableCell className="w-[32px] p-0 pl-1">
                <Link target="_blank" href={"https://solscan.io/tx/" + historyElement.tx}>
                  <img src={SolscanImage.src} width={24} height={24} alt="solscan"/>
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <img src={data.from.logoURI || "https://i.imgur.com/WRxAdjU.png"} width={24} height={24} alt="logo"/>
                    <p className="text-sm font-bold">{`${formatNumber(historyElement.fromAmount / 10**data.from.decimals, "auto")} ${data.from.symbol}`}</p>
                  </div>
                  <ArrowRightIcon/>
                  <div className="flex items-center gap-1">
                    <img src={data.to.logoURI || "https://i.imgur.com/WRxAdjU.png"} width={24} height={24} alt="logo"/>
                    <p className="text-sm font-bold">{`${formatNumber(historyElement.toAmount / 10**data.to.decimals, "auto")} ${data.to.symbol}`}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <p className="text-sm text-muted-foreground">
                  {
                    format(new Date(historyElement.timestamp * 1000), "MM/dd/yyyy HH:mm")
                  }
                </p>
              </TableCell>
            </TableRow>
          })
        }
        </TableBody>
      </Table>
      {// <div className="flex flex-col gap-2">
      //   {
      //     history[dca.publicKey.toBase58()] &&
      //     history[dca.publicKey.toBase58()].map(historyElement => {
      //       return <div className="dividerElement" onClick={() => {}}>
      //       <a target={"_blank"} href={"https://solscan.io/tx/" + historyElement.tx} >
      //         <p className="dividerText">{"Tx"}</p>
      //       </a>
      //       <p className="dividerText">
      //         {historyElement.fromAmount}
      //       </p>
      //       {TokenImage(state, dca.state.contributedToken.toBase58())}
      //       <p className="dividerText">To</p>

      //       <p className="dividerText">
      //         {historyElement.toAmount}
      //       </p>
      //       {TokenImage(state, dca.state.destinationToken.toBase58())}
      //       <p className="dividerText">
      //         {historyElement.timestamp}
      //       </p>
      //     </div>
      //     })
      //   }
      // </div>
}
    </DialogContent>
  </Dialog>
}