import { ethers } from "ethers";
import { getAddresses } from "../../constants";
import { StakingContract, SpsiTokenContract, PsiTokenContract, PpsiTokenContract, PresaleContract } from "../../abi";
import { setAll } from "../../helpers";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider } from "@ethersproject/providers";
import { getTokenPrice } from "../../helpers";
import { RootState } from "../store";
import allBonds from "../../helpers/bond";

interface ILoadPresaleDetails {
    networkID: number;
    provider: JsonRpcProvider;
    tokenIn: string;
}

export interface IPresaleSlice {
    tokenPrice: string;
    maxPpsi: string;
    maxPayment: string; 
}

export const loadPresaleDetails = createAsyncThunk(
    "presale/loadPresaleDetails",
    //@ts-ignore
    async ({ networkID, provider, tokenIn }: ILoadPresaleDetails) => {
        const addresses = getAddresses(networkID);
        const TOKEN_ADDRESS = tokenIn === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;
        const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;

        const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);

        //The cost of 1 pPSI
        const PpsiPrice = await contract.getPriceForToken(TOKEN_ADDRESS);
        
        //How many pPSI the caller is whitelisted to buy
        const maxPpsiOut = await contract.getMaximumPurchasePossible();
        
        // How much the buyer needs to spend to buy the maximum amount they are whitelisted for
        const maxTokenIn = await contract.getMaximumPaymentPossible(TOKEN_ADDRESS);

        return {
            PpsiPrice,
            maxPpsiOut,
            maxTokenIn,
        };
    },
);
/*
interface ItokenInDetails {
    networkID: number;
    provider: JsonRpcProvider;
    tokenIn: string;
}

export interface ItokenOutAmount {
    tokenPrice: string;
    maxPpsi: string;
    maxPayment: string; 
}

export const tokenOutAmount = createAsyncThunk(
    "presale/tokenOutAmount",
    //@ts-ignore
    async ({ networkID, provider, tokenIn }: ITokenOutAmount): Promise<IPresaleSlice> => {

    }

*/

const initialState = {
    loading: true,
};

const presale = createSlice({
    name: "presale",
    initialState,
    reducers: {
        fetchAppSuccess(state, action) {
            setAll(state, action.payload);
        },
    },
    extraReducers: builder => {
        builder
            .addCase(loadPresaleDetails.pending, (state, action) => {
                state.loading = true;
            })
            .addCase(loadPresaleDetails.fulfilled, (state, action) => {
                setAll(state, action.payload);
                state.loading = false;
            })
            .addCase(loadPresaleDetails.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error);
            });
    },
});

const baseInfo = (state: RootState) => state.presale;

export default presale.reducer;

export const { fetchAppSuccess } = presale.actions;

export const getPresaleState = createSelector(baseInfo, app => app);
