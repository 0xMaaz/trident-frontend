import { Networks } from "./blockchain";

const ONE_MAINNET = {
    SPSI_ADDRESS: "0x4BE07F1dA7D67364458F8C0E937b067baF472B3C",
    PSI_ADDRESS: "0x23eDB53026F17906cD7Fd9f4192fbD42bf61aC6d",
    STAKING_ADDRESS: "0xF1B81FE5290Abf53F690903837feb25671c415F5",
    STAKING_HELPER_ADDRESS: "0x7b222A1B02e8bE3223C56220117ef0DD33310BE1",
    PSI_BONDING_CALC_ADDRESS: "0x1e5A65bF2Bf283959665d04C13f37c71b7541081", // todo - need this
    TREASURY_ADDRESS: "0x83D22067A9503335BB996f30Bd488f163Ac4b2FD",
    FRAX_ADDRESS: "0xFa7191D292d5633f702B0bd7E3E3BcCC0e633200",
    presaleCore: "0xB20174263CD73683b1d19B84eA72EBAAa1ECB688", // for core team, uses Presale.abi (but the contract is subtly different)
};

export const getAddresses = (networkID: number) => {
    if (networkID === Networks.ONE) return ONE_MAINNET;

    throw Error("Network don't support");
};
