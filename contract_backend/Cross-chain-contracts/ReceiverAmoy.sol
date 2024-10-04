// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Client} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
interface IMintableERC20 {
    // Ensure this matches the signature in the actual token contract
    function mint(address to, uint256 amount) external;
}
/// @title - A simple contract for receiving string data across chains.
contract Receiver is CCIPReceiver {
    // Event emitted when a message is received from another chain.
    event MessageReceived(
        bytes32 indexed messageId, // The unique ID of the message.
        uint64 indexed sourceChainSelector, // The chain selector of the source chain.
        address sender, // The address of the sender from the source chain.
        string text // The text that was received.
    );

    bytes32 private s_lastReceivedMessageId; // Store the last received messageId.
    string private s_lastReceivedText; // Store the last received text.
    mapping(address => address) public tokenMapper;

    /// @notice Constructor initializes the contract with the router address.
    /// @param router The address of the router contract.
    constructor() CCIPReceiver("0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2") {}


    function mapToken(address tokenchain1, address tokenchain2) public {
        tokenMapper[tokenchain1] = tokenchain2;
    }
  function parseMessage(string memory message)
     internal
        pure
        returns (string memory receiverAddress, string memory tokenAddress, string memory tokenAmount)
    {
        bytes memory messageBytes = bytes(message);
        uint separatorCount = 0;
        uint start = 0;

        for (uint i = 0; i < messageBytes.length; i++) {
            if (messageBytes[i] == "$") {
                if (separatorCount == 0) {
                    receiverAddress = substring(message, start, i);
                    start = i + 1;
                } else if (separatorCount == 1) {
                    tokenAddress = substring(message, start, i);
                    start = i + 1;
                }
                separatorCount++;
            }
        }
        tokenAmount = substring(message, start, messageBytes.length);
    }

    function substring(
        string memory str,
        uint startIndex,
        uint endIndex
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(endIndex > startIndex, "Invalid substring indices");
        bytes memory result = new bytes(endIndex - startIndex);

        for (uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }


    function stringToUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;

        for (uint i = 0; i < b.length; i++) {
            require(b[i] >= 0x30 && b[i] <= 0x39, "Invalid uint256 value");
            result = result * 10 + (uint256(uint8(b[i])) - 48);
        }
        return result;
    }
function stringToAddress(string memory str) public pure returns (address) {
        bytes memory strBytes = bytes(str);
        require(strBytes.length == 42, "Invalid address length");
        bytes memory addrBytes = new bytes(20);

        for (uint i = 0; i < 20; i++) {
            addrBytes[i] = bytes1(hexCharToByte(strBytes[2 + i * 2]) * 16 + hexCharToByte(strBytes[3 + i * 2]));
        }

        return address(uint160(bytes20(addrBytes)));
    }
    function hexCharToByte(bytes1 char) internal pure returns (uint8) {
        uint8 byteValue = uint8(char);
        if (byteValue >= uint8(bytes1('0')) && byteValue <= uint8(bytes1('9'))) {
            return byteValue - uint8(bytes1('0'));
        } else if (byteValue >= uint8(bytes1('a')) && byteValue <= uint8(bytes1('f'))) {
            return 10 + byteValue - uint8(bytes1('a'));
        } else if (byteValue >= uint8(bytes1('A')) && byteValue <= uint8(bytes1('F'))) {
            return 10 + byteValue - uint8(bytes1('A'));
        }
        revert("Invalid hex character");
    }

    /// handle a received message
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        s_lastReceivedMessageId = any2EvmMessage.messageId; // fetch the messageId
        s_lastReceivedText = abi.decode(any2EvmMessage.data, (string)); // abi-decoding of the sent text


        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector, // fetch the source chain identifier (aka selector)
            abi.decode(any2EvmMessage.sender, (address)), // abi-decoding of the sender address,
            abi.decode(any2EvmMessage.data, (string))
        );
    }


   function transferRequiredTokens()
    external
 {
    // Parse the last received text to extract receiver address, token address, and token amount.
    (string memory receiver_address_str, string memory token_address_str, string memory token_amount_str) = parseMessage(s_lastReceivedText);

    // Convert string values to respective types.
    address receiver_address =stringToAddress(receiver_address_str);
    address token_address =stringToAddress(token_address_str);
    uint256 token_amount = stringToUint(token_amount_str);

    address mapped_token = tokenMapper[token_address];
    // Return the parsed addresses and amount.

    IMintableERC20 token = IMintableERC20(mapped_token);
    token.mint(receiver_address,token_amount);
}
//0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2

}