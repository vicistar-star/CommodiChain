import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { nftAPI } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowRight, X, Wallet, AlertTriangle } from 'lucide-react'

const TransferOwnership = ({ nft, isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()

  const transferMutation = useMutation(nftAPI.transfer, {
    onSuccess: (data) => {
      toast.success('NFT transferred successfully!')
      onSuccess?.(data.data)
      reset()
      setShowConfirm(false)
      onClose()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to transfer NFT')
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const watchedToAddress = watch('toPublicKey')

  const onSubmit = async (data) => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsSubmitting(true)
    
    const transferData = {
      assetCode: nft.assetCode,
      issuer: nft.issuerPublicKey,
      fromSecret: data.fromSecret,
      toPublicKey: data.toPublicKey
    }

    transferMutation.mutate(transferData)
  }

  const handleClose = () => {
    reset()
    setShowConfirm(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Transfer NFT Ownership
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* NFT Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">NFT Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Asset Code:</span>
                <span className="font-mono text-gray-900">{nft.assetCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commodity:</span>
                <span className="text-gray-900">
                  {nft.commodity?.type} #{nft.commodity?.batchId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weight:</span>
                <span className="text-gray-900">{nft.commodity?.weight}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Owner Secret Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Secret Key (Current Owner)
              </label>
              <input
                type="password"
                {...register('fromSecret', { 
                  required: 'Secret key is required',
                  minLength: {
                    value: 56,
                    message: 'Secret key must be 56 characters'
                  }
                })}
                placeholder="S..."
                className="input-field font-mono text-sm"
              />
              {errors.fromSecret && (
                <p className="mt-1 text-sm text-red-600">{errors.fromSecret.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This will be used to sign the transfer transaction
              </p>
            </div>

            {/* Recipient Public Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient's Public Key
              </label>
              <input
                type="text"
                {...register('toPublicKey', { 
                  required: 'Recipient public key is required',
                  pattern: {
                    value: /^G[A-Z0-9]{55}$/,
                    message: 'Invalid Stellar public key format'
                  }
                })}
                placeholder="G..."
                className="input-field font-mono text-sm"
              />
              {errors.toPublicKey && (
                <p className="mt-1 text-sm text-red-600">{errors.toPublicKey.message}</p>
              )}
            </div>

            {/* Confirmation Warning */}
            {showConfirm && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Confirm Transfer
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      You are about to transfer this NFT to:
                    </p>
                    <p className="mt-1 text-xs font-mono text-yellow-800 bg-yellow-100 p-2 rounded">
                      {watchedToAddress}
                    </p>
                    <p className="mt-2 text-sm text-yellow-700">
                      This action cannot be undone. Please verify the recipient address carefully.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {showConfirm ? 'Confirm Transfer' : 'Transfer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TransferOwnership
