import { Networks } from "./blockchain";

const ONE_MAINNET = {
    DAO_ADDRESS: "0x78a9e536EBdA08b5b9EDbE5785C9D1D50fA3278C",
    SPSI_ADDRESS: "0x136Acd46C134E8269052c62A67042D6bDeDde3C9",
    PSI_ADDRESS: "0xb54f16fB19478766A268F172C9480f8da1a7c9C3",
    PPSI_ADDRESS: "0x10f09acce28f2ee95b9151b3cfea2ad272c5a6eb", //;)
    MIM_ADDRESS: "0x130966628846BFd36ff31a822705796e8cb8C18D",
    FRAX_ADDRESS: "0xfa7191d292d5633f702b0bd7e3e3bccc0e633200", //;)
    STAKING_ADDRESS: "0x4456B87Af11e87E329AB7d7C7A246ed1aC2168B9",
    STAKING_HELPER_ADDRESS: "0x096BBfB78311227b805c968b070a81D358c13379",
    PSI_BONDING_CALC_ADDRESS: "0x819323613AbC79016f9D2443a65E9811545382a5",
    TREASURY_ADDRESS: "0x1c46450211CB2646cc1DA3c5242422967eD9e04c",
};

export const getAddresses = (networkID: number) => {
    if (networkID === Networks.ONE) return ONE_MAINNET;

    throw Error("Network don't support");
};
