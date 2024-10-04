// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";


contract Token1 is ERC20, Ownable, ERC20Burnable {

    uint dec = 10**18;
    constructor() ERC20("Token1", "TKN1") Ownable(msg.sender) {
        _mint(msg.sender, 1000000*dec);
    }

    // Function to mint tokens, only callable by the owner
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

contract Token2 is ERC20, Ownable, ERC20Burnable {

    uint dec = 10**18;
    constructor() ERC20("Token2", "TKN2") Ownable(msg.sender) {
        _mint(msg.sender, 1000000*dec);
    }

    // Function to mint tokens, only callable by the owner
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

contract TokenSwapper {
    struct Swap {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
    }

    ERC20 public token1;
    ERC20 public token2;
    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public swapCount;
    Swap[] public swapHistory;

    constructor(address _token1, address _token2) {
        token1 = ERC20(_token1);
        token2 = ERC20(_token2);
        token1Balance = 0;
        token2Balance = 0;
        swapCount = 0;
    }

    function swapToken1forToken2(uint256 amount_token2) public {
        uint256 amount_token1 = amountNeededToSwap1to2(amount_token2);
        require(token1.balanceOf(address(this)) >= amount_token1, "Insufficient Token1 balance of contract");
        require(token2.balanceOf(msg.sender) >= amount_token2, "Insufficient Token2 balance of user");

        token2.transferFrom(msg.sender, address(this), amount_token2);
        token1.transfer(msg.sender, amount_token1);
        token2Balance += amount_token2;
        token1Balance -= amount_token1;

        swapHistory.push(Swap(msg.sender, address(token1), address(token2), amount_token1, amount_token2, block.timestamp));
        swapCount+=1;
    }

    function swapToken2forToken1(uint256 amount_token1) public {
        uint256 amount_token2 = amountNeededToSwap2to1(amount_token1);
        require(token2.balanceOf(address(this)) >= amount_token2, "Insufficient Token2 balance of contract");
        require(token1.balanceOf(msg.sender) >= amount_token1, "Insufficient Token1 balance of user");

        token1.transferFrom(msg.sender, address(this), amount_token1);
        token2.transfer(msg.sender, amount_token2);
        token2Balance -= amount_token2;
        token1Balance += amount_token1;

        swapHistory.push(Swap(msg.sender, address(token2), address(token1), amount_token2, amount_token1, block.timestamp));
        swapCount+=1;
    }

    function amountNeededToSwap1to2(uint256 amount_token2) public view returns (uint256) {
        require(token2Balance + amount_token2 > 0, "Division by zero risk");
        uint256 precisionFactor = 1e18;
        uint256 numerator = token1Balance * amount_token2 * precisionFactor;
        uint256 denominator = token2Balance + amount_token2;
        return (numerator + (denominator / 2)) / denominator / precisionFactor;
    }

    function amountNeededToSwap2to1(uint256 amount_token1) public view returns (uint256) {
        require(token1Balance + amount_token1 > 0, "Division by zero risk");
        uint256 precisionFactor = 1e18;
        uint256 numerator = token2Balance * amount_token1 * precisionFactor;
        uint256 denominator = token1Balance + amount_token1;
        return numerator / denominator / precisionFactor;
    }

    function addLiquiditytoken1(uint256 amount_token1) public {
        require(token1.balanceOf(msg.sender) >= amount_token1, "Insufficient Token1 balance");
        token1.transferFrom(msg.sender, address(this), amount_token1);
        token1Balance += amount_token1;
    }

    function addLiquiditytoken2(uint256 amount_token2) public {
        require(token2.balanceOf(msg.sender) >= amount_token2, "Insufficient Token2 balance");
        token2.transferFrom(msg.sender, address(this), amount_token2);
        token2Balance += amount_token2;
    }

    function getSwapHistory(uint index) public view returns (Swap memory) {
        require(index < swapHistory.length, "Index out of bounds");
        return swapHistory[index];
    }
    function getSwapCount() public view returns (uint256) {
        return swapCount;
    }
}

