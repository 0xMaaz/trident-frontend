
import { ethers, constants } from "ethers";
import { getMarketPrice, getTokenPrice } from "../helpers";
import { calculateUserBondDetails, getBalances } from "../store/slices/account-slice";
import { getAddresses } from "../constants";
import { fetchPendingTxns, clearPendingTxn } from "../store/slices/pending-txns-slice";
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { fetchAccountSuccess } from "../store/slices/account-slice";
import { Networks } from "../constants/blockchain";
import { RootState } from "../store/store";
import { getGasPrice } from "../helpers/get-gas-price";
import { ust, frax } from "src/helpers/bond";
