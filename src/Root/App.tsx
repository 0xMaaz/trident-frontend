import { useEffect, useState, useCallback } from "react";
import { Route, Redirect, Switch } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAddress, useWeb3Context } from "../hooks";
import { calcBondDetails } from "../store/slices/bond-slice";
import { loadAppDetails } from "../store/slices/app-slice";
import { loadAccountDetails, calculateUserBondDetails } from "../store/slices/account-slice";
import { IReduxState } from "../store/slices/state.interface";
import Loading from "../components/Loader";
import useBonds from "../hooks/bonds";
import ViewBase from "../components/ViewBase";
import { Stake, ChooseBond, Bond, Dashboard, NotFound } from "../views";
import "./style.scss";
import Landing from "src/views/Landing";
import { IPresaleSlice, loadPresaleDetails } from "src/store/slices/presale-slice";
import Presale from "../views/Presale";

function App() {
    const dispatch = useDispatch();

    const { connect, provider, hasCachedProvider, chainID, connected } = useWeb3Context();
    const address = useAddress();

    const [walletChecked, setWalletChecked] = useState(false);

    const isAppLoading = useSelector<IReduxState, boolean>(state => state.app.loading);
    const isAppLoaded = useSelector<IReduxState, boolean>(state => !Boolean(state.app.marketPrice));
    const presaleData = useSelector<IReduxState, IPresaleSlice>(state => state.presale);

    const { bonds } = useBonds();

    async function loadDetails(whichDetails: string) {
        let loadProvider = provider;

        if (whichDetails === "app") {
            loadApp(loadProvider);
        }

        if (whichDetails === "presale") {
            loadPresale(loadProvider);
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

    const loadPresale = useCallback(
        loadProvider => {
            dispatch(loadPresaleDetails({ networkID: chainID, provider: loadProvider }));
        },
        [connected],
    );

    const loadAccount = useCallback(
        loadProvider => {
            dispatch(loadAccountDetails({ networkID: chainID, address, provider: loadProvider }));
        },
        [connected],
    );

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
            loadDetails("presale");
        }
    }, [walletChecked]);

    useEffect(() => {
        if (connected) {
            loadDetails("app");
            loadDetails("account");
            loadDetails("userBonds");
        }
    }, [connected]);

    if (isAppLoading) return <Loading />;

    console.log("Presale", presaleData);

    return (
        <ViewBase>
            <Switch>
                <Route exact path="/dashboard">
                    <Dashboard />
                </Route>

                <Route path="/stake">
                    <Stake />
                </Route>

                <Route path="/mints">
                    {bonds.map(bond => {
                        return (
                            <Route exact key={bond.name} path={`/mints/${bond.name}`}>
                                <Bond bond={bond} />
                            </Route>
                        );
                    })}
                    <ChooseBond />
                </Route>

                <Route path="/presale">
                    <Presale />
                </Route>

                <Route component={NotFound} />
            </Switch>
        </ViewBase>
    );
}

export default App;
