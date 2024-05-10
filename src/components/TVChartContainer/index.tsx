import styles from "./TVChartContainer.module.css";
import { useEffect, useRef, useState } from "react";
import { ChartingLibraryWidgetOptions, LanguageCode, widget } from "../../../public/static/charting_library";
import datafeed from "../../../public/static/Datafeed";
import { formatNumber } from "@/utils/utils";

let colors = {
	gray50: "#020817",
	primary: "#ffffff",
	grid: "#0b1732"
}

export const TVChartContainer = ({
	//@ts-ignore
	market,
	//@ts-ignore
	openOrders,
	currentTheme="dark",
	strategyPreview=null,
}) => {
	const chartContainerRef =
		useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;

	const [currentSymbol, setCurrentSymbol] = useState(market.baseMint.toBase58() || null);
	const [interval, setInterval] = useState('60');
	const [tvWidget, setTvWidget] = useState<any>(null);
	const [customLines, setCustomLines] = useState<any>([]);
	const [strategyLines, setStrategyLines] = useState<any>([]);

	useEffect(() => {
		const widgetOptions: ChartingLibraryWidgetOptions = {
			symbol: market.baseMint.toBase58(), // default symbol
			//@ts-ignore
			interval: interval, // default interval
			fullscreen: false, // displays the chart in the fullscreen mode
			container: chartContainerRef.current,
			datafeed: datafeed,
			library_path: '/static/charting_library/',
			custom_css_url: '/static/tradingView.css',
			disabled_features: ['use_localstorage_for_settings','widget_logo'],
			enabled_features: ['study_templates'],
			//@ts-ignore
			theme: currentTheme,
			autosize: true,
			//@ts-ignore
			disabled_features: [
				"header_symbol_search",
				"header_compare"
			],
			studies_overrides: {},
			custom_formatters: {
				// @ts-ignore
				priceFormatterFactory: (symbolInfo, minTick) => {
					if (symbolInfo?.fractional || minTick !== 'default' && minTick.split(',')[2] === 'true') {
							return {
								// @ts-ignore
									format: (price, signPositive) => {
											// return the appropriate format
											return price.toFixed(10)
									},
							};
					}
					return null; // this is to use default formatter;
				}
			},
			// disabled_features: ["header_symbol_search"],
			overrides: {
				//@ts-ignore
				watermark: {
					visible: false,
				},
				"paneProperties.backgroundType": "solid",
				// "paneProperties.background": "var(--gray100)",
				// "paneProperties.backgroundGradientStartColor": "var(--gray100)",
				// "paneProperties.backgroundGradientEndColor": "var(--gray100)",
				"paneProperties.vertGridProperties.color": colors.grid,
				"paneProperties.horzGridProperties.color": colors.grid,
				"scalesProperties.textColor" : "#AAA",
				"mainSeriesProperties.candleStyle.wickUpColor": '#3FB68B',
				"mainSeriesProperties.candleStyle.wickDownColor": '#F35050'
			}
		}

		const tvWidget = new widget(widgetOptions);

		tvWidget.applyOverrides({ 'mainSeriesProperties.minTick': '10000000,1,false' });
		tvWidget.applyOverrides({ 'paneProperties.backgroundType' : 'solid', 'paneProperties.background': colors.gray50})
		tvWidget.applyOverrides({ 'paneProperties.backgroundGradientStartColor': colors.gray50, 'paneProperties.backgroundGradientEndColor' : colors.gray50 })
		tvWidget.applyOverrides({ 'paneProperties.vertGridProperties.color': colors.grid, 'paneProperties.horzGridProperties.color': colors.grid })
		tvWidget.applyOverrides({ 'scalesProperties.textColor': colors.primary})
		
		tvWidget.onChartReady(() => {
			setTvWidget(tvWidget);
		});

		return () => {
			tvWidget.remove();
		};
	}, []);

	useEffect(() => {
		if(strategyPreview && market && tvWidget) {
			tvWidget.onChartReady(() => {
				try {
					//@ts-ignore
					let orders:any = strategyPreview;
					//@ts-ignore
					let lines:any = [];
					const chart = tvWidget.chart();
					
					strategyLines.map((line:any) => {
						line.remove();
					})
	
					orders.map((orderInfo:any) => {
						let order = chart?.createOrderLine()
						.setText((orderInfo.side === 0 ? "Buy" : "Sell") + " Preview")
						.setLineLength(3) 
						.setLineStyle(0) 
						//@ts-ignore 
						.setQuantity(formatNumber(orderInfo.side === 0 ? orderInfo.amount / orderInfo.price : orderInfo.amount, "auto"))
						order.setPrice(orderInfo.price);
						order.setBodyBackgroundColor('rgba(2, 8, 23, 255)');
						order.setQuantityBackgroundColor('rgba(2, 8, 23, 255)');
						order.setBodyBorderColor('rgba(62, 220, 255, 255)');
						order.setQuantityBorderColor('rgba(62, 220, 255, 255)');
						order.setLineColor('rgba(62, 220, 255, 255)');
						order.setBodyTextColor('rgba(62, 220, 255, 255)');
						lines.push(order)
					});
					
					setStrategyLines(lines);
				} catch (e) {
					console.log('error', e)
				}
			});
		}
		if(!strategyPreview) {
			strategyLines.map((line:any) => {
				line.remove();
			})
			setStrategyLines([]);
		}
	}, [strategyPreview]);

	useEffect(() => { // Set chart order lines
		if(openOrders && market && tvWidget) {
			tvWidget.onChartReady(() => {
				if(openOrders[market.address] && currentSymbol === market.baseMint.toBase58()) {
					// console.log('oo', openOrders[market.address])
					try {
						let oo = openOrders[market.address];
						let bids = oo.bids;
						let asks = oo.asks;
						let lines:any = [];
						const chart = tvWidget.chart();
						
						customLines.map((line:any) => {
							line.remove();
						})
		
						bids.map((bid:any) => {
							let order = chart?.createOrderLine()
							.setText("Buy Order")
							.setLineLength(3) 
							.setLineStyle(0) 
							//@ts-ignore 
							.setQuantity(formatNumber(bid.size, "auto"))
							order.setPrice(bid.price);
							order.setBodyBackgroundColor('rgba(2, 8, 23, 255)');
							order.setQuantityBackgroundColor('rgba(2, 8, 23, 255)');
							order.setBodyBorderColor('rgba(34, 197, 94, 255)');
							order.setQuantityBorderColor('rgba(34, 197, 94, 255)');
							order.setLineColor('rgba(34, 197, 94, 255)');
							order.setBodyTextColor('rgba(34, 197, 94, 255)');
		
							lines.push(order)
						});
						asks.map((ask:any) => {
							let order = chart?.createOrderLine()
							.setText("Sell Order")
							.setLineLength(3) 
							.setLineStyle(0)
							//@ts-ignore 
							.setQuantity(formatNumber(ask.size, "auto"))
							order.setPrice(ask.price);
							order.setBodyBackgroundColor('rgba(2, 8, 23, 255)');
							order.setQuantityBackgroundColor('rgba(2, 8, 23, 255)');
							order.setBodyBorderColor('rgba(243, 80, 80, 255)');
							order.setQuantityBorderColor('rgba(243, 80, 80, 255)');
							order.setLineColor('rgba(243, 80, 80, 255)');
							order.setBodyTextColor('rgba(243, 80, 80, 255)');
							lines.push(order);
						});
						setCustomLines(lines);
					} catch (e) {
						console.log('error', e)
					}
				}
			});
		}
	}, [openOrders, tvWidget]);

	useEffect(() => {
		if(currentSymbol !== market.baseMint.toBase58() && tvWidget) {
			customLines.map((line:any) => {
				line.remove();
			})
			setCustomLines([]);
			setCurrentSymbol(market.baseMint.toBase58());
			//@ts-ignore
			tvWidget?.setSymbol(market.baseMint.toBase58(), interval, () => console.log("[TV] Symbol Changed"));
		}
	}, [market, tvWidget])

	return <div ref={chartContainerRef} className={styles.TVChartContainer} />
};