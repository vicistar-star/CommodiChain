import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { nftAPI } from '../services/api'
import { Search, ExternalLink, Package, MapPin, Calendar, User, Shield } from 'lucide-react'

const Verify = () => {
  const [assetCode, setAssetCode] = useState('')
  const [issuer, setIssuer] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const { data: verificationResult, isLoading, error, refetch } = useQuery(
    ['verifyNFT', assetCode, issuer],
    () => nftAPI.verify(assetCode, issuer).then(res => res.data),
    {
      enabled: false,
      retry: false
    }
  )

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!assetCode || !issuer) {
      return
    }
    setIsSearching(true)
    try {
      await refetch()
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Verify NFT</h1>
        <p className="mt-2 text-gray-600">
          Verify the authenticity and ownership of commodity NFTs on the Stellar blockchain
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Code
            </label>
            <input
              type="text"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
              placeholder="e.g., GOLD-NG-AU-2024-00142"
              className="input-field font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issuer Public Key
            </label>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="G..."
              className="input-field font-mono"
              pattern="^G[A-Z0-9]{55}$"
              title="Invalid Stellar public key format"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !assetCode || !issuer}
            className="btn btn-primary disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Verify NFT
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Results */}
      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying NFT on Stellar...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
              <p className="mt-1 text-sm text-red-700">
                {error.response?.data?.error || 'Failed to verify NFT. Please check the asset code and issuer address.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationResult && (
        <div className="space-y-6">
          {/* Verification Success */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">NFT Verified Successfully</h3>
                <p className="mt-1 text-sm text-green-700">
                  This NFT exists on the Stellar blockchain and is authentic.
                </p>
              </div>
            </div>
          </div>

          {/* NFT Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">NFT Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Asset Code</span>
                      <span className="text-sm font-mono text-gray-900">
                        {verificationResult.assetCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Issuer</span>
                      <span className="text-sm font-mono text-gray-900">
                        {verificationResult.issuer?.slice(0, 8)}...{verificationResult.issuer?.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Current Owner</span>
                      <span className="text-sm font-mono text-gray-900">
                        {verificationResult.owner?.slice(0, 8)}...{verificationResult.owner?.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Balance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {verificationResult.balance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`text-sm font-medium ${
                        verificationResult.isBurned ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {verificationResult.isBurned ? 'Burned/Redeemed' : 'Active'}
                      </span>
                    </div>
                    {verificationResult.burnedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Burned At</span>
                        <span className="text-sm text-gray-900">
                          {formatDate(verificationResult.burnedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Commodity Information</h3>
                  {verificationResult.commodity ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          Type
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {verificationResult.commodity.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Batch ID</span>
                        <span className="text-sm font-medium text-gray-900">
                          {verificationResult.commodity.batchId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Weight</span>
                        <span className="text-sm font-medium text-gray-900">
                          {verificationResult.commodity.weight}
                        </span>
                      </div>
                      {verificationResult.commodity.purity && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Purity</span>
                          <span className="text-sm font-medium text-gray-900">
                            {verificationResult.commodity.purity}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Origin
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {verificationResult.commodity.origin}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Production Date
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(verificationResult.commodity.productionDate)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No commodity information available</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {verificationResult.metadata && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(verificationResult.metadata, null, 2)}
                    </pre>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-sm text-gray-500">IPFS Hash:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {verificationResult.ipfsHash}
                    </span>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${verificationResult.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* View on Stellar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href={`https://stellar.expert/explorer/testnet/asset/${verificationResult.assetCode}-${verificationResult.issuer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Stellar Explorer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Verify
