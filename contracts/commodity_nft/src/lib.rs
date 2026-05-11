#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, 
    Address, Env, String, Vec, Map, Symbol,
    token, panic_with_error,
};

// Contract data keys
const DATA_KEY: Symbol = Symbol::short("DATA");
const NFT_COUNTER: Symbol = Symbol::short("COUNTER");
const OWNER_KEY: Symbol = Symbol::short("OWNER");

// Error codes
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    Unauthorized = 1,
    AlreadyMinted = 2,
    InvalidMetadata = 3,
    NotNFTOwner = 4,
    NFTAlreadyBurned = 5,
    InvalidTransfer = 6,
}

// Commodity NFT structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommodityNFT {
    pub id: u64,
    pub owner: Address,
    pub metadata_hash: String,
    pub commodity_type: String,
    pub weight: String,
    pub purity: String,
    pub origin: String,
    pub production_date: u64,
    pub custodian: Address,
    pub inspector: String,
    pub inspection_date: u64,
    pub is_burned: bool,
    pub minted_at: u64,
    pub transferred_at: Option<u64>,
    pub burned_at: Option<u64>,
}

// Minting parameters
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MintParams {
    pub commodity_type: String,
    pub weight: String,
    pub purity: String,
    pub origin: String,
    pub production_date: u64,
    pub custodian: Address,
    pub inspector: String,
    pub inspection_date: u64,
    pub metadata_hash: String,
}

// Transfer parameters
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransferParams {
    pub to: Address,
    pub from: Address,
}

// Contract state
#[contracttype]
pub struct CommodityNFTContract {
    owner: Address,
    nft_counter: u64,
    nfts: Map<u64, CommodityNFT>,
    owner_nfts: Map<Address, Vec<u64>>, // Address -> NFT IDs
}

#[contract]
pub struct CommodityNFTContract;

#[contractimpl]
impl CommodityNFTContract {
    /// Initialize the contract
    pub fn __init(env: Env, owner: Address) {
        let contract = CommodityNFTContract {
            owner,
            nft_counter: 0,
            nfts: Map::new(env),
            owner_nfts: Map::new(env),
        };
        
        env.storage().instance().set(&DATA_KEY, &contract);
    }

