import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import freighterService from "../services/freighterService";
import toast from "react-hot-toast";
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  Shield,
  ExternalLink,
} from "lucide-react";

const WalletConnect = () => {
  const { login, isAuthenticated } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [freighterStatus, setFreighterStatus] = useState({
    isAvailable: false,
    isConnected: false,
    publicKey: null,
    network: null,
  });

  useEffect(() => {
    // Simulate Freighter detection for demo
    const timer = setTimeout(() => {
      setFreighterStatus({
        isAvailable: true,
        isConnected: false,
        publicKey: null,
        network: "TESTNET",
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const checkFreighterAvailability = async () => {
    try {
      const isAvailable = await freighterService.checkAvailability();
      setFreighterStatus((prev) => ({ ...prev, isAvailable }));

      if (isAvailable) {
        const connectionInfo = await freighterService.getConnectionInfo();
        setFreighterStatus((prev) => ({
          ...prev,
          isConnected: connectionInfo.isConnected,
          publicKey: connectionInfo.publicKey,
          network: connectionInfo.network,
        }));
      }
    } catch (error) {
      console.error("Error checking Freighter availability:", error);
      setFreighterStatus((prev) => ({ ...prev, isAvailable: false }));
    }
  };

  const setupEventListeners = () => {
    freighterService.setupEventListeners(
      (status) => {
        setFreighterStatus((prev) => ({ ...prev, ...status }));
      },
      (status) => {
        setFreighterStatus((prev) => ({ ...prev, ...status }));
      },
      (status) => {
        setFreighterStatus((prev) => ({ ...prev, ...status }));
      },
    );
  };

  const handleConnect = async () => {
    // Demo mode - connect with any public key
    const publicKey = prompt(
      "Enter your Stellar public key (or leave empty for demo):",
      "GDEMO1234567890123456789012345678901234",
    );

    if (publicKey === null) return;

    setIsConnecting(true);
    try {
      const success = await login(
        publicKey || "GDEMO1234567890123456789012345678901234",
      );

      if (success) {
        setFreighterStatus((prev) => ({
          ...prev,
          isConnected: true,
          publicKey: publicKey || "GDEMO1234567890123456789012345678901234",
          network: "TESTNET",
        }));
        toast.success("Connected successfully!");
      } else {
        toast.error("Failed to connect");
      }
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await freighterService.disconnect();
      if (result.success) {
        setFreighterStatus((prev) => ({
          ...prev,
          isConnected: false,
          publicKey: null,
          network: null,
        }));
        toast.success("Disconnected from wallet");
      }
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast.error(error.message || "Failed to disconnect from wallet");
    }
  };

  const getNetworkIcon = () => {
    switch (freighterStatus.network) {
      case "PUBLIC":
        return "🌍";
      case "TESTNET":
        return "🧪";
      default:
        return "❓";
    }
  };

  const getNetworkColor = () => {
    switch (freighterStatus.network) {
      case "PUBLIC":
        return "text-green-600";
      case "TESTNET":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-stellar-500 to-primary-600 rounded-full flex items-center justify-center">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Connect to CommodiChain
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect your Freighter wallet to access the platform
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Freighter Status */}
          <div className="mb-6">
            {freighterStatus.isAvailable ? (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Freighter Wallet Detected
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Your wallet is ready to connect
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Freighter Wallet Not Found
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Please install Freighter browser extension
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Public Key Display */}
          {freighterStatus.isAvailable && freighterStatus.publicKey && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Stellar Public Key
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm font-mono text-gray-900 break-all">
                  {freighterStatus.publicKey}
                </p>
              </div>
            </div>
          )}

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting || !freighterStatus.isAvailable}
            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : !freighterStatus.isAvailable ? (
              "Install Freighter Wallet"
            ) : (
              "Connect Wallet"
            )}
          </button>

          {/* Help Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-500"
              >
                Learn about Freighter
              </a>
            </p>
            <p className="text-xs text-gray-500">
              By connecting, you agree to the CommodiChain terms of service
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">Secure</p>
            <p className="mt-1 text-xs text-gray-500">Non-custodial wallet</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">Verified</p>
            <p className="mt-1 text-xs text-gray-500">On-chain verification</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">
              Transparent
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Public transaction history
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
