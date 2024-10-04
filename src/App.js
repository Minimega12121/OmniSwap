import React, { useState } from "react";
import TokenSwapper from "./components/TokenSwapper";
import AddLiquidity from "./components/AddLiquidity";
import ShowHistory from "./components/ShowHistory";
import CrossChainTokenSwapper from "./components/CrossChainTokenSwapper"; // Import the new Cross Chain Token Swapper component
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';  // Include custom CSS for dark mode

const App = () => {
  const [activePage, setActivePage] = useState("swap");

  return (
    <div className="container mt-5">
      {/* Title of the dEX app */}
      <h1 className="text-center mb-4">Omniswap</h1>

      {/* Navigation Menu */}
      <nav className="nav justify-content-center mb-4">
        <button className="btn btn-primary mx-2" onClick={() => setActivePage("swap")}>
          Token Swapper
        </button>
        <button className="btn btn-primary mx-2" onClick={() => setActivePage("liquidity")}>
          Add Liquidity
        </button>
        <button className="btn btn-primary mx-2" onClick={() => setActivePage("history")}>
          Show History
        </button>
        <button className="btn btn-primary mx-2" onClick={() => setActivePage("crossChainSwap")}>
          Cross Chain Token Swapper
        </button>
      </nav>

      {/* Active Page Content */}
      <div className="card p-4">
        {activePage === "swap" && <TokenSwapper />}
        {activePage === "liquidity" && <AddLiquidity />}
        {activePage === "history" && <ShowHistory />}
        {activePage === "crossChainSwap" && <CrossChainTokenSwapper />} {/* Show Cross Chain Token Swapper Page */}
      </div>
    </div>
  );
};

export default App;
