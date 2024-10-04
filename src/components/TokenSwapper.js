import React, { useState, useEffect } from "react";
import tokenswapperfuji from "./contracts/Fuji/tokenswapper_fuji";
import web3 from "./web3";
import token1fuji from "./contracts/Fuji/token1";
import token2fuji from "./contracts/Fuji/token2";
import "bootstrap/dist/css/bootstrap.min.css";

const TokenSwapper = () => {
  const [token1fujiBalance, setToken1fujiBalance] = useState("0");
  const [token2fujiBalance, setToken2fujiBalance] = useState("0");
  const [token1fujiAmountForSwap, setToken1fujiAmountForSwap] = useState("");
  const [token2fujiForSwapAmount, setToken2fujiForSwapAmount] = useState("");
  const [isReversed, setIsReversed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token1fujiBalanceInWei = await token1fuji.methods
        .balanceOf(tokenswapperfuji.options.address)
        .call();
      const token2fujiBalanceInWei = await token2fuji.methods
        .balanceOf(tokenswapperfuji.options.address)
        .call();

      setToken1fujiBalance(
        web3.utils.fromWei(token1fujiBalanceInWei, "ether").toString()
      );
      setToken2fujiBalance(
        web3.utils.fromWei(token2fujiBalanceInWei, "ether").toString()
      );
    };

    fetchData();
  }, [token1fujiAmountForSwap, token2fujiForSwapAmount]);

  const handleAmountChange = async (e) => {
    const amount = e.target.value;
    if (isReversed) {
      setToken2fujiForSwapAmount(amount);
      if (amount !== "") {
        try {
          const amountInWei = web3.utils.toWei(amount, "ether");
          const token1fujiAmountInWei = await tokenswapperfuji.methods
            .amountNeededToSwap1to2(amountInWei)
            .call();

          const token1fujiAmountInEther = web3.utils.fromWei(
            token1fujiAmountInWei,
            "ether"
          );
          setToken1fujiAmountForSwap(token1fujiAmountInEther);
        } catch (error) {
          console.error("Failed to fetch token1fuji amount:", error);
          setToken1fujiAmountForSwap("0");
        }
      } else {
        setToken1fujiAmountForSwap("0");
      }
    } else {
      setToken1fujiAmountForSwap(amount);
      if (amount !== "") {
        try {
          const amountInWei = web3.utils.toWei(amount, "ether");
          const token2fujiAmountInWei = await tokenswapperfuji.methods
            .amountNeededToSwap2to1(amountInWei)
            .call();

          const token2fujiAmountInEther = web3.utils.fromWei(
            token2fujiAmountInWei,
            "ether"
          );
          setToken2fujiForSwapAmount(token2fujiAmountInEther);
        } catch (error) {
          console.error("Failed to fetch token2fuji amount:", error);
          setToken2fujiForSwapAmount("0");
        }
      } else {
        setToken2fujiForSwapAmount("0");
      }
    }
  };

  const handleSwap = async (event) => {
    event.preventDefault();
    const accounts = await web3.eth.getAccounts();
    setMessage("Waiting for approval...");

    try {
      if (isReversed) {
        await token2fuji.methods
          .approve(
            tokenswapperfuji.options.address,
            web3.utils.toWei(token2fujiForSwapAmount, "ether") * 1.5
          )
          .send({ from: accounts[0] });

        setMessage("Approval successful. Swapping tokens...");
        await tokenswapperfuji.methods
          .swapToken1forToken2(web3.utils.toWei(token2fujiForSwapAmount, "ether"))
          .send({ from: accounts[0], gas: 300000 });
      } else {
        await token1fuji.methods
          .approve(
            tokenswapperfuji.options.address,
            web3.utils.toWei(token1fujiAmountForSwap, "ether") * 1.5
          )
          .send({ from: accounts[0] });

        setMessage("Approval successful. Swapping tokens...");
        await tokenswapperfuji.methods
          .swapToken2forToken1(web3.utils.toWei(token1fujiAmountForSwap, "ether"))
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
    setToken1fujiAmountForSwap("");
    setToken2fujiForSwapAmount("");
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Token Swapper</h2>
              <div className="d-flex justify-content-between">
                <p>
                  <strong>Token 1 Fuji Balance:</strong> {token1fujiBalance}
                </p>
                <p>
                  <strong>Token 2 Fuji Balance:</strong> {token2fujiBalance}
                </p>
              </div>
              <button
                className="btn btn-primary btn-block mb-3"
                onClick={toggleSwapDirection}
              >
                {isReversed
                  ? "Swap Token2 Fuji for Token1 Fuji"
                  : "Swap Token1 Fuji for Token2 Fuji"}
              </button>
              <form onSubmit={handleSwap}>
                <div className="form-group">
                  <label>
                    {isReversed ? "Amount of Token 2 Fuji:" : "Amount of Token 1 Fuji:"}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={
                      isReversed ? token2fujiForSwapAmount : token1fujiAmountForSwap
                    }
                    onChange={handleAmountChange}
                    placeholder={
                      isReversed
                        ? "Enter Token 2 Fuji amount"
                        : "Enter Token 1 Fuji amount"
                    }
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success btn-block">
                  Swap
                </button>
              </form>
              {message && (
                <div className="alert alert-info mt-3">{message}</div>
              )}
              {(token1fujiAmountForSwap || token2fujiForSwapAmount) && (
                <p className="mt-3 text-center">
                  {isReversed
                    ? `Token 1 Fuji You Will Receive: ${token1fujiAmountForSwap}`
                    : `Token 2 Fuji You Will Receive: ${token2fujiForSwapAmount}`}
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
