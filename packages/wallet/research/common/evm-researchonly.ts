/* eslint-disable @typescript-eslint/no-unused-vars */
// Address and Hex types
type Address = `0x${string}`
type Hex = `0x${string}`

// Block related types
type BlockTag = 'earliest' | 'finalized' | 'latest' | 'pending' | 'safe'
type BlockNumber = bigint
type Block<TIncludeTransactions extends boolean = false, TBlockTag extends BlockTag = BlockTag> = {
  baseFeePerGas: bigint | null
  difficulty: bigint
  extraData: Hex
  gasLimit: bigint
  gasUsed: bigint
  hash: Hex | null
  logsBloom: Hex | null
  miner: Address
  mixHash: Hex
  nonce: Hex | null
  number: bigint | null
  parentHash: Hex
  receiptsRoot: Hex
  sealFields: Hex[]
  sha3Uncles: Hex
  size: bigint
  stateRoot: Hex
  timestamp: bigint
  totalDifficulty: bigint | null
  transactions: TIncludeTransactions extends true ? Transaction[] : Hex[]
  transactionsRoot: Hex
  uncles: Hex[]
}

// Transaction types
type Transaction = {
  blockHash: Hex | null
  blockNumber: bigint | null
  from: Address
  gas: bigint
  gasPrice: bigint
  hash: Hex
  input: Hex
  nonce: number
  r: Hex
  s: Hex
  to: Address | null
  transactionIndex: number | null
  type: TransactionType
  v: bigint
  value: bigint
}

type TransactionRequest = {
  from?: Address
  to?: Address
  value?: bigint
  gas?: bigint
  gasPrice?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  data?: Hex
  nonce?: number
  chainId?: number
  type?: TransactionType
  accessList?: AccessList
}

type TransactionReceipt = {
  blockHash: Hex
  blockNumber: bigint
  contractAddress: Address | null
  cumulativeGasUsed: bigint
  effectiveGasPrice: bigint
  from: Address
  gasUsed: bigint
  logs: Log[]
  logsBloom: Hex
  status: 'success' | 'reverted'
  to: Address | null
  transactionHash: Hex
  transactionIndex: number
  type: TransactionType
}

// Log type
type Log = {
  address: Address
  blockHash: Hex
  blockNumber: bigint
  data: Hex
  logIndex: number
  removed: boolean
  topics: Hex[]
  transactionHash: Hex
  transactionIndex: number
}

// AccessList type
type AccessList = { address: Address; storageKeys: Hex[] }[]

// TransactionType
type TransactionType = '0x0' | '0x1' | '0x2'

// FeeValuesEIP1559
type FeeValuesEIP1559 = {
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

// FeeValuesLegacy
type FeeValuesLegacy = {
  gasPrice: bigint
}

// FeeValuesEIP2930
type FeeValuesEIP2930 = FeeValuesLegacy & {
  accessList: AccessList
}

// Chain related types
type Chain = {
  id: number
  name: string
  network: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: {
    default: { http: string[]; webSocket?: string[] }
    public: { http: string[]; webSocket?: string[] }
  }
  blockExplorers?: {
    default: { name: string; url: string }
  }
  contracts?: {
    ensRegistry?: { address: Address }
    multicall3?: { address: Address; blockCreated: number }
  }
}

// RPC related types
type RpcResponse<TResult> = {
  id: number
  jsonrpc: '2.0'
  result: TResult
}

type RpcRequest = {
  method: string
  params: unknown[]
}

// ABI related types
type AbiEvent = {
  type: 'event'
  name: string
  inputs: AbiParameter[]
  anonymous?: boolean
}

type AbiFunction = {
  type: 'function'
  name: string
  inputs: AbiParameter[]
  outputs: AbiParameter[]
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable'
}

type AbiParameter = {
  name: string
  type: string
  components?: AbiParameter[]
  indexed?: boolean
}

// These types represent a comprehensive set of Ethereum-related structures in TypeScript.
// Viem provides even more specific types and utilities, but these cover the main concepts.
