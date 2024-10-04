const HDWalletProvider = require('@truffle/hdwallet-provider');
const {Web3} = require('web3');
const { abi, evm } = require('./compile');
const bytecode = evm.bytecode.object;
// const mnemonic = process.env.MNEMONIC;

// if (!mnemonic) {
//     console.error("Mnemonic not found in environment variables");
//     process.exit(1);
// }
const  mnemonic = "concert family develop modify coffee actual ginger police tank hole web invest";
const provider = new HDWalletProvider(
    mnemonic,
    'wss://sepolia.drpc.org'
);

const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy from account', accounts[0]);

    const result = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode })
        .send({ gas: '1000000', from: accounts[0] });

    console.log('Contract deployed to', result.options.address);
    console.log(abi);
    provider.engine.stop();
};

deploy();
