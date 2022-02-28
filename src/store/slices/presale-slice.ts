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
    claimablePsi: number;
    amountBuyable: string;
    claimedPsi: number;
    vestingStart: string;
    vestingTerm: string;
    psiPrice: number;
    allowanceVal: number;
    balanceVal: number;
}

export const getPresaleDetails = createAsyncThunk("presale/getPresaleDetails", async ({ provider, networkID, address }: IGetPresaleDetails, { dispatch }) => {
    let claimablePsi = 0,
        amountBuyable = "",
        claimedPsi = 0,
        vestingStart = "",
        vestingTerm = "",
        psiPrice = 0;

    const addresses = getAddresses(networkID);
    let approvedContractAddress = "";
    let isApproved = false;
    while(!isApproved) {
        let contributorContract = new Contract(addresses.presaleContributor, PresaleContract, provider);
        if(await contributorContract.buyableFor(address) > 0) {
            approvedContractAddress = addresses.presaleContributor;
            isApproved = true;
        }
        let phase1Contract = new Contract(addresses.presalePhase1, PresaleContract, provider);
        if(await phase1Contract.buyableFor(address) > 0) {
            approvedContractAddress = addresses.presalePhase1;
            isApproved = true;
        }
        let phase2Contract = new Contract(addresses.presalePhase2, PresaleContract, provider);
        if(await phase2Contract.buyableFor(address) > 0) {
            approvedContractAddress = addresses.presalePhase2;
            isApproved = true;
        }
        let phase3Contract = new Contract(addresses.presalePhase3, PresaleContract, provider);
        if(await phase3Contract.buyableFor(address) > 0) {
            approvedContractAddress = addresses.presalePhase3;
            isApproved = true;
        }
    }

    let approvedContract = new Contract(approvedContractAddress, PresaleContract, provider);
    let term = await approvedContract.terms(address);
    claimablePsi = await approvedContract.claimableFor(address);
    amountBuyable = await approvedContract.buyableFor(address);
    claimedPsi = await approvedContract.claimed(address);
    
    const vestingStartBlock = await approvedContract.vestingStart();
    const vestingTermBlock = await approvedContract.vestingPeriod();
    psiPrice = await approvedContract.pricePerBase();

    const currentBlock = await provider.getBlockNumber();
    const currentBlockTime = (await provider.getBlock(currentBlock)).timestamp;

    amountBuyable = ethers.utils.formatEther(amountBuyable)

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
                type: "approve_",
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

    // return dispatch(
    //     fetchAccountSuccess({
    //         ["FRAX"]: {
    //             allowance: Number(allowance),
    //             balance: Number(balanceVal),
    //         },  
    //     }),
    // );
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
    const valueInWei = ethers.utils.parseUnits(value.toString(), "gwei");

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
                type: "presale_"
            }),
        );
        dispatch(success({ text: messages.tx_successfully_send }));
        await presaleTx.wait();
        dispatch(info({ text: messages.your_balance_updated }));
        //dispatch(calculateUserBondDetails({ address, bond, networkID, provider }));
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
    contractAddress: string;
    psiAmount: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

export const claimPresale = createAsyncThunk("presale/claimPresale", async ({ address, contractAddress, psiAmount, networkID, provider }: IClaimPresale, { dispatch }) => {
    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return;
    }

    const valueInWei = ethers.utils.parseUnits(psiAmount.toString(), "ether");

    const signer = provider.getSigner();
    const presaleContract = new Contract(contractAddress, PresaleContract, signer);

    let claimTx;
    try {
        const gasPrice = await getGasPrice(provider);

        claimTx = await presaleContract.claim(valueInWei, { gasPrice });
        const pendingTxnType = "calim_presale_";
        dispatch(
            fetchPendingTxns({
                txnHash: claimTx.hash,
                text: "Claiming PSI",
                type: pendingTxnType,
            }),
        );
        dispatch(success({ text: messages.tx_successfully_send }));
        await claimTx.wait();
        // await dispatch(calculateUserBondDetails({ address, bond, networkID, provider }));
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

// const setPresaleState = (state: IPresaleSlice, payload: any) => {
//     const claim = payload.claim;
//     const newState = { ...state[claim], ...payload };
//     state[claim] = newState;
//     state.loading = false;
// };

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
