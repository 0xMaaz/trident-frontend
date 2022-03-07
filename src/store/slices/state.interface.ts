import { IPendingTxn } from "./pending-txns-slice";
import { IAccountSlice } from "./account-slice";
import { IAppSlice } from "./app-slice";
import { IBondSlice } from "./bond-slice";
import { IPresaleSlice } from "./presale-slice"
import { IPresaleCoreSlice } from "./presaleCore-slice";
import { MessagesState } from "./messages-slice";

export interface IReduxState {
    pendingTransactions: IPendingTxn[];
    account: IAccountSlice;
    app: IAppSlice;
    bonding: IBondSlice;
    presale: IPresaleSlice;
    presaleCore: IPresaleCoreSlice;
    messages: MessagesState;
}
