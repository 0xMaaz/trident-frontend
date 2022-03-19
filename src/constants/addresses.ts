import { Networks } from "./blockchain";

const ONE_MAINNET = {
    SPSI_ADDRESS: "0xbC464D465A8788b51671FaC8cF300E27407e20e4",
    PSI_ADDRESS: "0xe58E6E6Efb5B0f8A9B9DE571cf9B31D04F5dde73",
    STAKING_ADDRESS: "0x4F84933a98BdC0636B49d8e6C2e7619Ac9559D5D",
    STAKING_HELPER_ADDRESS: "0xdCf45115B8eA146CEF6C38032AD29534eb69e201",
    PSI_BONDING_CALC_ADDRESS: "0x00Bda6e44D8ca79Bc1F9a6EbBC43A919dd643145", // todo - need this
    TREASURY_ADDRESS: "0x33B9dfba0E67ab54c1a7694d1607170C408134f2",
    FRAX_ADDRESS: "0xdA0113d74D8d3fc8401090f385cD98aa3E027505",
    presaleCore: "0xd719784EFB182EB579Dc5DFD8590FBcFcf02bfFd", // for core team, uses Presale.abi (but the contract is subtly different)
    presaleContributor: "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221", // for presale phase 1,2,3 and non-core contributors. Uses Presale.abi but works differently than presalePrestaked.
    presalePhase1: "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221",
    presalePhase2: "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221",
    presalePhase3: "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221",
    presalePhase4: "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221",
    krakenSlayers: "0xB21AEa83a92e7CF4544e1C0B7dF052C4796Db7D1",
};

export const getAddresses = (networkID: number) => {
    if (networkID === Networks.ONE) return ONE_MAINNET;

    throw Error("Network don't support");
};

// SPSI_ADDRESS: "0xcAB1d656468d9e3A2F1074C82c33Dd49181aB46a",
// PSI_ADDRESS: "0xDb7f51b799FF2C10Af027b3BF9Af14b398645D83",
// STAKING_ADDRESS: "0xAdb2F5C7C7704FCeC688049c8D8199574D1D8136",
// STAKING_HELPER_ADDRESS: "0xdacF95EB6eAcCDF890e9015998C778e17AF77B99",
// PSI_BONDING_CALC_ADDRESS: "0x819323613AbC79016f9D2443a65E9811545382a5", // todo - need this
// TREASURY_ADDRESS: "0x2F46077254aAd2681ba128606000D850F1a8Dc94",

// stableToken = "0xdA0113d74D8d3fc8401090f385cD98aa3E027505"; // the USD stablecoin used in stableBond and the baseToken/stableToken LP pair. In a testing scenario, buy this for pennies on the thousands at sushiswap harmony network
// baseToken = "0xe58E6E6Efb5B0f8A9B9DE571cf9B31D04F5dde73";
// stakeToken = "0xbC464D465A8788b51671FaC8cF300E27407e20e4";
// staking = "0x4F84933a98BdC0636B49d8e6C2e7619Ac9559D5D"; // during testing rebasing happens every 4 hours
// stakingHelper = "0xdCf45115B8eA146CEF6C38032AD29534eb69e201"; // use this instead of the staking contract directly to avoid user having to do extra steps to get their stake_token
// treasury = "0x33B9dfba0E67ab54c1a7694d1607170C408134f2";
// stableBond = "0x990E354B54088e5FC362F22a23049E076f4F506e"; // during testing bonds vest over 24 hours
// lpBond = "0x1e1d881889832214224E0d77becFB2B12f56b18a"; // during testing bonds vest over 24 hours
// bondingCalculator = "0x00Bda6e44D8ca79Bc1F9a6EbBC43A919dd643145"; // calculate the value of bonds when paying with LP
// lpPool = "0x43a60F70bC0c2A339626E5994A9E3CB8e3fb6c17"; // LP pool for stableToken/baseToken on sushiswap
// wrap = "0x089C594E950D3e2Acf06977e8E0Df2d1A726Be68"; // Utility contract, don't worry about this one. Just stored here for my own memory
// presaleCore = "0xd719784EFB182EB579Dc5DFD8590FBcFcf02bfFd"; // for core team, uses Presale.abi (but the contract is subtly different)
// presaleContributor = "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221"; // for presale phase 1,2,3 and non-core contributors. Uses Presale.abi but works differently than presalePrestaked.
// presalePhase1 = "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221"; // Same as above, even the same address in test, but in live each of these will have different address and will no longer be the same one
// presalePhase2 = "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221"; // Same as above, even the same address in test, but in live each of these will have different address and will no longer be the same one
// presalePhase3 = "0xCe5A688530D725a9CE50371a7fcB1e9062Ba9221"; // Same as above, even the same address in test, but in live each of these will have different address and will no longer be the same one
// maintainers = "0x7517021999578069C9177601813d8923A4d39EB5"; // For maintainer subsidies, uses Maintainer.abi

// All addresses are on Harmony One EVM mainnet, primary shard.
// If this is a test setup you can buy the FRAX "test replacement" tokens using sushiswap, at the stableToken address. Each stableToken token is simulated to be worth $1, but you can buy 50k for like 0.001 ONE so testing can be done easily without having to wait to be sent tokens.
