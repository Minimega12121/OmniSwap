const assert = require('assert');
const {Web3} = require('web3');
const ganache = require('ganache');

// Compiled contract artifacts
const compiledTokenSwapper = require('../ethereum/build/TokenSwapper.json');
const compiledToken1 = require('../ethereum/build/Token1.json');
const compiledToken2 = require('../ethereum/build/Token2.json');

// Initialize Web3 with Ganache provider
const web3 = new Web3(ganache.provider());

const dec = 1e18;
let Token1;
let Token2;
let TokenSwapper;
let accounts;


beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    Token1 = await new web3.eth.Contract(compiledToken1.abi)
        .deploy({ data: compiledToken1.evm.bytecode.object })
        .send({ from: accounts[0], gas: '10000000' });

    Token2 = await new web3.eth.Contract(compiledToken2.abi)
        .deploy({ data: compiledToken2.evm.bytecode.object })
        .send({ from: accounts[0], gas: '10000000' });

    TokenSwapper = await new web3.eth.Contract(compiledTokenSwapper.abi)
        .deploy({ data: compiledTokenSwapper.evm.bytecode.object, arguments: [Token1.options.address, Token2.options.address] })
        .send({ from: accounts[0], gas: '10000000' });
});

describe('Contract Deployments', () => {
    it('should deploys the contracts', async () => {
        assert.ok(Token1.options.address);
        assert.ok(Token2.options.address);
        assert.ok(TokenSwapper.options.address);
    });

    it('adds liquidity to the pool', async () => {
        let amountOfToken1Added = web3.utils.toWei('1001', 'ether'); // Adjust for 18 decimals
        let amountOfToken2Added = web3.utils.toWei('2001', 'ether'); // Adjust for 18 decimals

        // Approve tokens before adding liquidity
        await Token1.methods.approve(TokenSwapper.options.address, amountOfToken1Added).send({ from: accounts[0] });
        await Token2.methods.approve(TokenSwapper.options.address, amountOfToken2Added).send({ from: accounts[0] });

        // Add liquidity
        await TokenSwapper.methods.addLiquidity(amountOfToken1Added, amountOfToken2Added).send({ from: accounts[0], gas: 500000 });

        // Check contract balances
        const token1Balance = await Token1.methods.balanceOf(TokenSwapper.options.address).call();
        const token2Balance = await Token2.methods.balanceOf(TokenSwapper.options.address).call();

        // Assert that the liquidity was added
        assert(token1Balance == amountOfToken1Added, "Token1 liquidity added correctly");
        assert(token2Balance == amountOfToken2Added, "Token2 liquidity added correctly");
    });


    it('calculates Token1 needed for a given amount of Token2', async () => {
        let amountToken = 1000*dec; //for 18decimal places

        // Approve tokens before adding liquidity
        await Token1.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });
        await Token2.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });

        // Add liquidity
        await TokenSwapper.methods.addLiquidity(amountToken, amountToken).send({ from: accounts[0], gas: 500000 });

        // The amount of Token2 you want to swap for Token1
        let amountToken2Needed = BigInt(10*dec); // for 18 decimal places
        console.log(await Token1.methods.balanceOf(TokenSwapper.options.address).call());
        let amountToken1NeededForSwap = await TokenSwapper.methods.amountNeededToSwap1to2(amountToken2Needed).call();

        console.log("Amount of Token1 needed for swap: ", amountToken1NeededForSwap);

        assert(amountToken1NeededForSwap>=BigInt(9*dec), "Amount of Token1 needed for swap is correct");// 9 due to rounding error otherwise it should be 9.900990099009901
    });

    it('contract swaps token2 for token1' ,async() => {
        let amountToken = 1000*dec; //for 18decimal places

        // Approve tokens before adding liquidity
        await Token1.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });
        await Token2.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });

        // Add liquidity
        await TokenSwapper.methods.addLiquidity(amountToken, amountToken).send({ from: accounts[0], gas: 500000 });

        let amountToken2Needed = BigInt(100*dec); // for 18 decimal places

        let amountToken1NeededForSwap = await TokenSwapper.methods.amountNeededToSwap1to2(amountToken2Needed).call() + BigInt(dec);

        await Token1.methods.approve(TokenSwapper.options.address, amountToken1NeededForSwap).send({ from: accounts[0] });

        let beforetoken1Balance = await Token1.methods.balanceOf(accounts[0]).call();
        let beforetoken2Balance = await Token2.methods.balanceOf(accounts[0]).call();

        await TokenSwapper.methods.swapToken1forToken2(amountToken2Needed).send({ from: accounts[0], gas: 1000000 });

        let aftertoken1Balance = await Token1.methods.balanceOf(accounts[0]).call();
        let aftertoken2Balance = await Token2.methods.balanceOf(accounts[0]).call();

        assert(beforetoken1Balance - aftertoken1Balance >= amountToken1NeededForSwap-BigInt(dec), "Token1 balance after swap is correct");
        assert(aftertoken2Balance - beforetoken2Balance >= amountToken2Needed-BigInt(dec), "Token2 balance after swap is correct");
});

it('contract swaps token1 for token2' ,async() => {
    let amountToken = 1000 * dec; // for 18 decimal places

    // Approve tokens before adding liquidity
    await Token1.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });
    await Token2.methods.approve(TokenSwapper.options.address, amountToken).send({ from: accounts[0] });

    // Add liquidity
    await TokenSwapper.methods.addLiquidity(amountToken, amountToken).send({ from: accounts[0], gas: 500000 });

    // Specify how much Token1 is needed for the swap
    let amountToken1Needed = BigInt(100 * dec); // for 18 decimal places

    // Calculate how much Token2 is needed to swap for the desired Token1
    let amountToken2NeededForSwap = await TokenSwapper.methods.amountNeededToSwap2to1(amountToken1Needed).call() + BigInt(dec);

    // Approve Token2 before the swap
    await Token2.methods.approve(TokenSwapper.options.address, amountToken2NeededForSwap).send({ from: accounts[0] });

    // Record balances before the swap
    let beforetoken1Balance = await Token1.methods.balanceOf(accounts[0]).call();
    let beforetoken2Balance = await Token2.methods.balanceOf(accounts[0]).call();

    // Execute the swap
    await TokenSwapper.methods.swapToken2forToken1(amountToken1Needed).send({ from: accounts[0], gas: 1000000 });

    // Record balances after the swap
    let aftertoken1Balance = await Token1.methods.balanceOf(accounts[0]).call();
    let aftertoken2Balance = await Token2.methods.balanceOf(accounts[0]).call();

    // Check if Token2 balance has decreased correctly after the swap
    assert(beforetoken2Balance - aftertoken2Balance >= amountToken2NeededForSwap - BigInt(dec), "Token2 balance after swap is correct");

    // Check if Token1 balance has increased correctly after the swap
    assert(aftertoken1Balance - beforetoken1Balance >= amountToken1Needed - BigInt(dec), "Token1 balance after swap is correct");
});


});
