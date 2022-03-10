import { ethers, constants, Contract } from "ethers";
import { calculateUserBondDetails, getBalances } from "./account-slice";
import { getAddresses } from "../../constants";
import { fetchPendingTxns, clearPendingTxn } from "./pending-txns-slice";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { fetchAccountSuccess } from "./account-slice";
import { PresaleContract } from "../../abi/index"
import { Networks } from "../../constants/blockchain";
import { getBondCalculator } from "../../helpers/bond-calculator";
import { RootState } from "../store";
import { error, warning, success, info } from "../slices/messages-slice";
import { messages } from "../../constants/messages";
import { getGasPrice } from "../../helpers/get-gas-price";
import { ust, frax } from "src/helpers/bond";
import { trim, prettifySeconds, prettyVestingPeriod } from "../../helpers";
import { setAll } from "../../helpers";


interface IGetPresaleDetails {
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    networkID: Networks;
    address: string;
}

export interface IPresaleDetails {
    contract: string;
    claimablePsi: string;
    amountBuyable: string;
    claimedPsi: string;
    vestingStart: string;
    vestingTerm: string;
    psiPrice: number;
    allowanceVal: number;
    balanceVal: number;
}

export const getPresaleDetails = createAsyncThunk("presale/getPresaleDetails", async ({ provider, networkID, address }: IGetPresaleDetails, { dispatch }) => {
    let claimablePsi = "",
        amountBuyable = "",
        claimedPsi = "",
        vestingStart = "",
        vestingTerm = "",
        psiPrice = 0;

    const addresses = getAddresses(networkID);
    let approvedContractAddress = "";
    let isApproved = false;

    let phase1Contract = new Contract(addresses.presalePhase1, PresaleContract, provider);
    let term = await phase1Contract.term;
    if(term.whitelistedAmount > 0) {
        approvedContractAddress = addresses.presalePhase1;
        isApproved = true;
    }

    /*
     *  Activate next phase by removing phase1 from above and uncommenting below
     */
    
    /*
    let phase2Contract = new Contract(addresses.presalePhase2, PresaleContract, provider);
    let term = await phase2Contract.term;
    if(term.whitelistedAmount > 0) {
        approvedContractAddress = addresses.presalePhase2;
        isApproved = true;
    }

    let phase3Contract = new Contract(addresses.presalePhase3, PresaleContract, provider);
    let term = await phase3Contract.term;
    if(term.whitelistedAmount > 0) {
        approvedContractAddress = addresses.presalePhase3;
        isApproved = true;
    }
    */
    

    let approvedContract = new Contract(approvedContractAddress, PresaleContract, provider);
    claimablePsi = await approvedContract.claimableFor(address);
    amountBuyable = await approvedContract.buyableFor(address);
    claimedPsi = await approvedContract.claimed(address);

    const vestingStartBlock = await approvedContract.vestingStart();
    const vestingTermBlock = await approvedContract.vestingPeriod();
    psiPrice = await approvedContract.pricePerBase();

    const currentBlock = await provider.getBlockNumber();
    const currentBlockTime = (await provider.getBlock(currentBlock)).timestamp;

    claimablePsi = ethers.utils.formatUnits(claimablePsi, 9);
    amountBuyable = ethers.utils.formatEther(amountBuyable);
    claimedPsi = ethers.utils.formatUnits(claimedPsi, 9);

    vestingStart = prettyVestingPeriod(currentBlock, vestingStartBlock);
    vestingTerm = prettyVestingPeriod(vestingStartBlock,(vestingStartBlock.add(vestingTermBlock)));

    const signer = provider.getSigner()
    const reserveContract = frax.getContractForReserve(networkID, signer);
    const allowance = await reserveContract.allowance(address, approvedContractAddress);
    const balance = await reserveContract.balanceOf(address);

    const allowanceVal = ethers.utils.formatEther(allowance);
    const balanceVal = ethers.utils.formatEther(balance);


    return {
        approvedContractAddress,
        claimablePsi,
        amountBuyable,
        claimedPsi,
        vestingStart,
        vestingTerm,
        psiPrice,
        allowanceVal,
        balanceVal
    }
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

export const changeApproval = createAsyncThunk("bonding/changeApproval", async ({ provider, networkID, presaleAddress, address }: IChangeApproval, { dispatch }) => {
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
        balanceVal
    }
});



interface IBuyPresale {
    value: string;
    presaleAddress: string;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

export const buyPresale = createAsyncThunk("presale/buyPresale", async ({ value, presaleAddress, provider }: IBuyPresale, { dispatch }) => {
    const valueInWei = ethers.utils.parseUnits(value.toString(), 18);

    const signer = provider.getSigner();
    const presale = new Contract(presaleAddress, PresaleContract, signer);


    let presaleTx;
    try {
        const gasPrice = await getGasPrice(provider);
        presaleTx = await presale.buy(valueInWei, { gasPrice });
        dispatch(
            fetchPendingTxns({
                txnHash: presaleTx.hash,
                text: "Purchasing from presale ",
                type: "presale"
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
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    stake: boolean;
}

export const claimPresale = createAsyncThunk("presale/claimPresale", async ({ address, presaleAddress, networkID, provider, stake }: IClaimPresale, { dispatch }) => {
    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return;
    }

   

    const signer = provider.getSigner();
    const presale = new Contract(presaleAddress, PresaleContract, signer);

    let claimTx;
    try {
        const gasPrice = await getGasPrice(provider);

        const claimablePsi = await presale.claimableFor(address);
        if(stake) {
            claimTx = await presale.stake(claimablePsi, { gasPrice });
            dispatch(
                fetchPendingTxns({
                    txnHash: claimTx.hash,
                    text: "Claiming PSI",
                    type: "claiming",
                }),
            );
        } 
        else{ 
            claimTx = await presale.claim(claimablePsi, { gasPrice });
            console.log("CLAIMTX: ",claimTx.hash);
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


export interface IPresaleSlice {
    loading: boolean;
    approvedContractAddress: string;
    claimablePsi: number;
    amountBuyable: string;
    claimedPsi: number;
    vestingStart: string;
    vestingTerm: string;
    psiPrice: number;
    allowanceVal: number;
    balanceVal: number;
}

const initialState: IPresaleSlice = {
    loading: true,
    approvedContractAddress: "",
    claimablePsi: 0,
    amountBuyable: "",
    claimedPsi: 0,
    vestingStart: "",
    vestingTerm: "",
    psiPrice: 0,
    allowanceVal: 0,
    balanceVal: 0
};

const presaleSlice = createSlice({
    name: "presale",
    initialState,
    reducers: {
        fetchPresaleSuccess(state, action) {
            setAll(state, action.payload);
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getPresaleDetails.pending, state => {
                state.loading = true;
            })
            .addCase(getPresaleDetails.fulfilled, (state, action) => {
                setAll(state, action.payload);
                state.loading = false;
            })
            .addCase(getPresaleDetails.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error);
            });
    },
});

export default presaleSlice.reducer;

export const { fetchPresaleSuccess } = presaleSlice.actions;

const baseInfo = (state: RootState) => state.presale;

export const getPresaleState = createSelector(baseInfo, claiming => claiming);