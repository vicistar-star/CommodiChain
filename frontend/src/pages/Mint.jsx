import React from 'react'
import MintNFT from '../components/MintNFT'

const Mint = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mint NFT</h1>
          <p className="mt-2 text-gray-600">
            Create a unique NFT representing ownership of a physical commodity batch
          </p>
        </div>
        <MintNFT />
      </div>
    </div>
  )
}

export default Mint
