import { ethers, constants, Contract } from "ethers";
import { getBalances } from "./account-slice";
import { getAddresses } from "../../constants";
import { fetchPendingTxns, clearPendingTxn } from "./pending-txns-slice";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { PresalePrestakedContract } from "../../abi/index";
import { Networks } from "../../constants/blockchain";
import { RootState } from "../store";
import { error, warning, success, info } from "./messages-slice";
import { messages } from "../../constants/messages";
import { getGasPrice } from "../../helpers/get-gas-price";
import { frax } from "src/helpers/bond";
import { prettyVestingPeriod, setAll } from "../../helpers";

interface IGetPresaleCoreDetails {
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    networkID: Networks;
    address: string;
}

export interface IPresaleCoreDetails {
    contract: string;
    claimableFor: string;
    amountBuyable: string;
    claimedPsi: string;
    vestingStart: string;
    vestingTerm: string;
    psiPrice: number;
    allowanceVal: number;
    balanceVal: number;
    claimedSpsi: string;
    boughtAmount: string;
}

export const getPresaleCoreDetails = createAsyncThunk("presaleCore/getPresaleCoreDetails", async ({ provider, networkID, address }: IGetPresaleCoreDetails, { dispatch }) => {
    let claimableFor = "",
        amountBuyable = "",
        claimedPsi = "",
        vestingStart = "",
        vestingTerm = "",
        psiPrice = 0,
        boughtAmount = "",
        claimedSpsi = "";

    const addresses = getAddresses(networkID);
    let approvedContractAddress = addresses.presaleCore;
    let isApproved = true;
    
    let coreContract = new Contract(addresses.presaleCore, PresalePrestakedContract, provider);
    if ((await coreContract.buyableFor(address)) > 0) {
        approvedContractAddress = addresses.presaleCore;
        isApproved = true;
    } else {
        return;
    }
    
    claimableFor = await coreContract.claimableFor(address);
    amountBuyable = await coreContract.buyableFor(address);
    claimedSpsi = await coreContract.claimed(address);
    const term = await coreContract.terms(address);
    claimedPsi = term.claimedAmount;
    boughtAmount = term.boughtAmount;

    const vestingStartBlock = await coreContract.vestingStart();
    const vestingTermBlock = await coreContract.vestingPeriod();
    psiPrice = await coreContract.pricePerBase();

    const currentBlock = await provider.getBlockNumber();

    claimableFor = ethers.utils.formatUnits(claimableFor, 18);
    amountBuyable = ethers.utils.formatEther(amountBuyable);
    claimedPsi = ethers.utils.formatUnits(claimedPsi, 9);
    boughtAmount = ethers.utils.formatUnits(boughtAmount, 9);
    claimedSpsi = ethers.utils.formatUnits(claimedSpsi, 0);

    vestingStart = prettyVestingPeriod(currentBlock, vestingStartBlock);
    vestingTerm = prettyVestingPeriod(vestingStartBlock, vestingStartBlock.add(vestingTermBlock));

    const signer = provider.getSigner();
    const reserveContract = frax.getContractForReserve(networkID, signer);
    const allowance = await reserveContract.allowance(address, approvedContractAddress);
    const balance = await reserveContract.balanceOf(address);

    const allowanceVal = ethers.utils.formatEther(allowance);
    const balanceVal = ethers.utils.formatEther(balance);

    approvedContractAddress = addresses.presaleCore;

    return {
        approvedContractAddress,
        claimableFor,
        amountBuyable,
        claimedPsi,
        vestingStart,
        vestingTerm,
        psiPrice,
        allowanceVal,
        balanceVal,
        claimedSpsi,
        boughtAmount,
    };
});

interface IChangeApproval {
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    networkID: Networks;
    presaleAddress: string;
    address: string;
}

export interface allowanceDetails {
    allowance: number;
    balance: number;
}

export const changeApproval = createAsyncThunk("presaleCore/changeApproval", async ({ provider, networkID, presaleAddress, address }: IChangeApproval, { dispatch }) => {
    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return;
    }

    const signer = provider.getSigner();
    const reserveContract = frax.getContractForReserve(networkID, signer);

    let approveTx;
    try {
        const gasPrice = await getGasPrice(provider);
        approveTx = await reserveContract.approve(presaleAddress, constants.MaxUint256, { gasPrice });
        dispatch(
            fetchPendingTxns({
                txnHash: approveTx.hash,
                text: "Approving",
                type: "approving",
            }),
        );
        dispatch(success({ text: messages.tx_successfully_send }));
        await approveTx.wait();
    } catch (err: any) {
        dispatch(error({ text: messages.something_wrong, error: err }));
    } finally {
        if (approveTx) {
            dispatch(clearPendingTxn(approveTx.hash));
        }
    }

    let allowance,
        balance = "0";

    allowance = await reserveContract.allowance(address, presaleAddress);
    balance = await reserveContract.balanceOf(address);
    const balanceVal = ethers.utils.formatEther(balance);

    return {
        allowance,
        balanceVal,
    };
});

