import React from 'react'
import { useQuery } from 'react-query'
import { nftAPI, commodityAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import NFTCard from '../components/NFTCard'
import TransferOwnership from '../components/TransferOwnership'
import { Package, TrendingUp, Users, Activity } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [selectedNFT, setSelectedNFT] = React.useState(null)
  const [showTransferModal, setShowTransferModal] = React.useState(false)

  const { data: userNFTs, isLoading: nftsLoading } = useQuery(
    'userNFTs',
    () => nftAPI.getOwned(user?.stellarPublicKey).then(res => res.data),
    { enabled: !!user?.stellarPublicKey }
  )

  const { data: stats } = useQuery(
    'dashboardStats',
    () => Promise.all([
      nftAPI.getOwned(user?.stellarPublicKey).then(res => res.data.statistics),
      commodityAPI.getStatistics({ producerId: user?.id }).then(res => res.data)
    ]).then(([nftStats, commodityStats]) => ({ nftStats, commodityStats })),
    { enabled: !!user?.id }
  )

  const handleTransfer = (nft) => {
    setSelectedNFT(nft)
    setShowTransferModal(true)
  }

  const handleTransferSuccess = (result) => {
    // Refetch NFTs to update the UI
    window.location.reload()
  }

  const handleVerify = (nft) => {
    // Open verification in new tab or modal
    window.open(`/verify/${nft.assetCode}/${nft.issuerPublicKey}`, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your commodity NFTs and track ownership transfers
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total NFTs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.nftStats?.total || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active NFTs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.nftStats?.active || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commodities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.commodityStats?.total || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.nftStats?.mintedThisMonth || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NFTs Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your NFTs</h2>
            <div className="flex space-x-2">
              <button className="btn btn-outline">Filter</button>
              <button className="btn btn-outline">Sort</button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {nftsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your NFTs...</p>
            </div>
          ) : userNFTs?.nfts?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNFTs.nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onTransfer={handleTransfer}
                  onVerify={handleVerify}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No NFTs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by minting your first commodity NFT
              </p>
              <div className="mt-6">
                <a
                  href="/mint"
                  className="btn btn-primary"
                >
                  Mint Your First NFT
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No recent activity</p>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {selectedNFT && (
        <TransferOwnership
          nft={selectedNFT}
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  )
}

export default Dashboard
