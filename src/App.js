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
    <div>
      <nav>
        <button onClick={() => setActivePage("swap")}>Token Swapper</button>
        <button onClick={() => setActivePage("liquidity")}>Add Liquidity</button>
        <button onClick={() => setActivePage("history")}>Show History</button>
        <button onClick={() => setActivePage("crossChainSwap")}>Cross Chain Token Swapper</button> {/* New button for cross chain swap */}
      </nav>

      <div>
        {activePage === "swap" && <TokenSwapper />}
        {activePage === "liquidity" && <AddLiquidity />}
        {activePage === "history" && <ShowHistory />}
        {activePage === "crossChainSwap" && <CrossChainTokenSwapper />} {/* Show Cross Chain Token Swapper Page */}
      </div>
    </div>
  );
};

export default App;
