import { ethers } from "ethers";
import { getAddresses } from "../../constants";
import { StakingContract, SpsiTokenContract, PsiTokenContract } from "../../abi";
import { setAll } from "../../helpers";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider } from "@ethersproject/providers";
import { getTokenPrice } from "../../helpers";
import { RootState } from "../store";
import allBonds from "../../helpers/bond";

interface ILoadPresaleDetails {
    networkID: number;
    provider: JsonRpcProvider;
}

export const loadPresaleDetails = createAsyncThunk(
    "presale/loadPresaleDetails",
    //@ts-ignore
    async ({ networkID, provider }: ILoadPresaleDetails) => {
        const fraktPrice = getTokenPrice("FRAK");
        const ustPrice = getTokenPrice("UST");

        return {
            fraktPrice,
            ustPrice,
        };
    },
);

const initialState = {
    loading: true,
};

export interface IPresaleSlice {
    fraktPrice: number;
    ustPrice: number;
}

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
