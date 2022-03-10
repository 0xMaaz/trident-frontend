import { IPendingTxn } from "./pending-txns-slice";
import { IAccountSlice } from "./account-slice";
import { IAppSlice } from "./app-slice";
import { IBondSlice } from "./bond-slice";
import { IPresaleCoreSlice } from "./presaleCore-slice";
import { IPresaleContrSlice } from "./presaleContr-slice"
import { MessagesState } from "./messages-slice";

export interface IReduxState {
    pendingTransactions: IPendingTxn[];
    account: IAccountSlice;
    app: IAppSlice;
    bonding: IBondSlice;
    presaleCore: IPresaleCoreSlice;
    presaleContr: IPresaleContrSlice;
    messages: MessagesState;
}
