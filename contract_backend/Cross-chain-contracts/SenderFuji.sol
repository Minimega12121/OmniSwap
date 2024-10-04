// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts@1.2.0/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

/// @title - A simple contract for sending string data across chains.
contract SenderFuji is OwnerIsCreator {
    // Custom errors to provide more descriptive revert messages.
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance.

    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        string text, // The text being sent.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the CCIP message.
    );

    IRouterClient private s_router;
    uint256 private gasLimit;
    LinkTokenInterface private s_linkToken;

    /// @notice Constructor initializes the contract with the router address.
    constructor() {
        s_router = IRouterClient(0xF694E193200268f9a4868e4Aa017A0118C9a8177);
        s_linkToken = LinkTokenInterface(0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846);
        gasLimit = 500_000;
    }
    function setGasLimit(uint256 _newGasLimit) external onlyOwner {
    require(_newGasLimit > 0, "Gas limit must be greater than 0");
    gasLimit = _newGasLimit;
}


    /// @notice Sends data to receiver on the destination chain.
    /// @dev Assumes your contract has sufficient LINK.
    /// @param text The string text to be sent.
    /// @return messageId The ID of the message that was sent.
    function sendToken(
        string calldata text,
        address token_address,
        uint256 token_amount
    ) external onlyOwner returns (bytes32 messageId) {

        address receiver =0xCf56D51E7B84944B11C6287c701315a813e98E1D;
        uint64 destinationChainSelector = 16281711391670634445;

        ERC20Burnable token = ERC20Burnable(token_address);
        token.burnFrom(msg.sender,token_amount);


        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // ABI-encoded receiver address
            data: abi.encode(text), // ABI-encoded string
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array indicating no tokens are being sent
            extraArgs: Client._argsToBytes(
                // Additional arguments, setting gas limit
                Client.EVMExtraArgsV1({gasLimit: gasLimit})
            ),
            // Set the feeToken  address, indicating LINK will be used for fees
            feeToken: address(s_linkToken)
        });

        // Get the fee required to send the message
        uint256 fees = s_router.getFee(
            destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
        s_linkToken.approve(address(s_router), fees);

        // Send the message through the router and store the returned message ID
        messageId = s_router.ccipSend(destinationChainSelector, evm2AnyMessage);

        // Emit an event with message details
        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            text,
            address(s_linkToken),
            fees
        );

        // Return the message ID
        return messageId;
    }
     // Function to withdraw all LINK tokens from the contract
    function withdrawLink() public {
        uint256 linkBalance = s_linkToken.balanceOf(address(this)); // Get contract's LINK balance
        require(linkBalance > 0, "No LINK tokens to withdraw"); // Check if there are any LINK tokens

        bool success = s_linkToken.transfer(msg.sender, linkBalance); // Transfer LINK to the contract owner
        require(success, "LINK transfer failed"); // Ensure the transfer was successful
    }
}
//0xF694E193200268f9a4868e4Aa017A0118C9a8177
//0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846


//16281711391670634445
