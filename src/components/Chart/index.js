// import { TVChartContainer } from "components/TVChartContainer";
import styles from "./Chart.module.scss";
import React, { Suspense } from "react";
import { Watchlist } from "@/components/Watchlist";
import dynamic from 'next/dynamic';

const TVChartContainer = dynamic(
	() => import('@/components/TVChartContainer').then(mod => mod.TVChartContainer),
	{ ssr: false }
);



export const Chart = ({market, updateMarket, openOrders, showWatchlist=true, className="", strategyPreview=null}) => {

  return <div className={`${styles.chart} border ${className}`}>
    {
      showWatchlist &&
      <Watchlist market={market} updateMarket={(p) => updateMarket(p)}/>
    }
    <div className={`${styles.chartInner}`}>
      {
        market &&
        <TVChartContainer
          market={market}
          openOrders={openOrders}
          currentTheme={"dark"}
          strategyPreview={strategyPreview}
        />
      }
    </div>
  </div>
}
