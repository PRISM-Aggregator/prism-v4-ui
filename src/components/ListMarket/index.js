import { useEffect, useState } from "react";
import styles from "./ListMarket.module.scss"
import ListingImage from "/public/assets/images/listing.png";
import { Staking } from "@prism-hq/staking-sdk";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { CheckmarkIcon, LoaderIcon } from "react-hot-toast";
import state from "@/redux/state";
import { useSelector } from "react-redux";
import { DiscordLogoIcon } from "@radix-ui/react-icons";

const PRISM_VAULT_STATE = new PublicKey("4nJfd3urgiQSCKfLkELURo4WQV6s9Ldmrn152EDBhWhU");
export const PRISM_MINT = "PRSMNsEPqhGVCH1TtWiJqPjJyh2cKrLostPZTNy1o5x";

export const ListMarket = ({address}) => {
  const state = useSelector((state) => state.storage);
  const wallet = useWallet();
  const {connection} = useConnection()
  const [step, setStep] = useState(0);
  const [userStake, setUserStake] = useState(null);
  const [prismBalance, setPrismBalance] = useState(0);
  const [sdk, setSDK] = useState(null);

  const [marketInput, setMarketInput] = useState(address);
  
  // ui
  const [stakingOverlay, setStakingOverlay] = useState(false);
  const [stakeSuccess, setStakeSuccess] = useState(false);

  useEffect(() => {
    if(state.accounts) {
      let prism = state.accounts.find(item => item.address === PRISM_MINT);
      if(prism) {
        setPrismBalance(prism.balance);
      } else {
        setPrismBalance(0);
      }
    }
  }, [state.accounts]);

  useEffect(() => {
    if(wallet.connected && !userStake) {
      Staking.loadStakingForUser(
        PRISM_VAULT_STATE,
        connection,
        wallet.publicKey
      ).then(res => {
        setUserStake(res);
        if(res.userStats.currentTvl / 10**6 > 100000) {
          setStep(1);
        }
        console.log("staking data", res)
      })
      Staking.loadStaking(
        wallet,
        connection,
        {
            vaultState: PRISM_VAULT_STATE
        }
      ).then(res => setSDK(res));  
    }
  }, [wallet.connected]);

  const stakePrism = async () => {
    setStakingOverlay(true);
    let txid = await sdk.stake(100000, 15724800).catch((e) => {console.log(e); return "Err";});
    if(txid) {
      console.log("txid", txid);
      setStep(1);
      setStakeSuccess(true);
    }
  }
  return <div className="listMarket">
    <img src={ListingImage} width={360} height={90} alt="Listing Image"/>


    <div className="stepsInfo">
      <div className="info">
        <div className={"dot complete"}/>
        <div className={step > 0 ? "line complete" : "line"} style={{height:"130px"}}/>
        <div className={step > 0 ? "dot complete" : "dot"}/>
      </div>
      <div className="steps">
        <div className="step">
          <p className="label">Step 1</p>
          <p className="value">Stake 100,000 PRISM</p>
          <p className="label">Staked PRISM will accrue rewards and can be unstaked in 6 months</p>
          {
            wallet.connected ?
            (
              userStake ?
                (userStake.userStats.currentTvl / 10**6 > 100000 || stakeSuccess) ?
                <div className="button complete">
                  <CheckmarkIcon/>
                  <p>Staked</p>
                </div>
                :
                prismBalance > 100000 ?
                  stakingOverlay ?
                  <div className="button">
                    <LoaderIcon/>
                    <p>Staking</p>
                  </div>
                  :
                  <div className="button" onClick={() => stakePrism()}>
                    <p>Stake</p>
                  </div>
                  :
                  <div className="button disabled">
                    <p>Insufficient PRISM in your wallet</p>
                  </div>
              :
              <div className="button disabled">
                <LoaderIcon/>
                <p>Loading Your Stake</p>
              </div>
            )
            
            :
            <div className="button disabled">
              <p>Please Connect Wallet</p>
            </div>
          }
        </div>
        <div className={step > 0 ? "step" : "step disabled"}>
          <p className="label">Step 2</p>
          <p className="value">Submit your market address</p>
          <p className="label">Please reach out in <b>🆕〡listing-request</b> Discord channel</p>
          <a target="_blank" href={"https://discord.gg/CZsjrKuaMK"} className="button" style={{backgroundColor:"#404eed"}}>
            <DiscordLogoIcon/>
            <p>Discord</p>
          </a>
          {/* <input disabled={step < 1} type="text" placeholder="Market Address" value={marketInput} onChange={(e) => {
            if(step > 0)
              setMarketInput(e.target.value)
          }}/> */}
        </div>
      </div>
    </div>
  </div>
}