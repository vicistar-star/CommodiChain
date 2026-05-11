import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'react-query'
import { nftAPI, commodityAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Plus, Upload, Package, MapPin, Calendar, User, FileText } from 'lucide-react'

const MintNFT = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm()

  const { data: commodities } = useQuery(
    'commodities',
    () => commodityAPI.getAll().then(res => res.data.commodities),
    { enabled: false }
  )

  const mintMutation = useMutation(nftAPI.mint, {
    onSuccess: (data) => {
      toast.success('NFT minted successfully!')
      console.log('Minted NFT:', data.data)
      // Reset form or redirect
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to mint NFT')
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    
    const formData = {
      assetCode: `${data.commodityType}-${data.batchId.toUpperCase()}`,
      commodityDetails: {
        batchId: data.batchId,
        type: data.commodityType,
        weight: data.weight,
        purity: data.purity,
        origin: data.origin,
        productionDate: data.productionDate,
        inspector: data.inspector,
        inspectionDate: data.inspectionDate,
        reportHash: data.reportHash,
        imageHash: selectedFile?.hash // Would be uploaded to IPFS
      },
      custodian: {
        name: data.custodianName,
        address: data.custodianAddress,
        contact: data.custodianContact,
        licenseNo: data.custodianLicense
      },
      receiverPublicKey: data.receiverPublicKey
    }

    mintMutation.mutate(formData)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      // In a real implementation, this would upload to IPFS
      setValue('imageHash', 'temp-file-hash')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Mint Commodity NFT</h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Create a unique NFT representing ownership of a physical commodity batch
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Commodity Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Commodity Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commodity Type
                </label>
                <select
                  {...register('commodityType', { required: 'Commodity type is required' })}
                  className="input-field"
                >
                  <option value="">Select type</option>
                  <option value="Gold">Gold</option>
                  <option value="Crude Oil">Crude Oil</option>
                  <option value="Cocoa">Cocoa</option>
                  <option value="Sesame">Sesame</option>
                  <option value="Coffee">Coffee</option>
                </select>
                {errors.commodityType && (
                  <p className="mt-1 text-sm text-red-600">{errors.commodityType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch ID
                </label>
                <input
                  type="text"
                  {...register('batchId', { required: 'Batch ID is required' })}
                  placeholder="e.g., NG-AU-2024-00142"
                  className="input-field"
                />
                {errors.batchId && (
                  <p className="mt-1 text-sm text-red-600">{errors.batchId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight
                </label>
                <input
                  type="text"
                  {...register('weight', { required: 'Weight is required' })}
                  placeholder="e.g., 10kg"
                  className="input-field"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purity
                </label>
                <input
                  type="text"
                  {...register('purity')}
                  placeholder="e.g., 99.9%"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Origin
                </label>
                <input
                  type="text"
                  {...register('origin', { required: 'Origin is required' })}
                  placeholder="e.g., Zamfara State, Nigeria"
                  className="input-field"
                />
                {errors.origin && (
                  <p className="mt-1 text-sm text-red-600">{errors.origin.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Production Date
                </label>
                <input
                  type="date"
                  {...register('productionDate')}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Custodian Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custodian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custodian Name
                </label>
                <input
                  type="text"
                  {...register('custodianName', { required: 'Custodian name is required' })}
                  placeholder="e.g., Lagos Freeport Vaults Ltd"
                  className="input-field"
                />
                {errors.custodianName && (
                  <p className="mt-1 text-sm text-red-600">{errors.custodianName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  {...register('custodianLicense', { required: 'License number is required' })}
                  placeholder="e.g., LFV-2021-0034"
                  className="input-field"
                />
                {errors.custodianLicense && (
                  <p className="mt-1 text-sm text-red-600">{errors.custodianLicense.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  {...register('custodianAddress', { required: 'Address is required' })}
                  placeholder="e.g., Tin Can Island, Apapa, Lagos"
                  className="input-field"
                />
                {errors.custodianAddress && (
                  <p className="mt-1 text-sm text-red-600">{errors.custodianAddress.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact
                </label>
                <input
                  type="email"
                  {...register('custodianContact', { required: 'Contact is required' })}
                  placeholder="e.g., custody@lagosfreeport.ng"
                  className="input-field"
                />
                {errors.custodianContact && (
                  <p className="mt-1 text-sm text-red-600">{errors.custodianContact.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Inspection Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inspection Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Inspector
                </label>
                <input
                  type="text"
                  {...register('inspector')}
                  placeholder="e.g., Bureau Veritas Nigeria"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Inspection Date
                </label>
                <input
                  type="date"
                  {...register('inspectionDate')}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Report Hash
                </label>
                <input
                  type="text"
                  {...register('reportHash')}
                  placeholder="e.g., QmXyz...abc123"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Supporting Documents</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="btn btn-outline">Upload Image/Document</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-600">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
                {selectedFile && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-900">Selected: {selectedFile.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">NFT Recipient</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receiver's Stellar Public Key
              </label>
              <input
                type="text"
                {...register('receiverPublicKey', { 
                  required: 'Receiver public key is required',
                  pattern: {
                    value: /^G[A-Z0-9]{55}$/,
                    message: 'Invalid Stellar public key format'
                  }
                })}
                placeholder="G..."
                className="input-field font-mono"
              />
              {errors.receiverPublicKey && (
                <p className="mt-1 text-sm text-red-600">{errors.receiverPublicKey.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Minting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Mint NFT
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MintNFT
