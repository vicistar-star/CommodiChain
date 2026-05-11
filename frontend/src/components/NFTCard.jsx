import React from 'react'
import { Package, MapPin, Calendar, User, ExternalLink, ArrowRight, Shield } from 'lucide-react'

const NFTCard = ({ nft, onTransfer, onVerify, showActions = true }) => {
  const getStatusBadge = (status) => {
    const statusClasses = {
      'REGISTERED': 'status-registered',
      'VERIFIED': 'status-verified',
      'STORED': 'status-stored',
      'TRANSFERRED': 'status-transferred',
      'REDEEMED': 'status-redeemed'
    }
    
    return (
      <span className={statusClasses[status] || 'status-registered'}>
        {status || 'REGISTERED'}
      </span>
    )
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
    <div className="nft-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-stellar-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {nft.commodity?.type || 'Unknown'} #{nft.commodity?.batchId || 'N/A'}
            </h3>
            <p className="text-sm text-gray-600 font-mono">
              {nft.assetCode}
            </p>
          </div>
        </div>
        {getStatusBadge(nft.commodity?.status)}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Weight</span>
          <span className="text-sm font-medium text-gray-900">
            {nft.commodity?.weight || 'N/A'}
          </span>
        </div>

        {nft.commodity?.purity && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Purity</span>
            <span className="text-sm font-medium text-gray-900">
              {nft.commodity.purity}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Origin
          </span>
          <span className="text-sm font-medium text-gray-900">
            {nft.commodity?.origin || 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Production Date
          </span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(nft.commodity?.productionDate)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 flex items-center">
            <User className="w-4 h-4 mr-1" />
            Custodian
          </span>
          <span className="text-sm font-medium text-gray-900">
            {nft.commodity?.custodian?.name || 'N/A'}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Owner</span>
            <span className="text-sm font-mono text-gray-900">
              {nft.currentOwner?.slice(0, 8)}...{nft.currentOwner?.slice(-8)}
            </span>
          </div>
        </div>

        {nft.commodity?.inspection?.inspector && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Inspector
              </span>
              <span className="text-sm font-medium text-gray-900">
                {nft.commodity.inspection.inspector}
              </span>
            </div>
          </div>
        )}
      </div>

      {showActions && (
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
          <button
            onClick={() => onVerify && onVerify(nft)}
            className="w-full btn btn-outline flex items-center justify-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Verify on Stellar
          </button>
          
          {!nft.isBurned && onTransfer && (
            <button
              onClick={() => onTransfer(nft)}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Transfer Ownership
            </button>
          )}
        </div>
      )}

      {nft.isBurned && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            This NFT has been redeemed/burned
          </p>
          <p className="text-xs text-red-600 mt-1">
            Redeemed on: {formatDate(nft.burnedAt)}
          </p>
        </div>
      )}
    </div>
  )
}

export default NFTCard
