const axios = require('axios');

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.pinataBaseUrl = 'https://api.pinata.cloud';
  }

  /**
   * Upload commodity metadata to IPFS
   * @param {Object} metadata - Commodity metadata object
   * @returns {Promise<string>} IPFS hash
   */
  async uploadMetadata(metadata) {
    try {
      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
        {
          pinataMetadata: {
            name: metadata.name || `Commodity-${metadata.commodity?.batchId}`,
            keyvalues: {
              type: 'commodity-nft',
              commodityType: metadata.commodity?.type,
              batchId: metadata.commodity?.batchId,
              origin: metadata.commodity?.origin
            }
          },
          pinataContent: metadata
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload file to IPFS (for images, documents, etc.)
   * @param {Buffer} fileData - File data as buffer
   * @param {string} fileName - Name of the file
   * @returns {Promise<string>} IPFS hash
   */
  async uploadFile(fileData, fileName) {
    try {
      const formData = new FormData();
      const blob = new Blob([fileData]);
      formData.append('file', blob, fileName);
      
      formData.append('pinataMetadata', JSON.stringify({
        name: fileName,
        keyvalues: {
          type: 'commodity-document',
          uploadedAt: new Date().toISOString()
        }
      }));

      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  /**
   * Retrieve metadata from IPFS
   * @param {string} ipfsHash - IPFS hash of the metadata
   * @returns {Promise<Object>} Metadata object
   */
  async getMetadata(ipfsHash) {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      return response.data;
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      throw new Error(`Failed to retrieve metadata from IPFS: ${error.message}`);
    }
  }

  /**
   * Create standardized commodity metadata
   * @param {Object} commodityDetails - Commodity information
   * @param {Object} custodian - Custodian information
   * @param {Object} inspection - Inspection details
   * @param {string} imageHash - IPFS hash of commodity image
   * @returns {Object} Formatted metadata object
   */
  createCommodityMetadata(commodityDetails, custodian, inspection, imageHash = null) {
    const metadata = {
      name: `${commodityDetails.type} Batch #${commodityDetails.batchId}`,
      description: `${commodityDetails.weight} ${commodityDetails.type}, ${commodityDetails.purity || 'N/A'} purity, stored at ${custodian.name}`,
      commodity: {
        type: commodityDetails.type,
        weight: commodityDetails.weight,
        purity: commodityDetails.purity || 'N/A',
        origin: commodityDetails.origin,
        batchId: commodityDetails.batchId,
        productionDate: commodityDetails.productionDate || new Date().toISOString().split('T')[0]
      },
      custodian: {
        name: custodian.name,
        address: custodian.address,
        contact: custodian.contact,
        licenseNo: custodian.licenseNo
      },
      inspection: {
        inspector: inspection.inspector || 'Pending',
        date: inspection.date || new Date().toISOString().split('T')[0],
        reportHash: inspection.reportHash || null
      },
      createdAt: new Date().toISOString(),
      version: '1.0'
    };

    if (imageHash) {
      metadata.image = `ipfs://${imageHash}`;
    }

    return metadata;
  }

  /**
   * Validate metadata structure
   * @param {Object} metadata - Metadata object to validate
   * @returns {boolean} Validation result
   */
  validateMetadata(metadata) {
    const requiredFields = [
      'name',
      'description',
      'commodity.type',
      'commodity.weight',
      'commodity.origin',
      'commodity.batchId',
      'custodian.name',
      'custodian.address'
    ];

    for (const field of requiredFields) {
      const keys = field.split('.');
      let current = metadata;
      
      for (const key of keys) {
        if (!current || !current[key]) {
          return false;
        }
        current = current[key];
      }
    }

    return true;
  }

  /**
   * List pinned files from Pinata
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of pinned files
   */
  async listPinnedFiles(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.pageLimit) params.append('pageLimit', filters.pageLimit);
      if (filters.pageOffset) params.append('pageOffset', filters.pageOffset);

      const response = await axios.get(
        `${this.pinataBaseUrl}/data/pinList?${params}`,
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        }
      );

      return response.data.rows;
    } catch (error) {
      console.error('Error listing pinned files:', error);
      throw new Error(`Failed to list pinned files: ${error.message}`);
    }
  }

  /**
   * Unpin file from IPFS
   * @param {string} ipfsHash - IPFS hash to unpin
   * @returns {Promise<boolean>} Success status
   */
  async unpinFile(ipfsHash) {
    try {
      await axios.delete(
        `${this.pinataBaseUrl}/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error unpinning file:', error);
      throw new Error(`Failed to unpin file: ${error.message}`);
    }
  }
}

module.exports = new IPFSService();
