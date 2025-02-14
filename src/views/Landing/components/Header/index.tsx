import React from "react";
import "./header.scss";
import TridentIcon from "../../../../assets/icons/Logo.png";
import { Link, Box } from "@material-ui/core";

function Header() {
    return (
        <div className="landing-header">
            <img id="logo" src={TridentIcon} />
            <div className="landing-header-nav-wrap">
                <Box component="div" className="landing-header-nav-box">
                    <Link href="https://github.com/0xMaaz/trident-frontend" target="_blank">
                        <span className="landing-header-nav-text">GitHub</span>
                    </Link>
                    <Link href="https://twitter.com/TridentDAO?s=20" target="_blank">
                        <span className="landing-header-nav-text">Twitter</span>
                    </Link>
                    <Link href="https://discord.gg/4ZSaZvMGtQ" target="_blank">
                        <span className="landing-header-nav-text">Discord</span>
                    </Link>
                </Box>
            </div>
        </div>
    );
}

export default Header;
