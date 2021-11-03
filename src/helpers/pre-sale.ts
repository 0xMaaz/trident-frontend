import { Networks } from "../constants/blockchain";
import { ContractInterface, Contract } from "ethers";
import React from "react";
import { JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { getAddresses } from "../constants";
import { PpsiTokenContract, PresaleContract } from "../abi/";

/*
The cost of 1 pPSI
*/
export async function getTokenPrice(tokenIn: string, networkID: Networks, provider: ethers.Signer | ethers.providers.Provider): Promise<string> {
    const addresses = getAddresses(networkID);
    const TOKEN_ADDRESS = tokenIn === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

    const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
    const PpsiPrice = await contract.getPriceForToken(TOKEN_ADDRESS);
    return ethers.utils.formatUnits(PpsiPrice, "gwei");
}

/*
How many pPSI the caller is whitelisted to buy
*/
export async function getMaxTokenPurchase(networkID: Networks, provider: ethers.Signer | ethers.providers.Provider): Promise<string> {
    const addresses = getAddresses(networkID);
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

    const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
    const maxPpsi = await contract.getMaximumPurchasePossible();

    return ethers.utils.formatUnits(maxPpsi, "gwei");
}

/*
How much the buyer needs to spend to buy the maximum amount they are whitelisted for
*/
export async function getMaxPayment(tokenIn: string, networkID: Networks, provider: ethers.Signer | ethers.providers.Provider): Promise<string> {
    const addresses = getAddresses(networkID);
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;
    const TOKEN_ADDRESS = tokenIn === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;

    const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
    const maxPay = await contract.getMaximumPaymentPossible(TOKEN_ADDRESS);

    return ethers.utils.formatUnits(maxPay, "gwei");
}

/*
Calculate how many pPSI are received when paying X paymentToken
*/
export async function tokenOutAmount(tokenIn: string, amountIn: number, networkID: Networks, provider: ethers.Signer | ethers.providers.Provider): Promise<string> {
    const addresses = getAddresses(networkID);
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;
    const TOKEN_ADDRESS = tokenIn === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;

    const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
    const pPsiOut = await contract.calculatePurchasedFromPaid(TOKEN_ADDRESS, amountIn); //amountPaid is uint256

    return pPsiOut;
}

/*
Calculate how much will be charged to buy X pPSI
*/
export async function tokenInAmount(tokenIn: string, amountOut: number, networkID: Networks, provider: ethers.Signer | ethers.providers.Provider): Promise<string> {
    const addresses = getAddresses(networkID);
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

    const TOKEN_ADDRESS = tokenIn === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;

    const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
    const amountIn = await contract.calculatePaidFromPurchased(TOKEN_ADDRESS, amountOut);

    return amountIn;
}
