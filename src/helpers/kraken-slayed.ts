import { ethers } from "ethers"; 
import { KrakenSlayersContract } from "src/abi"; 
import { getAddresses } from "src/constants";
import { Networks } from "src/constants/blockchain";
import variables from "../views/Phaser/managers/Variables"
const request = require('request');


export const krakenSlayed = async (provider: any, address: any) => {
    const message = "Sign to confirm that you have slayed the Kraken!";
    let signedMessage = "";
    try {
        const signer = provider.getSigner();
        console.log("Message", message);
        signedMessage = await signer.signMessage(message);
        console.log("SignedMessage", signedMessage);
    } catch (error) {
        console.error(error);
    }

    const options = {
        //url: 'http://localhost:9898/finish',
        url: 'https://enigmatic-dawn-71860.herokuapp.com/finish',
        json: true,
        body: {
            "message": message,
            "signed": signedMessage
        }
    };

    await request.post(options, (err: any, res: any, body: any) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Status: ${res.statusCode}`);
        if(res.statusCode == 200) {
            checkAfterSign(provider, address)
        }
        console.log(body);
    });
};

export const checkKrakenSlayed = async (provider: any, address: any) => {
    const addresses = getAddresses(Networks.ONE);
    const krakenContract = new ethers.Contract(addresses.krakenSlayers, KrakenSlayersContract, provider);
    const isWinner = await krakenContract.passedGame(address);
    console.log("IS WINNER? ", isWinner)
    if(isWinner) {
        variables.accountIsGoatedWithTheSauce = true;
    }
}

async function checkAfterSign(provider: any, address: any) {
    const addresses = getAddresses(Networks.ONE);

    let check = false;
    while(!check) {
        const krakenContract = new ethers.Contract(addresses.krakenSlayers, KrakenSlayersContract, provider);
        const isWinner = await krakenContract.passedGame(address);
        console.log("IS WINNER? ", isWinner)
        if(isWinner) {
            variables.accountIsGoatedWithTheSauce = true;
            check = true;
        }
        await new Promise(f => setTimeout(f, 5000));  
    }
}