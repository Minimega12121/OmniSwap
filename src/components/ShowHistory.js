import React, { useState, useEffect } from "react";
import web3 from "./web3";
import tokenswapperfuji from "./contracts/Fuji/tokenswapper_fuji";

const tokenswapper = tokenswapperfuji;

const ShowHistory = () => {
  const [swapHistory, setSwapHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSwapHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const formattedHistory = [];
      const count = await tokenswapper.methods.getSwapCount().call();

      for (let i = 0; i < count; i++) {
        const swap = await tokenswapper.methods.swapHistory(i).call();
        formattedHistory.push({
          user: swap[0], // user address
          tokenIn: swap[1], // tokenIn address
          tokenOut: swap[2], // tokenOut address
          amountIn: web3.utils.fromWei(swap[3].toString(), "ether"), // Convert amountIn from Wei to Ether
          amountOut: web3.utils.fromWei(swap[4].toString(), "ether"), // Convert amountOut from Wei to Ether
          timestamp: swap[5].toString(), // Convert Unix timestamp to human-readable date
        });
      }

      // Set the formatted history into the state
      setSwapHistory(formattedHistory);
    } catch (err) {
      console.log(err);
      setError("Error fetching swap history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwapHistory();
  }, []);

  return (
    <div>
      <h2>Swap History</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : swapHistory.length === 0 ? (
        <p>No transactions</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Token In</th>
              <th>Token Out</th>
              <th>Amount In</th>
              <th>Amount Out</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {swapHistory.map((swap, index) => (
              <tr key={index}>
                <td>{swap.user}</td>
                <td>{swap.tokenIn}</td>
                <td>{swap.tokenOut}</td>
                <td>{swap.amountIn}</td>
                <td>{swap.amountOut}</td>
                <td>{swap.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ShowHistory;
