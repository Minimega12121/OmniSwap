import React, { useState } from "react";
import web3 from "./web3";
import token1fuji from "./contracts/Fuji/token1";
import token2fuji from "./contracts/Fuji/token2";
import tokenswapperfuji from "./contracts/Fuji/tokenswapper_fuji";
import "bootstrap/dist/css/bootstrap.min.css";

const token1 = token1fuji;
const token2 = token2fuji;
const tokenswapper = tokenswapperfuji;

const AddLiquidity = () => {
  const [token1AmountLiquidity, setToken1AmountLiquidity] = useState("");
  const [token2AmountLiquidity, setToken2AmountLiquidity] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState("token1");

  const handleLiquidity = async (event) => {
    event.preventDefault();
    const accounts = await web3.eth.getAccounts();
    setLoading(true); // Set loading state

    const amountInWei =
      selectedToken === "token1"
        ? web3.utils.toWei(token1AmountLiquidity, "ether")
        : web3.utils.toWei(token2AmountLiquidity, "ether");

    const retryApproval = async (contract, gasLimit) => {
      try {
        await contract.methods
          .approve(tokenswapper.options.address, amountInWei)
          .send({ from: accounts[0], gas: gasLimit });
        return true;
      } catch (error) {
        console.error("Approval error:", error); // Log error
        const retry = window.confirm(
          "Approval failed. Would you like to try again?"
        );
        if (retry) {
          const newGasLimit = Math.ceil(gasLimit * 1.1);
          return await retryApproval(contract, newGasLimit);
        } else {
          return false;
        }
      }
    };

    const token = selectedToken === "token1" ? token1 : token2;
    const allowance = await token.methods
      .allowance(accounts[0], tokenswapper.options.address)
      .call();

    const initialGasLimit = 500000;
    if (allowance < amountInWei) {
      const approvalSuccess = await retryApproval(token, initialGasLimit);
      if (!approvalSuccess) {
        setLoading(false); // Reset loading state
        return;
      }
    }

    try {
      if (selectedToken === "token1") {
        await tokenswapper.methods
          .addLiquiditytoken1(amountInWei)
          .send({ from: accounts[0], gas: initialGasLimit });
      } else {
        await tokenswapper.methods
          .addLiquiditytoken2(amountInWei)
          .send({ from: accounts[0], gas: initialGasLimit });
      }
      alert(
        `${
          selectedToken === "token1" ? "Token1" : "Token2"
        } Liquidity added successfully!`
      );
    } catch (error) {
      console.error("Add Liquidity error:", error); // Log error
      alert("Add Liquidity failed. Please try again.");
    } finally {
      setLoading(false); // Reset loading state in all cases
    }
  };

  return (
    <div className="container mt-5 bg-light text-dark">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center">Liquidity Adder</h2>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5>Select Token:</h5>
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Token selection"
                >
                  <button
                    type="button"
                    className={`btn btn-outline-primary ${
                      selectedToken === "token1" ? "active" : ""
                    }`}
                    onClick={() => setSelectedToken("token1")}
                  >
                    Token 1
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline-success ${
                      selectedToken === "token2" ? "active" : ""
                    }`}
                    onClick={() => setSelectedToken("token2")}
                  >
                    Token 2
                  </button>
                </div>
              </div>

              <form onSubmit={handleLiquidity}>
                <div className="form-group">
                  <label>
                    {selectedToken === "token1"
                      ? "Token 1 Amount"
                      : "Token 2 Amount"}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={
                      selectedToken === "token1"
                        ? token1AmountLiquidity
                        : token2AmountLiquidity
                    }
                    placeholder={`Enter ${
                      selectedToken === "token1" ? "Token 1" : "Token 2"
                    } amount`}
                    onChange={(e) =>
                      selectedToken === "token1"
                        ? setToken1AmountLiquidity(e.target.value)
                        : setToken2AmountLiquidity(e.target.value)
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary btn-block ${
                    loading ? "disabled" : ""
                  }`}
                  disabled={loading} // Disable button while loading
                >
                  {loading ? "Adding Liquidity..." : "Add Liquidity"}
                </button>

                {loading && (
                  <div className="text-center mt-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only"></span>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLiquidity;
