import React, { useState } from "react";
import senderfuji from "./contracts/Fuji/SenderFuji"; // Import your Sender contract for Fuji
import web3 from "./web3"; // Import Web3 instance
import token2fuji from "./contracts/Fuji/token2"; // Import Token2 contract from Fuji
import token1fuji from "./contracts/Fuji/token1"; // Import Token1 contract from Fuji
import token2amoy from "./contracts/Amoy/token2"; // Import Token2 contract from Amoy
import token1amoy from "./contracts/Amoy/token1"; // Import Token1 contract from Amoy
import 'bootstrap/dist/css/bootstrap.min.css';
import receiveramoy from "./contracts/Amoy/ReceiverAmoy";
import receiverfuji from "./contracts/Fuji/ReceiverFuji";
import senderamoy from "./contracts/Amoy/SenderAmoy";

const CrossChainTokenSwapper = () => {
  const [amount, setAmount] = useState(""); // State to hold the amount of tokens to swap
  const [receiverAddress, setReceiverAddress] = useState(""); // State to hold the receiver's address
  const [loading, setLoading] = useState(false); // Loading state to show when a transaction is processing
  const [message, setMessage] = useState(""); // Message state for success or error messages
  const [transactionSuccess, setTransactionSuccess] = useState(false); // State to track transaction success
  const [selectedToken, setSelectedToken] = useState("token1"); // State to track the selected token (Token1 or Token2)
  const [isFujiSender, setIsFujiSender] = useState(true); // State to track whether sender is Fuji

  // Handle form submission and perform the swap
  const handleSwap = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setTransactionSuccess(false); // Reset transaction success state

    try {
      const accounts = await web3.eth.getAccounts(); // Fetch user's wallet accounts

      // Determine which token and sender/receiver to use based on selected options
      const tokenContract = isFujiSender
        ? (selectedToken === "token1" ? token1fuji : token2fuji)
        : (selectedToken === "token1" ? token1amoy : token2amoy);

      const senderContract = isFujiSender ? senderfuji : senderamoy;
      const receiverAddressOnChain =receiverAddress; // Adjust receiver address based on chain

      // Approve the Sender contract to spend the selected token
      await tokenContract.methods
        .approve(senderContract.options.address, web3.utils.toWei(amount * 1.05, "ether"))
        .send({ from: accounts[0] });

      // Create the message format required by the contract (ReceiverAddress$TokenAddress$Amount)
      const text = `${receiverAddressOnChain}$${tokenContract.options.address}$${web3.utils.toWei(amount, "ether")}`;
      console.log(text);

      const txn = await senderContract.methods
        .sendToken(text, tokenContract.options.address, web3.utils.toWei(amount, "ether").toString())
        .send({ from: accounts[0], gas: 2000000, gasPrice: web3.utils.toWei("80", "gwei") });

      setMessage(`Successfully transferred ${amount} ${selectedToken.toUpperCase()} from ${isFujiSender ? "Fuji" : "Amoy"} to ${isFujiSender ? "Amoy" : "Fuji"} to address ${receiverAddress}. Now switch to the corresponding wallet to complete the process. Wait for completion of transaction ${txn.transactionHash} on CCIP Explorer.`);
      setTransactionSuccess(true); // Set transaction success to true after transfer

    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  // Handle the confirmation for token transfer on Amoy
  const handleTransferConfirmation = async () => {
    setLoading(true);
    setMessage("");

    try {
      const accounts = await web3.eth.getAccounts(); // Fetch user's wallet accounts

      // Approve the Receiver contract to spend the selected token on Amoy
      await receiveramoy.methods
        .transferRequiredTokens()
        .send({ from: accounts[0] ,gas: 2000000, gasPrice: web3.utils.toWei("80", "gwei") });

      setMessage(`Successfully completed the transfer of ${amount} ${selectedToken.toUpperCase()} on Amoy!`);
      setTransactionSuccess(false);

    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Cross-Chain Token Swapper</h2>

      <form onSubmit={handleSwap}>
        {/* Token Amount Input */}
        <div className="form-group mb-3">
          <label htmlFor="amount">Amount of {selectedToken === "token1" ? "Token1" : "Token2"} to Transfer:</label>
          <input
            type="number"
            id="amount"
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter amount of ${selectedToken === "token1" ? "Token1" : "Token2"}`}
            required
          />
        </div>

        {/* Receiver's Address Input */}
        <div className="form-group mb-3">
          <label htmlFor="receiverAddress">Receiver's Address on {isFujiSender ? "Amoy" : "Fuji"}:</label>
          <input
            type="text"
            id="receiverAddress"
            className="form-control"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            placeholder={`Enter receiver's address on ${isFujiSender ? "Amoy" : "Fuji"}`}
            required
          />
        </div>

        {/* Token Selection Buttons */}
        <div className="form-group mb-3">
          <label>Select Token to Swap:</label>
          <div className="btn-group d-flex">
            <button
              type="button"
              className={`btn ${selectedToken === "token1" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSelectedToken("token1")}
              disabled={loading}
            >
              Token1
            </button>
            <button
              type="button"
              className={`btn ${selectedToken === "token2" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSelectedToken("token2")}
              disabled={loading}
            >
              Token2
            </button>
          </div>
        </div>

        {/* Network Selection Buttons */}
        <div className="form-group mb-3">
          <label>Select Network:</label>
          <div className="btn-group d-flex">
            <button
              type="button"
              className={`btn ${isFujiSender ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setIsFujiSender(true)}
              disabled={loading}
            >
              Send from Fuji
            </button>
            <button
              type="button"
              className={`btn ${!isFujiSender ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setIsFujiSender(false)}
              disabled={loading}
            >
              Send from Amoy
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Processing..." : `Swap ${selectedToken === "token1" ? "Token1" : "Token2"}`}
          </button>
        </div>
      </form>

      {/* Success/Error Message */}
      {message && <p className="mt-3 text-center">{message}</p>}

      {/* Transaction Confirmation */}
      {transactionSuccess && (
        <div className="mt-3 text-center">
          <p>Did the transaction complete successfully?</p>
          <button className="btn btn-success" onClick={handleTransferConfirmation} disabled={loading}>
            Yes, proceed with transfer on {isFujiSender ? "Amoy" : "Fuji"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CrossChainTokenSwapper;
