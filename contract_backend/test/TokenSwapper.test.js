const assert = require('assert');
const {Web3} = require('web3');
const ganache = require('ganache');

// Compiled contract artifacts
const compiledTokenSwapper = require('../ethereum/build/TokenSwapper.json');
const compiledToken1 = require('../ethereum/build/Token1.json');
const compiledToken2 = require('../ethereum/build/Token2.json');

// Initialize Web3 with Ganache provider
const web3 = new Web3(ganache.provider());

let accounts;
let Token1;
let Token2;
let TokenSwapper;

const dec = 1e18;  // For handling 18 decimals in token amounts

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    // Deploy Token1 contract
    Token1 = await new web3.eth.Contract(compiledToken1.abi)
        .deploy({ data: compiledToken1.evm.bytecode.object })
        .send({ from: accounts[0], gas: '10000000' });

    // Deploy Token2 contract
    Token2 = await new web3.eth.Contract(compiledToken2.abi)
        .deploy({ data: compiledToken2.evm.bytecode.object })
        .send({ from: accounts[0], gas: '10000000' });

    // Deploy TokenSwapper contract
    TokenSwapper = await new web3.eth.Contract(compiledTokenSwapper.abi)
        .deploy({
            data: compiledTokenSwapper.evm.bytecode.object,
            arguments: [Token1.options.address, Token2.options.address]
        })
        .send({ from: accounts[0], gas: '10000000' });
});

describe('TokenSwapper', async () => {
it('adds liquidity to the pool', async () => {
    let amountOfToken1Added = web3.utils.toWei('1000', 'ether');  // 1001 tokens with 18 decimals
    let amountOfToken2Added = web3.utils.toWei('2000', 'ether');  // 2001 tokens with 18 decimals

    // Approve the TokenSwapper contract to spend token1 and token2
    await Token1.methods.approve(TokenSwapper.options.address, amountOfToken1Added*1.02).send({ from: accounts[0] });
    await Token2.methods.approve(TokenSwapper.options.address, amountOfToken2Added*1.02).send({ from: accounts[0] });

    // Add liquidity separately for token1 and token2
    await TokenSwapper.methods.addLiquiditytoken1(amountOfToken1Added).send({ from: accounts[0], gas: 500000 });
    await TokenSwapper.methods.addLiquiditytoken2(amountOfToken2Added).send({ from: accounts[0], gas: 500000 });

    // Fetch the contract balances
    const token1Balance = await Token1.methods.balanceOf(TokenSwapper.options.address).call();
    const token2Balance = await Token2.methods.balanceOf(TokenSwapper.options.address).call();

    // Assert that the liquidity was added successfully
    assert.equal(token1Balance, amountOfToken1Added, "Token1 liquidity added correctly");
    assert.equal(token2Balance, amountOfToken2Added, "Token2 liquidity added correctly");
});

it('contract swaps token1 for token2', async () => {
    let amountToken = 1000 * dec;  // 1000 tokens in 18 decimals

    // Approve and add liquidity for both token1 and token2
    await Token1.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });
    await Token2.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });
    await TokenSwapper.methods.addLiquiditytoken1(amountToken).send({ from: accounts[0], gas: 500000 });
    await TokenSwapper.methods.addLiquiditytoken2(amountToken).send({ from: accounts[0], gas: 500000 });

    // Amount of token2 needed for the swap
    let amountToken2Needed = BigInt(100 * dec);  // 100 token2 in 18 decimals

    // Fetch the amount of token1 needed for this swap
    let amountToken1NeededForSwap = BigInt(await TokenSwapper.methods.amountNeededToSwap1to2(amountToken2Needed).call()) + BigInt(dec);

    // Approve the swap amount for token1
    await Token1.methods.approve(TokenSwapper.options.address, amountToken1NeededForSwap).send({ from: accounts[0] });

    // Check balances before the swap
    let beforetoken1Balance = BigInt(await Token1.methods.balanceOf(accounts[0]).call());
    let beforetoken2Balance = BigInt(await Token2.methods.balanceOf(accounts[0]).call());

    // Perform the swap from token1 to token2
    await TokenSwapper.methods.swapToken1forToken2(amountToken2Needed).send({ from: accounts[0], gas: 1000000 });

    // Check balances after the swap
    let aftertoken1Balance = BigInt(await Token1.methods.balanceOf(accounts[0]).call());
    let aftertoken2Balance = BigInt(await Token2.methods.balanceOf(accounts[0]).call());

    // Assert the balances after the swap
    assert(beforetoken1Balance - aftertoken1Balance >= amountToken1NeededForSwap - BigInt(dec), "Token1 balance after swap is correct");
    assert(aftertoken2Balance - beforetoken2Balance >= amountToken2Needed - BigInt(dec), "Token2 balance after swap is correct");
});

// it('contract swaps token2 for token1', async () => {
//     let amountToken = 1000 * dec;  // 1000 tokens in 18 decimals

//     // Approve and add liquidity for both token1 and token2
//     await Token1.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });
//     await Token2.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });
//     await TokenSwapper.methods.addLiquiditytoken1(amountToken).send({ from: accounts[0], gas: 500000 });
//     await TokenSwapper.methods.addLiquiditytoken2(amountToken).send({ from: accounts[0], gas: 500000 });

//     // Amount of token1 needed for the swap
//     let amountToken1Needed = BigInt(100 * dec);  // 100 token1 in 18 decimals

//     // Fetch the amount of token2 needed for this swap
//     let amountToken2NeededForSwap = BigInt(await TokenSwapper.methods.amountNeededToSwap2to1(amountToken1Needed).call()) + BigInt(dec);

//     // Approve the swap amount for token2
//     await Token2.methods.approve(TokenSwapper.options.address, amountToken2NeededForSwap).send({ from: accounts[0] });

//     // Check balances before the swap
//     let beforetoken1Balance = BigInt(await Token1.methods.balanceOf(accounts[0]).call());
//     let beforetoken2Balance = BigInt(await Token2.methods.balanceOf(accounts[0]).call());

//     // Perform the swap from token2 to token1
//     await TokenSwapper.methods.swapToken2forToken1(amountToken1Needed).send({ from: accounts[0], gas: 1000000 });

//     // Check balances after the swap
//     let aftertoken1Balance = BigInt(await Token1.methods.balanceOf(accounts[0]).call());
//     let aftertoken2Balance = BigInt(await Token2.methods.balanceOf(accounts[0]).call());

//     // Assert the balances after the swap
//     assert(beforetoken2Balance - aftertoken2Balance >= amountToken2NeededForSwap - BigInt(dec), "Token2 balance after swap is correct");
//     assert(aftertoken1Balance - beforetoken1Balance >= amountToken1Needed - BigInt(dec), "Token1 balance after swap is correct");
});


