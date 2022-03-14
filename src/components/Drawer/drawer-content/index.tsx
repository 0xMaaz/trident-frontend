import { useCallback, useState } from "react";
import { NavLink, Link as RouterLink } from "react-router-dom";
import Social from "./social";
import { ReactComponent as StakeIcon } from "../../../assets/icons/stake.svg";
import { ReactComponent as BondIcon } from "../../../assets/icons/bond.svg";
import TridentIcon from "../../../assets/icons/trident-nav-header2.svg";
import { ReactComponent as DashboardIcon } from "../../../assets/icons/dashboard.svg";
import { ReactComponent as DocsIcon } from "../../../assets/icons/docs.svg";
import { trim, shorten } from "../../../helpers";
import { useAddress } from "../../../hooks";
import useBonds from "../../../hooks/bonds";
import { Link, SvgIcon } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import "./drawer-content.scss";

import classnames from "classnames";

function NavContent() {
    const [isActive] = useState();
    const address = useAddress();
    const { bonds } = useBonds();

    const checkPage = useCallback((location: any, page: string): boolean => {
        const currentPath = location.pathname.replace("/", "");
        if (currentPath.indexOf("dashboard") >= 0 && page === "dashboard") {
            return true;
        }
        if (currentPath.indexOf("core") >= 0 && page === "core") {
            return true;
        }
        if (currentPath.indexOf("contributor") >= 0 && page === "contributor") {
            return true;
        }
        return false;
    }, []);

    return (
        <div className="dapp-sidebar">
            <div className="branding-header">
                <RouterLink to="/">
                    <img alt="" height="100" src={TridentIcon} />
                </RouterLink>

                {address && (
                    <div className="wallet-link">
                        <Link href={`https://explorer.harmony.one/address/${address}`} target="_blank">
                            <p>{shorten(address)}</p>
                        </Link>
                    </div>
                )}
            </div>

            <div className="dapp-menu-links">
                <div className="dapp-nav">
                    <Link
                        component={NavLink}
                        to="/dashboard"
                        isActive={(match: any, location: any) => {
                            return checkPage(location, "dashboard");
                        }}
                        className={classnames("button-dapp-menu", { active: isActive })}
                    >
                        <div className="dapp-menu-item">
                            <SvgIcon component={DashboardIcon} />
                            <p>Dashboard</p>
                        </div>
                    </Link>

                    <Link
                        component={NavLink}
                        id="presale-nav"
                        to="/core"
                        isActive={(match: any, location: any) => {
                            return checkPage(location, "core");
                        }}
                        className={classnames("button-dapp-menu", { active: isActive })}
                    >
                        <div className="dapp-menu-item">
                            <SvgIcon component={BondIcon} />
                            <p>Presale Core</p>
                        </div>
                    </Link>

                    <Link
                        component={NavLink}
                        id="presale-nav"
                        to="/contributor"
                        isActive={(match: any, location: any) => {
                            return checkPage(location, "contributor");
                        }}
                        className={classnames("button-dapp-menu", { active: isActive })}
                    >
                        <div className="dapp-menu-item">
                            <SvgIcon component={BondIcon} />
                            <p>Presale Contributor</p>
                        </div>
                    </Link>
                </div>
            </div>
            <div className="dapp-menu-doc-link">
                <Link href="https://trident.gitbook.io/trident/" target="_blank">
                    <SvgIcon component={DocsIcon} />
                    <p>Docs</p>
                </Link>
            </div>
            <Social />
        </div>
    );
}

export default NavContent;
