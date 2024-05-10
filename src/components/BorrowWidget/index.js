import "./style.scss";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import {ReactComponent as SwapIcon} from "assets/icons/swap.svg";


export const BorrowWidget = ({
  borrowToken, 
  collateralToken,
  borrowAmount,
  setBorrowAmount,
  collateralAmount,
  setCollateralAmount,
  switchSide
}) => {

  return <div className="borrowWidget">
  <div className="inputSection">
    <div className="labelFlex">
      <p className="label">You're borrowing</p>
    </div>
    <div className="input">
      <div className="token">
        <img src={borrowToken.logoURI} className="borderCircle" width={24} height={24} alt="logo"/>
        <p>{borrowToken.symbol}</p>
        <ChevronDownIcon/>
      </div>
      <input placeholder="0.00" type="number" value={borrowAmount} onChange={(e) => setBorrowAmount(e.target.value)}/>
    </div>
  </div>
  <div className="dividerElement">
    <hr className="divider"/>
    <div className="reverseButton" onClick={() => switchSide()}>
      <SwapIcon width={20} height={20} stroke="var(--primary)"/>
    </div>
  </div>
  <div className="inputSection">
    <div className="labelFlex">
      <p className="label">Using collateral</p>
    </div>
    <div className="input">
      <div className="token">
        <img src={collateralToken.logoURI} className="borderCircle" width={24} height={24} alt="logo"/>
        <p>{collateralToken.symbol}</p>
        <ChevronDownIcon/>
      </div>
      <input placeholder="0.00" type="number" value={collateralAmount} onChange={(e) => setCollateralAmount(e.target.value)}/>
    </div>
  </div>
  <div className="dividerElement">
    <hr className="divider"/>
    <p className="dividerText">
      Available Options
    </p>
  </div>
  <div className="routes">
    <div className="route">
      <div className="providerInfo">
        <div className="provider">
          <img src={"https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp/logo.png"} width={36} height={36} alt="Solend"/>
          <div className="providerValue">
            <p className="label">Provider</p>
            <p className="value">Solend</p>
          </div>
        </div>
        <div className="providerValue alignRight">
          <p className="label">Interest Rate</p>
          <p className="value animatedText">0.00%</p>
        </div>
      </div>
      <div className="routeInfo">
      
      </div>
    </div>
  </div>
</div>

}