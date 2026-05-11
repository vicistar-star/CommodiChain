#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, String, Vec, Map, Symbol,
    panic_with_error,
};

// Contract data keys
const DATA_KEY: Symbol = Symbol::short("DATA");
const COUNTER_KEY: Symbol = Symbol::short("COUNTER");

// Error codes
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    Unauthorized = 1,
    AlreadyRegistered = 2,
    NotRegistered = 3,
    InvalidLicense = 4,
    InactiveCustodian = 5,
}

// Custodian structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Custodian {
    pub id: u64,
    pub name: String,
    pub address: String,
    pub contact: String,
    pub license_number: String,
    pub is_active: bool,
    pub registered_at: u64,
    pub last_verified: Option<u64>,
    pub verification_count: u64,
}

// Registration parameters
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RegisterParams {
    pub name: String,
    pub address: String,
    pub contact: String,
    pub license_number: String,
}

// Verification parameters
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationParams {
    pub custodian_id: u64,
    pub verified_by: Address,
    pub notes: String,
}

// Contract state
#[contracttype]
pub struct CustodianRegistry {
    owner: Address,
    counter: u64,
    custodians: Map<u64, Custodian>,
    license_to_id: Map<String, u64>,
    active_custodians: Vec<u64>,
}

#[contract]
pub struct CustodianRegistry;

#[contractimpl]
impl CustodianRegistry {
    /// Initialize the registry
    pub fn __init(env: Env, owner: Address) {
        let registry = CustodianRegistry {
            owner,
            counter: 0,
            custodians: Map::new(env),
            license_to_id: Map::new(env),
            active_custodians: Vec::new(env),
        };
        
        env.storage().instance().set(&DATA_KEY, &registry);
    }

    /// Register a new custodian
    pub fn register(env: Env, registrar: Address, params: RegisterParams) -> u64 {
        let mut registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        // Only contract owner can register custodians (in production, this could be more flexible)
        if registry.owner != registrar {
            panic_with_error!(&env, Error::Unauthorized);
        }

        // Validate license number uniqueness
        if registry.license_to_id.contains_key(params.license_number.clone()) {
            panic_with_error!(&env, Error::AlreadyRegistered);
        }

        // Create new custodian
        let custodian_id = registry.counter + 1;
        let custodian = Custodian {
            id: custodian_id,
            name: params.name,
            address: params.address,
            contact: params.contact,
            license_number: params.license_number,
            is_active: true,
            registered_at: env.ledger().timestamp(),
            last_verified: None,
            verification_count: 0,
        };

        // Store custodian
        registry.custodians.set(custodian_id, &custodian);
        registry.license_to_id.set(params.license_number, custodian_id);
        registry.active_custodians.push_back(custodian_id);
        registry.counter = custodian_id;

        env.storage().instance().set(&DATA_KEY, &registry);

        custodian_id
    }

    /// Verify a custodian
    pub fn verify(env: Env, verifier: Address, params: VerificationParams) {
        let mut registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        // Only contract owner or authorized verifiers can verify
        if registry.owner != verifier {
            panic_with_error!(&env, Error::Unauthorized);
        }

        let mut custodian = registry.custodians.get(params.custodian_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotRegistered));

        // Update verification info
        custodian.last_verified = Some(env.ledger().timestamp());
        custodian.verification_count += 1;

        registry.custodians.set(params.custodian_id, &custodian);
        env.storage().instance().set(&DATA_KEY, &registry);
    }

    /// Deactivate a custodian
    pub fn deactivate(env: Env, admin: Address, custodian_id: u64) {
        let mut registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        if registry.owner != admin {
            panic_with_error!(&env, Error::Unauthorized);
        }

        let mut custodian = registry.custodians.get(custodian_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotRegistered));

        custodian.is_active = false;

        // Remove from active list
        let index = registry.active_custodians.iter()
            .position(|&id| id == custodian_id)
            .unwrap();
        registry.active_custodians.remove(index as u32);

        registry.custodians.set(custodian_id, &custodian);
        env.storage().instance().set(&DATA_KEY, &registry);
    }

    /// Reactivate a custodian
    pub fn reactivate(env: Env, admin: Address, custodian_id: u64) {
        let mut registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        if registry.owner != admin {
            panic_with_error!(&env, Error::Unauthorized);
        }

        let mut custodian = registry.custodians.get(custodian_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotRegistered));

        custodian.is_active = true;
        registry.active_custodians.push_back(custodian_id);

        registry.custodians.set(custodian_id, &custodian);
        env.storage().instance().set(&DATA_KEY, &registry);
    }

    /// Get custodian by ID
    pub fn get_custodian(env: Env, custodian_id: u64) -> Custodian {
        let registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        registry.custodians.get(custodian_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotRegistered))
    }

    /// Get custodian by license number
    pub fn get_custodian_by_license(env: Env, license_number: String) -> Custodian {
        let registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        let custodian_id = registry.license_to_id.get(license_number)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotRegistered));

        registry.custodians.get(custodian_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotRegistered))
    }

    /// Get all active custodians
    pub fn get_active_custodians(env: Env) -> Vec<u64> {
        let registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        registry.active_custodians.clone()
    }

    /// Check if custodian is active and valid
    pub fn is_valid_custodian(env: Env, custodian_id: u64) -> bool {
        let registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        if let Some(custodian) = registry.custodians.get(custodian_id) {
            custodian.is_active
        } else {
            false
        }
    }

    /// Get total number of registered custodians
    pub fn get_total_custodians(env: Env) -> u64 {
        let registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        registry.counter
    }

    /// Update custodian information
    pub fn update_custodian(env: Env, admin: Address, custodian_id: u64, params: RegisterParams) {
        let mut registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        if registry.owner != admin {
            panic_with_error!(&env, Error::Unauthorized);
        }

        let mut custodian = registry.custodians.get(custodian_id)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotRegistered));

        // Update license mapping if changed
        if custodian.license_number != params.license_number {
            registry.license_to_id.remove(custodian.license_number.clone());
            registry.license_to_id.set(params.license_number, custodian_id);
        }

        // Update custodian info
        custodian.name = params.name;
        custodian.address = params.address;
        custodian.contact = params.contact;
        custodian.license_number = params.license_number;

        registry.custodians.set(custodian_id, &custodian);
        env.storage().instance().set(&DATA_KEY, &registry);
    }

    /// Get registry information
    pub fn get_registry_info(env: Env) -> (Address, u64) {
        let registry: CustodianRegistry = env.storage().instance()
            .get(&DATA_KEY)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));

        (registry.owner, registry.counter)
    }
}
