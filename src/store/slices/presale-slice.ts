import { ethers } from "ethers";
import { getAddresses } from "../../constants";
import { PpsiTokenContract, PresaleContract } from "../../abi/";
import { setAll } from "../../helpers";

import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { Bond } from "../../helpers/bond/bond";
import { Networks } from "../../constants/blockchain";
import React from "react";
import { RootState } from "../store";


interface IGetTokenPrice {
    address: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

interface ITokenPrice {
    price: string;
}

export const getTokenPrice = createAsyncThunk("presale/getTokenPrice", async ({ address, networkID, provider }: IGetTokenPrice): Promise<ITokenPrice> => {
    const addresses = getAddresses(networkID);
    const FRAX_ADDRESS = addresses.FRAX_ADDRESS;
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

    const contract = new ethers.Contract(PRESALE_CONTRACT,PresaleContract,provider);
    const PpsiPrice = await contract.getPriceForToken(FRAX_ADDRESS);

    return {
        price: ethers.utils.formatUnits(PpsiPrice, "gwei"),
    }

});

interface IGetMaxPurchase {
    address: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

interface IMaxPurchase {
    maxPpsi: string;
}

export const getMaxPurchase = createAsyncThunk("presale/getMaxPurchase", async ({ address, networkID, provider }: IGetTokenPrice): Promise<IMaxPurchase> => {
    const addresses = getAddresses(networkID);
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

    const contract = new ethers.Contract(PRESALE_CONTRACT,PresaleContract,provider);
    const maxPpsi = await contract.getMaximumPurchasePossible();

    return {
        maxPpsi: ethers.utils.formatUnits(maxPpsi, "gwei"),
    }
});

interface IGetMaxPayment {
    address: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

interface IMaxPayment {
    maxPayment: string;
}

export const getMaxPayment = createAsyncThunk("presale/getMaxPayment", async ({ address, networkID, provider }: IGetTokenPrice): Promise<IMaxPayment> => {
    const addresses = getAddresses(networkID);
    const FRAX_ADDRESS = addresses.FRAX_ADDRESS;
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

    const contract = new ethers.Contract(PRESALE_CONTRACT,PresaleContract,provider);
    const maxPay = await contract.getMaximumPaymentPossible(FRAX_ADDRESS);

    return {
        maxPayment: ethers.utils.formatUnits(maxPay, "gwei"),
    }
});

interface IGetPpsiOut {
    address: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

interface IPpsiOut {
    pPsiOut: string;
}

/*
export const getPpsiOut = createAsyncThunk("presale/getPpsiOut", async ({ address, networkID, provider }: IGetTokenPrice): Promise<IPpsiOut> => {
    const addresses = getAddresses(networkID);
    const FRAX_ADDRESS = addresses.FRAX_ADDRESS;
    const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

    const contract = new ethers.Contract(PRESALE_CONTRACT,PresaleContract,provider);
    const ppsiOut = await contract.calculatePurchasedFromPaid(FRAX_ADDRESS, )
);}*/
