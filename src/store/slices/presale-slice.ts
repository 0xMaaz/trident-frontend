import { ethers } from "ethers";
import { getAddresses } from "../../constants";
import { StakingContract, SpsiTokenContract, PsiTokenContract, PpsiTokenContract, PresaleContract } from "../../abi";
import { setAll } from "../../helpers";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider } from "@ethersproject/providers";
import { getTokenPrice } from "../../helpers";
import { RootState } from "../store";
import { warning, success, info, error } from "../../store/slices/messages-slice";
import { messages } from "../../constants/messages";
import { getGasPrice } from "../../helpers/get-gas-price";

interface ILoadPresaleDetails {
    networkID: number;
    provider: JsonRpcProvider;
    stableType: string; // Is this ok to have for initial load?
}

export interface IPresaleSlice {
    tokenPrice: string;
    maxPpsiIn: string;
    maxStableOut: string;
}

export const loadPresaleDetails = createAsyncThunk(
    "presale/loadPresaleDetails",
    //@ts-ignore
    async ({ networkID, provider, stableType }: ILoadPresaleDetails) => {
        const addresses = getAddresses(networkID);
        const TOKEN_ADDRESS = stableType === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;
        const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;
        const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
        //The cost of 1 pPSI
        const PpsiPrice = await contract.getPriceForToken(TOKEN_ADDRESS);
        //How many pPSI the caller is whitelisted to buy
        const maxPpsiIn = await contract.getMaximumPurchasePossible();
        // How much the buyer needs to spend to buy the maximum amount they are whitelisted for
        const maxStableOut = await contract.getMaximumPaymentPossible(TOKEN_ADDRESS);

        return {
            tokenPrice: ethers.utils.formatUnits(PpsiPrice, "gwei"),
            maxPpsiIn: ethers.utils.formatUnits(maxPpsiIn, "gwei"),
            maxStableOut: ethers.utils.formatUnits(maxStableOut, "gwei"),
        };
    },
);

interface IGetTokenOut {
    networkID: number;
    provider: JsonRpcProvider;
    stableType: string;
    stableAmountOut: number;
}

export interface ItokenOutAmount {
    ppsiAmountIn: string;
}

export const tokenOutAmount = createAsyncThunk(
    "presale/tokenOutAmount",
    //@ts-ignore
    async ({ networkID, provider, stableType, stableAmountOut }: IGetTokenOut) => {
        const addresses = getAddresses(networkID);
        const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;
        const TOKEN_ADDRESS = stableType === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;
        const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
        const ppsiIn = await contract.calculatePurchasedFromPaid(TOKEN_ADDRESS, stableAmountOut); //stableAmount is uint256
        return { tokenOut: ethers.utils.formatUnits(ppsiIn, "gwei") };
    },
);

interface IGetTokenIn {
    networkID: number;
    provider: JsonRpcProvider;
    stableType: string;
    ppsiAmountIn: number;
}

export interface ItokenInAmount {
    stableAmountOut: string;
}

export const tokenInAmount = createAsyncThunk(
    "presale/tokenInAmount",
    //@ts-ignore
    async ({ networkID, provider, stableType, ppsiAmountIn }: IGetTokenIn) => {
        const addresses = getAddresses(networkID);
        const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;
        const TOKEN_ADDRESS = stableType === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;
        const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
        const stableAmountOut = await contract.calculatePaidFromPurchased(TOKEN_ADDRESS, ppsiAmountIn); //amountIn is uint256
        return { tokenOut: ethers.utils.formatUnits(stableAmountOut, "gwei") };
    },
);

interface IBuySpecificAmount {
    networkID: number;
    provider: JsonRpcProvider;
    stableType: string;
    ppsiToPurchase: string;
}

export const BuySpecificAmount = createAsyncThunk(
    "presale/buySpecificAmount",
    //@ts-ignore
    async ({ networkID, provider, stableType, ppsiToPurchase }: IBuySpecificAmount, { dispatch }) => {
        if (!provider) {
            dispatch(warning({ text: messages.please_connect_wallet }));
            return;
        }
        const signer = provider.getSigner();
        const addresses = getAddresses(networkID);
        const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;
        const TOKEN_ADDRESS = stableType === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;
        const stableContract = new ethers.Contract(addresses.PSI_ADDRESS, PsiTokenContract, signer);
        const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
        let approveTx;
        let purchaseTx;
        try {
            const gasPrice = await getGasPrice(provider);

            approveTx = await stableContract.approve(PRESALE_CONTRACT, ethers.constants.MaxUint256, { gasPrice });
            const text = "Approve " + (stableType === "FRAX" ? "FRAX" : "UST");
            const pendingTxnType = stableType === "FRAX" ? "FRAX" : "UST";
            // dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));
            dispatch(success({ text: messages.tx_successfully_send }));
            await approveTx.wait();
            const text2 = "Swapping";
            purchaseTx = await contract.buySpecificAmount(TOKEN_ADDRESS, ppsiToPurchase);
            dispatch(success({ text: messages.tx_successfully_send }));
        } catch (err: any) {
            dispatch(error({ text: messages.something_wrong, error: err.message }));
            return;
        } finally {
            if (approveTx) {
                // dispatch(clearPendingTxn(approveTx.hash));
            }
        }
    },
);

interface IPaySpecificAmount {
    networkID: number;
    provider: JsonRpcProvider;
    stableType: string;
    stableToPay: string;
}

export const PaySpecificAmount = createAsyncThunk(
    "presale/paySpecificAmount",
    //@ts-ignore
    async ({ networkID, provider, stableType, stableToPay }: IPaySpecificAmount, { dispatch }) => {
        if (!provider) {
            dispatch(warning({ text: messages.please_connect_wallet }));
            return;
        }
        const signer = provider.getSigner();
        const addresses = getAddresses(networkID);
        const PRESALE_CONTRACT = addresses.PRESALE_CONTRACT;
        const TOKEN_ADDRESS = stableType === "FRAX" ? addresses.FRAX_ADDRESS : addresses.UST_ADDRESS;
        const stableContract = new ethers.Contract(addresses.PSI_ADDRESS, PsiTokenContract, signer);
        const contract = new ethers.Contract(PRESALE_CONTRACT, PresaleContract, provider);
        let approveTx;
        let purchaseTx;
        try {
            const gasPrice = await getGasPrice(provider);

            approveTx = await stableContract.approve(PRESALE_CONTRACT, ethers.constants.MaxUint256, { gasPrice });
            const text = "Approve " + (stableType === "FRAX" ? "FRAX" : "UST");
            const pendingTxnType = stableType === "FRAX" ? "FRAX" : "UST";
            // dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));
            dispatch(success({ text: messages.tx_successfully_send }));
            await approveTx.wait();
            const text2 = "Swapping";
            purchaseTx = await contract.buyWithSpecificPayment(TOKEN_ADDRESS, stableToPay);
            dispatch(success({ text: messages.tx_successfully_send }));
        } catch (err: any) {
            dispatch(error({ text: messages.something_wrong, error: err.message }));
            return;
        } finally {
            if (approveTx) {
                // dispatch(clearPendingTxn(approveTx.hash));
            }
        }
    },
);

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
