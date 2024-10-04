const compiledTokenSwapper = require("./ethereum/build/TokenSwapper.json");
const compiledToken1 = require("./ethereum/build/Token1.json");
const compiledToken2 = require("./ethereum/build/Token2.json");

// Print the ABI of each contract in a readable format
console.log("TokenSwapper ABI:", JSON.stringify(compiledTokenSwapper.abi, null, 2));
// console.log("Token1 ABI:", JSON.stringify(compiledToken1.abi, null, 2));
// console.log("Token2 ABI:", JSON.stringify(compiledToken2.abi, null, 2));