interface IBuyPresale {
    value: string;
    presaleAddress: string;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

export const buyPresale = createAsyncThunk("presaleCore/buyPresale", async ({ value, presaleAddress, provider }: IBuyPresale, { dispatch }) => {
    const valueInWei = ethers.utils.parseUnits(value.toString(), 18);

    const signer = provider.getSigner();
    const coreContract = new Contract(presaleAddress, PresalePrestakedContract, signer);

    let presaleTx;
    try {
        const gasPrice = await getGasPrice(provider);
        presaleTx = await coreContract.buy(valueInWei, { gasPrice });
        dispatch(
            fetchPendingTxns({
                txnHash: presaleTx.hash,
                text: "Purchasing from presale ",
                type: "presale",
            }),
        );
        dispatch(success({ text: messages.tx_successfully_send }));
        await presaleTx.wait();
        dispatch(info({ text: messages.your_balance_updated }));
        return;
    } catch (err: any) {
        if (err.code === -32603 && err.message.indexOf("ds-math-sub-underflow") >= 0) {
            dispatch(error({ text: "You may be trying to purchase more than your balance! Error code: 32603. Message: ds-math-sub-underflow", error: err }));
        } else if (err.code === -32603 && err.data && err.data.message) {
            const msg = err.data.message.includes(":") ? err.data.message.split(":")[1].trim() : err.data.data || err.data.message;
            dispatch(error({ text: msg, error: err }));
        } else dispatch(error({ text: messages.something_wrong, error: err }));
        return;
    } finally {
        if (presaleTx) {
            dispatch(clearPendingTxn(presaleTx.hash));
        }
    }
});

interface IClaimPresale {
    address: string;
    presaleAddress: string;
    value: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    stake: boolean;
}

export const claimPresale = createAsyncThunk("presaleCore/claimPresale", async ({ address, presaleAddress, value, networkID, provider, stake }: IClaimPresale, { dispatch }) => {
    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return;
    }

    if (value == "") {
        dispatch(warning({ text: messages.before_minting }));
        return;
    }

    const valueInWei = ethers.utils.parseUnits(value.toString(), 18);

    const signer = provider.getSigner();
    const coreContract = new Contract(presaleAddress, PresalePrestakedContract, signer);

    const claimableFor = await coreContract.claimableFor(address);
    if(claimableFor < valueInWei) {
        dispatch(error({ text: messages.try_mint_more(ethers.utils.formatUnits(claimableFor, 18)) }));
        return;
    }

    let claimTx;
    try {
        const gasPrice = await getGasPrice(provider);
        if (stake) {
            claimTx = await coreContract.stake(valueInWei, stake, { gasPrice });
            dispatch(
                fetchPendingTxns({
                    txnHash: claimTx.hash,
                    text: "Claiming PSI",
                    type: "claiming",
                }),
            );
        } else {
            claimTx = await coreContract.claim(valueInWei, { gasPrice });
            dispatch(
                fetchPendingTxns({
                    txnHash: claimTx.hash,
                    text: "Claiming PSI",
                    type: "claiming",
                }),
            );
        }
        dispatch(success({ text: messages.tx_successfully_send }));
        await claimTx.wait();
        dispatch(getBalances({ address, networkID, provider }));
        dispatch(info({ text: messages.your_balance_updated }));
        return;
    } catch (err: any) {
        dispatch(error({ text: messages.something_wrong, error: err.message }));
    } finally {
        if (claimTx) {
            dispatch(clearPendingTxn(claimTx.hash));
        }
    }
});

export interface IPresaleCoreSlice {
    loading: boolean;
    approvedContractAddress: string;
    claimableFor: number;
    amountBuyable: string;
    claimedPsi: number;
    vestingStart: string;
    vestingTerm: string;
    psiPrice: number;
    allowanceVal: number;
    balanceVal: number;
    claimedSpsi: number;
    boughtAmount: number;
}

const initialState: IPresaleCoreSlice = {
    loading: true,
    approvedContractAddress: "",
    claimableFor: 0,
    amountBuyable: "",
    claimedPsi: 0,
    vestingStart: "",
    vestingTerm: "",
    psiPrice: 0,
    allowanceVal: 0,
    balanceVal: 0,
    claimedSpsi: 0,
    boughtAmount: 0,
};

const presaleCoreSlice = createSlice({
    name: "presaleCore",
    initialState,
    reducers: {
        fetchPresaleSuccess(state, action) {
            setAll(state, action.payload);
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getPresaleCoreDetails.pending, state => {
                state.loading = true;
            })
            .addCase(getPresaleCoreDetails.fulfilled, (state, action) => {
                setAll(state, action.payload);
                state.loading = false;
            })
            .addCase(getPresaleCoreDetails.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error);
            });
    },
});

export default presaleCoreSlice.reducer;

export const { fetchPresaleSuccess } = presaleCoreSlice.actions;

const baseInfo = (state: RootState) => state.presaleCore;

export const getPresaleCoreState = createSelector(baseInfo, claiming => claiming);
