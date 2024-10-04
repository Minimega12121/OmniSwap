import React, { useState, useEffect } from "react";
import tokenswapper from "./contracts/tokenswapper";
import web3 from "./web3";
import token1 from "./contracts/token1";
import token2 from "./contracts/token2";
import 'bootstrap/dist/css/bootstrap.min.css';

const TokenSwapper = () => {
  const [token1Balance, setToken1Balance] = useState("0");
  const [token2Balance, setToken2Balance] = useState("0");
  const [token1AmountForSwap, setToken1AmountForSwap] = useState("");
  const [token2ForSwapAmount, setToken2ForSwapAmount] = useState("");
  const [isReversed, setIsReversed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token1BalanceInWei = await token1.methods
        .balanceOf(tokenswapper.options.address)
        .call();
      const token2BalanceInWei = await token2.methods
        .balanceOf(tokenswapper.options.address)
        .call();

      setToken1Balance(web3.utils.fromWei(token1BalanceInWei, "ether").toString());
      setToken2Balance(web3.utils.fromWei(token2BalanceInWei, "ether").toString());
    };

    fetchData();
  }, [token1AmountForSwap, token2ForSwapAmount]);

  const handleAmountChange = async (e) => {
    const amount = e.target.value;
    if (isReversed) {
      setToken2ForSwapAmount(amount);
      if (amount !== "") {
        try {
          const amountInWei = web3.utils.toWei(amount, "ether");
          const token1AmountInWei = await tokenswapper.methods
            .amountNeededToSwap1to2(amountInWei)
            .call();

          const token1AmountInEther = web3.utils.fromWei(token1AmountInWei, "ether");
          setToken1AmountForSwap(token1AmountInEther);
        } catch (error) {
          console.error("Failed to fetch token1 amount:", error);
          setToken1AmountForSwap("0");
        }
      } else {
        setToken1AmountForSwap("0");
      }
    } else {
      setToken1AmountForSwap(amount);
      if (amount !== "") {
        try {
          const amountInWei = web3.utils.toWei(amount, "ether");
          const token2AmountInWei = await tokenswapper.methods
            .amountNeededToSwap2to1(amountInWei)
            .call();

          const token2AmountInEther = web3.utils.fromWei(token2AmountInWei, "ether");
          setToken2ForSwapAmount(token2AmountInEther);
        } catch (error) {
          console.error("Failed to fetch token2 amount:", error);
          setToken2ForSwapAmount("0");
        }
      } else {
        setToken2ForSwapAmount("0");
      }
    }
  };

  const handleSwap = async (event) => {
    event.preventDefault();
    const accounts = await web3.eth.getAccounts();
    setMessage("Waiting for approval...");

    try {
      if (isReversed) {
        await token2.methods
          .approve(tokenswapper.options.address, web3.utils.toWei(token2ForSwapAmount, "ether") * (1.5))
          .send({ from: accounts[0] });

        setMessage("Approval successful. Swapping tokens...");
        await tokenswapper.methods
          .swapToken1forToken2(web3.utils.toWei(token2ForSwapAmount, "ether"))
          .send({ from: accounts[0], gas: 300000 });

      } else {
        await token1.methods
          .approve(tokenswapper.options.address, web3.utils.toWei(token1AmountForSwap, "ether") * (1.5))
          .send({ from: accounts[0] });

        setMessage("Approval successful. Swapping tokens...");
        await tokenswapper.methods
          .swapToken2forToken1(web3.utils.toWei(token1AmountForSwap, "ether"))
          .send({ from: accounts[0], gas: 300000 });
      }

      setMessage("Transaction successful!");
    } catch (error) {
      console.error("Swap failed:", error);
      setMessage("Transaction failed. Please try again.");
    }
  };

  const toggleSwapDirection = () => {
    setIsReversed(!isReversed);
    setToken1AmountForSwap("");
    setToken2ForSwapAmount("");
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Token Swapper</h2>
              <div className="d-flex justify-content-between">
                <p><strong>Token 1 Balance:</strong> {token1Balance}</p>
                <p><strong>Token 2 Balance:</strong> {token2Balance}</p>
              </div>
              <button className="btn btn-primary btn-block mb-3" onClick={toggleSwapDirection}>
                {isReversed ? "Swap Token2 for Token1" : "Swap Token1 for Token2"}
              </button>
              <form onSubmit={handleSwap}>
                <div className="form-group">
                  <label>{isReversed ? "Amount of Token 2:" : "Amount of Token 1:"}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={isReversed ? token2ForSwapAmount : token1AmountForSwap}
                    onChange={handleAmountChange}
                    placeholder={isReversed ? "Enter Token 2 amount" : "Enter Token 1 amount"}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success btn-block">
                  Swap
                </button>
              </form>
              {message && <div className="alert alert-info mt-3">{message}</div>}
              {(token1AmountForSwap || token2ForSwapAmount) && (
                <p className="mt-3 text-center">
                  {isReversed
                    ? `Token 1 You Will Receive: ${token1AmountForSwap}`
                    : `Token 2 You Will Receive: ${token2ForSwapAmount}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSwapper;