    /// Get contract owner
    pub fn get_owner(env: Env) -> Address {
        let contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));
        contract.owner
    }

    /// Mint a new commodity NFT
    pub fn mint(env: Env, minter: Address, params: MintParams) -> u64 {
        // Verify minter authorization (could be restricted to authorized minters)
        let contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        // Validate metadata
        if params.metadata_hash.is_empty() || params.commodity_type.is_empty() {
            panic_with_error!(&env, Error::InvalidMetadata);
        }

        // Create new NFT
        let nft_id = contract.nft_counter + 1;
        let nft = CommodityNFT {
            id: nft_id,
            owner: minter.clone(),
            metadata_hash: params.metadata_hash,
            commodity_type: params.commodity_type,
            weight: params.weight,
            purity: params.purity,
            origin: params.origin,
            production_date: params.production_date,
            custodian: params.custodian,
            inspector: params.inspector,
            inspection_date: params.inspection_date,
            is_burned: false,
            minted_at: env.ledger().timestamp(),
            transferred_at: None,
            burned_at: None,
        };

        // Store NFT
        contract.nfts.set(nft_id, &nft);

        // Update owner's NFT list
        let mut owner_nfts = contract.owner_nfts.get(minter).unwrap_or(Vec::new(env));
        owner_nfts.push_back(nft_id);
        contract.owner_nfts.set(minter, owner_nfts);

        // Update counter
        contract.nft_counter = nft_id;
        env.storage().instance().set(&DATA_KEY, &contract);

        nft_id
    }

    /// Transfer NFT ownership
    pub fn transfer(env: Env, from: Address, params: TransferParams) {
        let mut contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        let nft_id = Self::get_nft_id_by_owner(env, &from, &params.to);
        let mut nft = contract.nfts.get(nft_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotNFTOwner));

        // Verify ownership
        if nft.owner != from {
            panic_with_error!(&env, Error::NotNFTOwner);
        }

        // Check if NFT is burned
        if nft.is_burned {
            panic_with_error!(&env, Error::NFTAlreadyBurned);
        }

        // Remove from old owner's list
        let mut old_owner_nfts = contract.owner_nfts.get(&from).unwrap_or(Vec::new(env));
        let index = old_owner_nfts.iter().position(|&id| id == nft_id).unwrap();
        old_owner_nfts.remove(index as u32);
        contract.owner_nfts.set(&from, old_owner_nfts);

        // Add to new owner's list
        let mut new_owner_nfts = contract.owner_nfts.get(&params.to).unwrap_or(Vec::new(env));
        new_owner_nfts.push_back(nft_id);
        contract.owner_nfts.set(&params.to, new_owner_nfts);

        // Update NFT ownership
        nft.owner = params.to.clone();
        nft.transferred_at = Some(env.ledger().timestamp());

        contract.nfts.set(nft_id, &nft);
        env.storage().instance().set(&DATA_KEY, &contract);
    }

    /// Burn/redeem NFT
    pub fn burn(env: Env, owner: Address, nft_id: u64) {
        let mut contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        let mut nft = contract.nfts.get(nft_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotNFTOwner));

        // Verify ownership
        if nft.owner != owner {
            panic_with_error!(&env, Error::NotNFTOwner);
        }

        // Check if already burned
        if nft.is_burned {
            panic_with_error!(&env, Error::NFTAlreadyBurned);
        }

        // Mark as burned
        nft.is_burned = true;
        nft.burned_at = Some(env.ledger().timestamp());

        contract.nfts.set(nft_id, &nft);
        env.storage().instance().set(&DATA_KEY, &contract);
    }

    /// Get NFT by ID
    pub fn get_nft(env: Env, nft_id: u64) -> CommodityNFT {
        let contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        contract.nfts.get(nft_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotNFTOwner))
    }

    /// Get all NFTs owned by an address
    pub fn get_owner_nfts(env: Env, owner: Address) -> Vec<u64> {
        let contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        contract.owner_nfts.get(owner).unwrap_or(Vec::new(env))
    }

    /// Get NFT metadata
    pub fn get_nft_metadata(env: Env, nft_id: u64) -> String {
        let nft = Self::get_nft(env, nft_id);
        nft.metadata_hash
    }

    /// Check if NFT exists
    pub fn nft_exists(env: Env, nft_id: u64) -> bool {
        let contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        contract.nfts.contains_key(nft_id)
    }

    /// Get total NFTs minted
    pub fn get_total_supply(env: Env) -> u64 {
        let contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        contract.nft_counter
    }

    /// Helper function to get NFT ID from owner and recipient (simplified)
    fn get_nft_id_by_owner(env: Env, _owner: &Address, _recipient: &Address) -> u64 {
        // In a real implementation, this would be passed as a parameter
        // For now, we'll assume the caller knows the NFT ID
        // This is a placeholder - actual implementation would need NFT ID as parameter
        1 // This should be replaced with actual NFT ID lookup
    }

    /// Update NFT metadata (only by contract owner or authorized parties)
    pub fn update_metadata(env: Env, admin: Address, nft_id: u64, new_metadata: String) {
        let mut contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        // Only contract owner can update metadata
        if contract.owner != admin {
            panic_with_error!(&env, Error::Unauthorized);
        }

        let mut nft = contract.nfts.get(nft_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotNFTOwner));

        nft.metadata_hash = new_metadata;
        contract.nfts.set(nft_id, &nft);
        env.storage().instance().set(&DATA_KEY, &contract);
    }

    /// Get contract info
    pub fn get_contract_info(env: Env) -> (Address, u64) {
        let contract: CommodityNFTContract = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        (contract.owner, contract.nft_counter)
    }
}
