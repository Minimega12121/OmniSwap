const HDWalletProvider = require("@truffle/hdwallet-provider");
const {Web3} = require("web3"); // Fix the import of Web3
const fs = require('fs');
const path = require('path');

// Define the path to the deploy details file
const deployDetailsPath = path.join(__dirname, 'deploy_details.json');

const compiledTokenSwapper = require("./ethereum/build/TokenSwapper.json");
const compiledToken1 = require("./ethereum/build/Token1.json");
const compiledToken2 = require("./ethereum/build/Token2.json");

const bytecodeTokenSwapper = compiledTokenSwapper.evm.bytecode.object;
const bytecodeToken1 = compiledToken1.evm.bytecode.object;
const bytecodeToken2 = compiledToken2.evm.bytecode.object;

const abiTokenSwapper = compiledTokenSwapper.abi;
const abiToken1 = compiledToken1.abi;
const abiToken2 = compiledToken2.abi;

const mnemonic =
  "concert family develop modify coffee actual ginger police tank hole web invest";
  //wss://sepolia.drpc.org
  //https://rpc-amoy.polygon.technology/
  //https://avalanche-fuji-c-chain-rpc.publicnode.com
const provider = new HDWalletProvider(mnemonic, "https://rpc-amoy.polygon.technology/");

const web3 = new Web3(provider);

let token1Mined = 10000;
let token2Mined = 10000;


// Function to update the JSON file with new data
const updateDeployDetails = (key, address) => {
  let deployDetails = {};

  // Check if the file exists
  if (fs.existsSync(deployDetailsPath)) {
    // Read the existing data
    const fileContent = fs.readFileSync(deployDetailsPath);
    deployDetails = JSON.parse(fileContent);
  }

  // Update the deploy details with the new address
  deployDetails[key] = address;

  // Write the updated data back to the file
  fs.writeFileSync(deployDetailsPath, JSON.stringify(deployDetails, null, 2));
};

const deployToken1 = async () => {
  const currentGasPrice = await web3.eth.getGasPrice();
  const accounts = await web3.eth.getAccounts();
  console.log("Attempting to deploy Token1 from account", accounts[0]);

  const result = await new web3.eth.Contract(abiToken1)
    .deploy({ data: bytecodeToken1 })
    .send({ gas: "2000000", from: accounts[0], gasPrice: web3.utils.toWei('30', 'gwei') });

  console.log("Token1 deployed to", result.options.address);

  // Store the Token1 address in the deploy details file
  updateDeployDetails('Token1', result.options.address);

  return result.options.address;
};

const deployToken2 = async () => {
  const currentGasPrice = await web3.eth.getGasPrice();
  const accounts = await web3.eth.getAccounts();
  console.log("Attempting to deploy Token2 from account", accounts[0]);

  const result = await new web3.eth.Contract(abiToken2)
    .deploy({ data: bytecodeToken2 })
    .send({ gas: "2000000", from: accounts[0], gasPrice: web3.utils.toWei('30', 'gwei') });

  console.log("Token2 deployed to", result.options.address);

  // Store the Token2 address in the deploy details file
  updateDeployDetails('Token2', result.options.address);

  return result.options.address;
};

const deployTokenSwapper = async (token1Address, token2Address) => {
  const accounts = await web3.eth.getAccounts();
  console.log("Attempting to deploy TokenSwapper from account", accounts[0]);

  const result = await new web3.eth.Contract(abiTokenSwapper)
    .deploy({
      data: bytecodeTokenSwapper,
      arguments: [token1Address, token2Address],
    })
    .send({ gas: "3000000", from: accounts[0], gasPrice: web3.utils.toWei('30', 'gwei') });

  console.log("TokenSwapper deployed to", result.options.address);

  // Store the TokenSwapper address in the deploy details file
  updateDeployDetails('TokenSwapper', result.options.address);

  return result.options.address;
};

const main = async () => {
  try {
    const accounts = await web3.eth.getAccounts();
    const initialaccountBalance = await web3.eth.getBalance(accounts[0]);
    console.log('Account balance:', web3.utils.fromWei(initialaccountBalance, 'ether'), 'ETH');

    const token1Address =  '0xae508A061eb0CFd8Fd203cDBc1d55AE8Ad4d9Ae2';
    const token2Address = '0x24C7e8dC3fF972Ad2c90A17679Fbbe9108cD1B85';
    await deployTokenSwapper(token1Address, token2Address);
    const finalaccountBalance = await web3.eth.getBalance(accounts[0]);
    console.log('Cost of deployment:', web3.utils.fromWei(initialaccountBalance - finalaccountBalance, 'ether'), 'ETH');

  } catch (error) {
    console.log("Error during deployment:", error);
  } finally {
    provider.engine.stop(); // Ensure the provider is stopped after deployment
  }
};
//0x713aF13Cc5831088Fe2fafebC9aA7B8698F9f897
main(); // Call the main function to start the deployment process
