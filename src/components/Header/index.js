import {WalletComponent} from "@/components/WalletComponent";
import styles from "./Header.module.scss";
import Logo from "/public/assets/icons/testlogo.svg";
import LogoText from "/public/assets/icons/logo.svg"
import CandlesIcon from "/public/assets/icons/candles.svg";
import ApeIcon from "/public/assets/icons/ape.svg";
import SirenIcon from "/public/assets/icons/siren.svg";
import { ClockIcon, CubeIcon, HamburgerMenuIcon, MixIcon } from "@radix-ui/react-icons";
import PrismIcon from "/public/assets/icons/prismIcon.svg";
import RocketIcon from "/public/assets/icons/rocket.svg";

import Link from "next/link";
import Image from "next/image";
import useWindowDimensions, { formatNumber } from "@/utils/utils";
import SwapIcon from "/public/assets/icons/swap.svg";

// -- mobile
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import React, { useEffect, useState } from "react";
import { Separator } from "../ui/separator";
import { useSelector } from "react-redux";
import { PRISM_MINT } from "../ListMarket";
import { useWallet } from "@solana/wallet-adapter-react";
// --
const menuLinks = [
  {
    href:"/", 
    path: '/swap', 
    label:"Swap", 
    target:"_self",
    icon: <SwapIcon width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description:"Best Prices"
  },
  {
    href:"/trade", 
    path: '/trade', 
    label:"Trade", 
    target:"_self",
    icon: <CandlesIcon width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description:"Set your Price"
  },

  {
    href:"/dca", 
    path: '/dca', 
    target:"_self",
    label:"DCA", 
    icon: <ClockIcon width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description:"In and Out"
  },
  // {
  //   href:"/bundles", 
  //   path: '/bundles', 
  //   label:"Bundles", 
  //   icon: <MixIcon width={20} height={20}/>, 
  //   selectedColor: "#e900ff",
  //   description:"Diversify easily with through bundles"
  // },
  // // {href:"/borrow", label:"Borrow"},
  {
    href:"https://v3.prism.ag/stake", 
    path:'/stake', 
    label:"Stake", 
    target:"_blank",
    icon: <RocketIcon width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description:"Collect Rewards"
  },
  // {
  //   href:"/ape", 
  //   path:'/ape', 
  //   label:"Ape", 
  //   target:"_self",
  //   icon: <ApeIcon width={20} height={20}/>, 
  //   selectedColor: "#ffffff",
  //   description:"1-Click Degen"
  // },
  // {
  //   href:"/panik", 
  //   path:'/panik', 
  //   label:"Panik", 
  //   target:"_self",
  //   icon: <SirenIcon width={20} height={20}/>, 
  //   selectedColor: "#ffffff",
  //   description:"Get out Fast"
  // },
  
  
  // {
  //   href:"/tools", 
  //   path:'/tools', 
  //   label:"Tools", 
  //   icon: <CubeIcon width={20} height={20}/>, 
  //   selectedColor: "#ffffff",
  //   description:"Create SPL tokens, List them on Prism, and more"
  // }
]
export const Header = ({path}) => {
  const state = useSelector(state => state.storage);
  const {width} = useWindowDimensions() || 1000;
  const [prismBalance, setPrismBalance] = useState(null);
  const wallet = useWallet();
  const [menuOpened, setMenuOpened] = useState(false);

  useEffect(() => {
    if(state.accounts) {
      let prismAcc = state.accounts.find((account) => account.address === PRISM_MINT);
      if(prismAcc) {
        setPrismBalance(prismAcc.balance);
      } else {
        setPrismBalance(0);
      }
    }
  }, [state.accounts]);

  if(width > 768) { // DESKTOP VIEW ---------
    return <div className="w-full px-2">
      <div className={`${styles.header} mt-2 border rounded-[8px] p-4`}>
      <div className="flex items-center gap-2">
        {/* <img src={Logo} width={32} height={32} color="var(--primary)"/> */}
        <LogoText height={20}/>
      </div>
      <div className={styles.menu}>
        {
          menuLinks.map((item, i) => {
            return <Link 
              href={item.href} 
              target={item.target}
              key={i}
              className="flex items-center">
                <div className={`flex items-center shrink-0 ${path.indexOf(item.path) !== -1 ? 'text-[#3edcff] opacity-100' : 'opacity-90 text-muted-foreground hover:opacity-100 hover:text-white'} transition-all gap-3 w-34`}>
                  <p className={`text-lg w-11 h-11 flex items-center justify-center rounded-sm bg-background-over`}>{item.icon}</p>
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
            </Link>

          })
        }
        
      </div>
      <div className="wallet">
        <WalletComponent/>
      </div>
    </div>
  </div>
  }

  if(width <= 768) { // Mobile View ------------
    return <div className={`${styles.header} flex border-b justify-between`}>
      <div className="flex items-center gap-2">
        <LogoText height={16}/>
      </div>
      <div className="flex items-center gap-2">
        <WalletComponent/>
        <Button onClick={() => setMenuOpened(true)} variant="ghost" size={"icon"}><HamburgerMenuIcon width={24} height={24}/></Button>

        <Sheet open={menuOpened} onOpenChange={(e) => setMenuOpened(e)}>
          <SheetTrigger/>
          <SheetContent>
            <SheetHeader className="flex text-left flex-col items-start">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Explore Prism Ecosystem
              </SheetDescription>
            </SheetHeader>
            {
              (prismBalance !== null && wallet.connected) &&
              <div className="flex flex-col gap-4 mt-4">
                <Separator/>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <PrismIcon width={24} height={24}/>
                    <p className="text-lg text-white font-bold">
                      {formatNumber(prismBalance, "auto")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link onClick={() => setMenuOpened(false)} href={"/?from=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&to=PRSMNsEPqhGVCH1TtWiJqPjJyh2cKrLostPZTNy1o5x"}>
                      <Button onClick={(e) => e} variant="secondary">Buy</Button>
                    </Link>
                    {
                      prismBalance > 0 &&
                      <Link target="_blank" href={"https://v3.prism.ag/stake"}>
                        <Button className="bg-white hover:bg-slate-200" variant="default">Stake</Button>
                      </Link>
                    }
                  </div>
                </div>
                <Separator/>
              </div>
            }
            
            <div className="flex flex-col w-full gap-4 py-4 justify-start">
              {
                menuLinks.map((item, i) => {
                  let Icon;
                  if(path.indexOf(item.path) !== -1) Icon = React.cloneElement(item.icon, {color: 'var(--brand)', width: 24, height: 24});
                  else Icon = React.cloneElement(item.icon, {width: 24, height: 24});

                  return <div className="flex w-full flex-col gap-4" key={i}>
                    <Link 
                    key={i} 
                    href={item.href} 
                    className={`${styles.menuItem} flex items-start justify-start gap-4 ${path.indexOf(item.path) !== -1 ? "text-white" : "text-muted-foreground"}`}
                    style={path.indexOf(item.path) !== -1 ? {color:item.selectedColor} : {}}>
                      <div className={`flex items-center shrink-0 ${path.indexOf(item.path) !== -1 ? 'text-[#3edcff] opacity-100' : 'opacity-90 text-muted-foreground hover:opacity-100 hover:text-white'} transition-all gap-3 w-34`}>
                        <p className={`text-lg w-11 h-11 flex items-center justify-center rounded-sm bg-background-over`}>{item.icon}</p>
                        <div className="flex flex-col items-start">
                          <p className="text-sm font-bold">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                    {i !== menuLinks.length - 1 &&
                      <Separator/>
                    }
                  </div>
                })
              }
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  }
}