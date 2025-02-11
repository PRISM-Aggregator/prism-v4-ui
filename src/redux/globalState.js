import { PublicKey, Connection } from "@solana/web3.js";

const stored_user_pubkey = "pubkey";

export const HELIUS_KEY = "YOUR_HELIUS_KEY_HERE"; // helius used for ws updates on orderbook
export const RPC_ENDPOINT = "YOUR_RPC_HERE"; // your rpc endpoint here
let connection = new Connection(RPC_ENDPOINT, "confirmed");

export const TOKEN_LIST_API = "https://token.jup.ag/all";
export const STRICT_TOKEN_LIST_API = "https://token.jup.ag/strict";

export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const globalState = {
  connected: false,
  dex: 'v2',
  tokenList: null,
  closedOpenOrders: [],
  openOrders: [],
  accounts: [],
  marketsV1: [],
  marketsV2: [],
  useWsol: false,
  priorityFee: null,
  refreshState: 0
};


export default globalState;