import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Grid, InputAdornment, OutlinedInput, Zoom, Box } from "@material-ui/core";
import { trim } from "../../helpers";
import { changeStake, changeApproval } from "../../store/slices/stake-thunk";
import "./presale.scss";
import { useWeb3Context } from "../../hooks";
import { IPendingTxn, isPendingTxn, txnButtonText } from "../../store/slices/pending-txns-slice";
import { Skeleton } from "@material-ui/lab";
import { IReduxState } from "../../store/slices/state.interface";
import { messages } from "../../constants/messages";
import classnames from "classnames";
import { warning } from "../../store/slices/messages-slice";

import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import BondLogo from "src/components/BondLogo";
import fraxToken from "../../assets/tokens/FRAX.svg";
import ustToken from "../../assets/tokens/UST.svg";
import psiToken from "../../assets/tokens/PSI.svg";
import { getMaxTokenPurchase, getMaxPayment, getTokenPrice, tokenInAmount } from "src/helpers/pre-sale";
import { BuySpecificAmount, PaySpecificAmount, tokenOutAmount } from "src/store/slices/presale-slice";
import { getAddresses, TOKEN_DECIMALS, DEFAULT_NETWORK } from "../../constants";
import { Link, Fade, Popper } from "@material-ui/core";
import { getTokenUrl } from "../../helpers";
import { Icon } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    root: {
        backgroundColor: theme.palette.background.paper,
    },
}));

const options = [
    {
        token: "UST",
        image: ustToken,
    },
    {
        token: "FRAX",
        image: fraxToken,
    },
];

function StableCoinDropdown({ selectedIndex, setSelectedIndex }: { selectedIndex: number; setSelectedIndex: (index: any) => void }) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event: any) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const open = Boolean(anchorEl);
    const option = options[selectedIndex];

    return (
        <div className="presale-menu-root" onMouseEnter={e => handleClick(e)} onMouseLeave={e => handleClick(e)}>
            <div className="presale-menu-btn">
                <img src={option.image} width="32px" height="32px" />
                <span className="presale-menu-btn-text">{option.token}</span>
            </div>

            <Popper className="psi-menu-popper" open={open} anchorEl={anchorEl} transition>
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={200}>
                        <div className="presale-tooltip">
                            <div className="divider" />
                            {/* <div className="divider" /> */}
                            {options.map((currentOption, index) => {
                                return (
                                    //@ts-ignore
                                    <div
                                        className="presale-tooltip-item"
                                        onClick={() => {
                                            setSelectedIndex(index);
                                        }}
                                    >
                                        <img src={currentOption.image} width="32px" height="32px" />
                                        <span className="presale-menu-btn-text">{currentOption.token}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Fade>
                )}
            </Popper>
        </div>
    );
}



function Presale() {
    const dispatch = useDispatch();
    const { provider, address, connect, chainID, checkWrongNetwork } = useWeb3Context();
    const [quantity, setQuantity] = useState<string>("");
    const [tokenAmount, setTokenAmount] = useState<string>("");
    const [psiAmount, setPsiAmount] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const maximumTokenAmount = useSelector<IReduxState, string>(state => state.presale.maximumTokmaxPpsiInenAmount);

    const isAppLoading = useSelector<IReduxState, boolean>(state => state.app.loading);
    const [selectedIndex, setSelectedIndex] = React.useState(1);

    useEffect(() => {}, []);

    interface IPurchaseStableAmount {
        stableType: string;
        stableToPay: string;
        slippage: number;
        recipientAddress: string;
    }
    /*
     *  use: await dispatch( purchaseStableAmount({stableType, stableToPay, slippage, recipientAddress}) );
     */
    async function purchaseStableAmount({ stableType, stableToPay, slippage, recipientAddress }: IPurchaseStableAmount) {
        //const dispatch = useDispatch();
        const { provider, address, chainID, checkWrongNetwork } = useWeb3Context();
        if (await checkWrongNetwork()) return;
    
        await dispatch(
            PaySpecificAmount({
                networkID: chainID,
                provider,
                stableType,
                stableToPay,
            }),
        );
    }

    const onSeekApproval = async (token: string) => {
        if (await checkWrongNetwork()) return;

        await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
    };

    const handleOnChangeAmount = async (e: any) => {
        setTokenAmount(e.target.value);
        const token = options[selectedIndex].token;
        dispatch(tokenOutAmount({ networkID: chainID, provider, stableType: token, stableAmountOut: e.target.value }));
    };

    return (
        <div className="presale-view">
            <Zoom in={true}>
                <div className="presale-card">
                    <Grid className="presale-card-grid" container direction="column" spacing={2}>
                        <Grid item>
                            <div className="presale-card-header">
                                <p className="presale-card-header-title">SWAP (🔱,🔱)</p>
                            </div>
                        </Grid>

                        <div className="presale-card-area">
                            {!address && (
                                <div className="presale-card-wallet-notification">
                                    <div className="presale-card-wallet-connect-btn" onClick={connect}>
                                        <p>Connect Wallet</p>
                                    </div>
                                    <p className="presale-card-wallet-desc-text">Connect your wallet to get PSI tokens!</p>
                                </div>
                            )}
                            {address && (
                                <div>
                                    <div className="presale-card-action-area">
                                        <div className="presale-card-action-row">
                                            <OutlinedInput
                                                type="number"
                                                placeholder="0.0"
                                                className="presale-card-action-input"
                                                value={tokenAmount}
                                                onChange={e => handleOnChangeAmount(e.target.value)}
                                                labelWidth={0}
                                                startAdornment={<StableCoinDropdown selectedIndex={selectedIndex} setSelectedIndex={getMaxAmount} />}
                                            />
                                        </div>

                                        <div className="presale-card-action-row">
                                            <OutlinedInput
                                                type="number"
                                                placeholder="0.0"
                                                className="presale-card-action-input"
                                                value={quantity}
                                                onChange={e => {
                                                    return;
                                                }}
                                                labelWidth={0}
                                                startAdornment={
                                                    <Box display="flex" alignItems="center" justifyContent="center" width={"64px"}>
                                                        <img src={psiToken} style={{ height: "32px", width: "32px", marginRight: "4px" }} />
                                                        <span className="text-white">PSI</span>
                                                    </Box>
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="presale-card-wallet-notification">
                                        <div className="presale-card-wallet-connect-btn" onClick={connect}>
                                            <p>Swap</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Grid>
                </div>
            </Zoom>
        </div>
    );
}

export default Presale;
