This is a [Prism](https://prism.ag/) UI utilizing Openbook V2 CLOB

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Run ```npm install```, then make sure to enter your RPC endpoint, as well as Helius API key (for websocket orderbook updates) and run ```npm run dev```.

If you don't use Helius, modify ```HELIUS_WS_URL``` variable in ```utils/useMarket.ts```