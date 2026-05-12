import React from "react";
import WalletConnect from "../components/WalletConnect";

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CommodiChain
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            NFT-Based Commodity Ownership on Stellar
          </p>
        </div>
        <WalletConnect />
      </div>
    </div>
  );
};

export default Login;
