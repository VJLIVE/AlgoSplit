import algosdk from 'algosdk';

const algodServer = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const algodPort = process.env.NEXT_PUBLIC_ALGOD_PORT || 443;
const algodToken = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';

const indexerServer = process.env.NEXT_PUBLIC_INDEXER_SERVER || 'https://testnet-idx.algonode.cloud';
const indexerPort = process.env.NEXT_PUBLIC_INDEXER_PORT || 443;
const indexerToken = process.env.NEXT_PUBLIC_INDEXER_TOKEN || '';

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
export const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);

export const APP_ID = parseInt(process.env.NEXT_PUBLIC_APP_ID || '0');

export function formatAlgoAmount(microAlgos: number): string {
  return (microAlgos / 1_000_000).toFixed(6);
}

export function microAlgosToAlgos(microAlgos: number): number {
  return microAlgos / 1_000_000;
}

export function algosToMicroAlgos(algos: number): number {
  return Math.round(algos * 1_000_000);
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
