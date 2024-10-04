import Web3 from "web3";

let web3;

if (typeof window.ethereum !== 'undefined') {
  // Ethereum provider detected
  console.log("Ethereum provider is available.");
  try {
    // Request account access
    window.ethereum.request({ method: "eth_requestAccounts" });

    // Create a new Web3 instance using the injected provider
    web3 = new Web3(window.ethereum);

    console.log("Web3 has been injected and is ready to use.");
  } catch (error) {
    console.error("Error accessing accounts:", error);
  }
} else if (typeof window.web3 !== 'undefined') {
  // Legacy dapp browsers that provide web3
  web3 = new Web3(window.web3.currentProvider);
  console.log("Legacy dapp browser detected.");
} else {
  // No provider found
  console.error("No Ethereum provider found. Install MetaMask or another wallet.");
}

export default web3;
