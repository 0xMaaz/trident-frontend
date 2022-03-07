import { useEffect, useState, useCallback } from "react";
import { Route, Redirect, Switch } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAddress, useWeb3Context } from "../hooks";
import { calcBondDetails } from "../store/slices/bond-slice";
import { getPresaleDetails } from "../store/slices/presale-slice";
import { loadAppDetails } from "../store/slices/app-slice";
import { loadAccountDetails, calculateUserBondDetails } from "../store/slices/account-slice";
import { DEFAULT_NETWORK } from "../constants";
import { IReduxState } from "../store/slices/state.interface";
import Loading from "../components/Loader";
import useBonds from "../hooks/bonds";
import ViewBase from "../components/ViewBase";
import { Stake, ChooseBond, Bond, Presale, Dashboard, PhaserGame } from "../views";
import "./style.scss";
import Landing from "src/views/Landing";
import classNames from "classnames";

function App() {
    const dispatch = useDispatch();

    const { connect, provider, hasCachedProvider, chainID, connected } = useWeb3Context();
    const address = useAddress();

    const [walletChecked, setWalletChecked] = useState(false);

    const [dashboardActive, setDashboardActive] = useState(false); // Closed by default, opened ingame as needed.
    const [stakingActive, setStakingActive] = useState(false); // Closed by default, opened ingame as needed.
    const [bondingActive, setBondingActive] = useState(false); // Closed by default, opened ingame as needed.
    const [socialActive, setSocialActive] = useState(true); // Social open by default, open during menu. Closed during games.
    const [connectButtonActive, setConnectButtonActive] = useState(true); // Connect button open by default, open during menu. Closed during games.

    const [exitButtonOpen, setExitButtonOpen] = useState(true);

    const isAppLoading = useSelector<IReduxState, boolean>(state => state.app.loading);
    const isAppLoaded = useSelector<IReduxState, boolean>(state => !Boolean(state.app.marketPrice));

    const { bonds } = useBonds();

    async function loadDetails(whichDetails: string) {
        let loadProvider = provider;

        if (whichDetails === "app") {
            loadApp(loadProvider);
        }

        if (whichDetails === "account" && address && connected) {
            loadAccount(loadProvider);
            if (isAppLoaded) return;

            loadApp(loadProvider);
        }

        if (whichDetails === "userBonds" && address && connected) {
            bonds.map(bond => {
                dispatch(calculateUserBondDetails({ address, bond, provider, networkID: chainID }));
            });
            dispatch(getPresaleDetails({ provider, networkID: chainID, address }))
        }
    }

    const loadApp = useCallback(
        loadProvider => {
            dispatch(loadAppDetails({ networkID: chainID, provider: loadProvider }));
            bonds.map(bond => {
                dispatch(calcBondDetails({ bond, value: null, provider: loadProvider, networkID: chainID }));
            });
        },
        [connected],
    );

    const loadAccount = useCallback(
        loadProvider => {
            dispatch(loadAccountDetails({ networkID: chainID, address, provider: loadProvider }));
        },
        [connected],
    );

    /**
     * @TODO Fix URL for prod.
     *
     * phaserMessageHandler interprets input from the Phaser game canvas to control the UI.
     **/
    const phaserMessageHandler = (e: any) => {
        // if (e.origin.startsWith("http://app.trident.localhost:3000")) {
        if (e.origin.startsWith(window.location.origin)) {
            let msg = e.data.toString();
            if (msg.startsWith("closeDashboard")) {
                setDashboardActive(false);
            } else if (msg.startsWith("closeStaking")) {
                setStakingActive(false);
            } else if (msg.startsWith("closeBonding")) {
                setBondingActive(false);
            } else if (msg.startsWith("closeSocial")) {
                setSocialActive(false);
            } else if (msg.startsWith("closeConnectButton")) {
                setConnectButtonActive(false);
            } else if (msg.startsWith("openDashboard")) {
                setDashboardActive(true);
            } else if (msg.startsWith("openStaking")) {
                setStakingActive(true);
            } else if (msg.startsWith("openBonding")) {
                setBondingActive(true);
            } else if (msg.startsWith("openSocial")) {
                setSocialActive(true);
            } else if (msg.startsWith("openConnectButton")) {
                setConnectButtonActive(true);
            } else if (msg.startsWith("closeExitButton")) {
                setExitButtonOpen(false);
            } else if (msg.startsWith("openExitButton")) {
                setExitButtonOpen(true);
            } else if (msg.startsWith("hideUI")) {
                setSocialActive(false);
                setConnectButtonActive(false);
            } else if (msg.startsWith("showUI")) {
                setSocialActive(true);
                setConnectButtonActive(true);
            }
        } else {
            return;
        }
    };

    useEffect(() => {
        window.addEventListener("message", phaserMessageHandler, false);
    }, []);

    useEffect(() => {
        if (hasCachedProvider()) {
            connect().then(() => {
                setWalletChecked(true);
            });
        } else {
            setWalletChecked(true);
        }
    }, []);

    useEffect(() => {
        if (walletChecked) {
            loadDetails("app");
            loadDetails("account");
            loadDetails("userBonds");
        }
    }, [walletChecked]);

    useEffect(() => {
        if (connected) {
            loadDetails("app");
            loadDetails("account");
            loadDetails("userBonds");
        }
    }, [connected]);

    return (
        <>
            {isAppLoading && <Loading />}
            <div id="phaser-wrapper">
                <PhaserGame connected={(connected && chainID === DEFAULT_NETWORK) || false} exitButtonOpen={exitButtonOpen} />
            </div>
            <ViewBase socialIsOpen={socialActive} connectButtonIsOpen={connectButtonActive}>
                <div className={classNames("psi-interface", "psi-dashboard")}>
                    <Dashboard active={dashboardActive} />
                </div>
                <div className={classNames("psi-interface", "psi-staking")}>
                    <Stake active={stakingActive} />
                </div>
                <div className={classNames("psi-interface", "psi-presale")}>
                    <Presale />
                </div>
                <Switch>
                    <div className={classNames("psi-interface", "psi-bonding")}>
                        {bonds.map(bond => {
                            return (
                                <Route exact key={bond.name} path={`/mints/${bond.name}`}>
                                    <Bond bond={bond} />
                                </Route>
                            );
                        })}
                        <ChooseBond active={bondingActive} />
                    </div>
                </Switch>
            </ViewBase>
        </>
    );
}

export default App;
