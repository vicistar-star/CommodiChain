# Testing and Deployment Guidelines

This document provides comprehensive testing strategies and deployment guidelines for CommodiChain contributors.

## 🧪 Testing Strategy

### 1. Unit Testing

#### Backend Testing
```bash
# Run all backend tests
cd backend && npm test

# Run specific test files
npm test -- auth.test.js
npm test -- nft.test.js
npm test -- commodity.test.js

# Test with coverage
npm run test:coverage
```

#### Frontend Testing
```bash
# Run all frontend tests
cd frontend && npm test

# Run component tests
npm test -- WalletConnect.test.js
npm test -- Dashboard.test.js

# Run E2E tests
npm run test:e2e
```

#### Smart Contract Testing
```bash
# Run contract tests
node scripts/testSorobanContracts.js

# Test specific contract
cargo test --package commodity_nft
cargo test --package custodian_registry

# Run with WASM target
cargo test --target wasm32-unknown-unknown
```

### 2. Integration Testing

#### API Integration
```bash
# Test backend endpoints
npm run test:integration

# Test with test database
TEST_DB=true npm test
```

#### Frontend Integration
```bash
# Test API integration
npm run test:integration

# Test wallet integration
npm run test:wallet
```

#### Smart Contract Integration
```bash
# Test contract deployment
node scripts/testDeployment.js

# Test contract interactions
node scripts/testContractInteractions.js
```

### 3. End-to-End Testing

#### User Workflows
```bash
# Test complete user journey
npm run test:e2e:login
npm run test:e2e:mint
npm run test:e2e:transfer
npm run test:e2e:verify
```

#### Cross-Browser Testing
```bash
# Test on multiple browsers
npm run test:chrome
npm run test:firefox
npm run test:safari
```

## 🚀 Deployment Guidelines

### 1. Pre-Deployment Checklist

#### Code Quality
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No linting errors
- [ ] Security scan passed
- [ ] Documentation updated

#### Environment Setup
- [ ] Production variables configured
- [ ] Database migrations run
- [ ] Smart contracts deployed
- [ ] SSL certificates configured
- [ ] Monitoring set up

#### Performance
- [ ] Load testing completed
- [ ] Memory usage optimized
- [ ] Database queries optimized
- [ ] Frontend bundle optimized
- [ ] CDN configured

### 2. Deployment Process

#### Backend Deployment
```bash
# Build for production
npm run build

# Deploy to production
npm run deploy:prod

# Health check
curl -f https://api.commodichain.com/health
```

#### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to production
npm run deploy:prod

# Verify deployment
curl -f https://commodichain.com
```

#### Smart Contract Deployment
```bash
# Deploy to mainnet
SOROBAN_NETWORK=mainnet node scripts/deploySorobanContracts.js

# Verify deployment
node scripts/verifyContractDeployment.js
```

### 3. Post-Deployment Verification

#### Health Checks
```bash
# Backend health
curl -X GET https://api.commodichain.com/health

# Frontend health
curl -X GET https://commodichain.com/health

# Database health
curl -X GET https://api.commodichain.com/db/health
```

#### Monitoring Setup
```bash
# Check application logs
kubectl logs -f deployment/commodichain-backend

# Check error rates
kubectl top -p commodichain-frontend

# Check database performance
kubectl exec -it deployment/commodichain-db -- psql -c "SELECT * FROM pg_stat_activity;"
```

## 🔧 Testing Environments

### Development Environment
```bash
# Use testnet
STELLAR_NETWORK=testnet

# Use test database
DATABASE_URL=postgresql://test:test@localhost:5432/commodichain_test

# Use mock services
MOCK_SERVICES=true
```

### Staging Environment
```bash
# Use testnet with staging data
STELLAR_NETWORK=testnet
STAGING=true

# Use staging database
DATABASE_URL=postgresql://staging:staging@staging-db:5432/commodichain_staging

# Use staging IPFS
IPFS_GATEWAY=https://staging-ipfs.com
```

### Production Environment
```bash
# Use mainnet
STELLAR_NETWORK=public

# Use production database
DATABASE_URL=postgresql://prod:secure@prod-db:5432/commodichain

# Use production IPFS
IPFS_GATEWAY=https://ipfs.io
```

## 📊 Test Coverage Requirements

### Backend Coverage
- **Controllers**: 100% line coverage
- **Services**: 90% line coverage
- **Models**: 95% line coverage
- **Routes**: 100% line coverage
- **Integration**: 80% line coverage

### Frontend Coverage
- **Components**: 85% line coverage
- **Pages**: 90% line coverage
- **Services**: 80% line coverage
- **Hooks**: 85% line coverage
- **Utils**: 90% line coverage

### Smart Contract Coverage
- **Functions**: 100% line coverage
- **Error Cases**: 100% coverage
- **Edge Cases**: 95% coverage

## 🐛 Bug Reporting

### Bug Report Template
```markdown
## Bug Description
**Environment**: Development/Staging/Production
**Browser**: Chrome/Firefox/Safari
**OS**: Windows/Mac/Linux
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
- 

**Actual Behavior**:
- 

**Screenshots**:
- 

**Additional Context**:
- 

**Possible Solution**:
- 
```

### Bug Severity Levels
- **Critical**: Security vulnerabilities, data loss
- **High**: Core functionality broken
- **Medium**: Feature broken, workarounds available
- **Low**: UI issues, minor functionality
- **Trivial**: Documentation, typos

## 🔐 Security Testing

### Security Checklist
- [ ] Input validation tested
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] SQL injection tested
- [ ] XSS tested
- [ ] CSRF tested
- [ ] Rate limiting tested
- [ ] File upload security tested
- [ ] Smart contract security audited
- [ ] Environment variables secured
- [ ] Dependencies scanned for vulnerabilities

### Smart Contract Security
```bash
# Run security audit
cargo audit

# Test contract security
node scripts/testContractSecurity.js

# Verify contract bytecode
soroban contract inspect --wasm deployment/commodity_nft.wasm
```

## 📈 Performance Testing

### Load Testing
```bash
# Backend load test
npm run test:load

# Frontend performance test
npm run test:performance

# Database performance test
npm run test:db-performance
```

### Performance Benchmarks
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 100ms (average)
- **Frontend Load Time**: < 3s (first paint)
- **Contract Execution Time**: < 5s (average)
- **Memory Usage**: < 512MB (per request)

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: CommodiChain CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run lint
      - run: npm run build
      - uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: cargo audit
```

### Deployment Pipeline
```bash
# Automated deployment
npm run deploy:staging
npm run deploy:production

# Rollback procedure
npm run deploy:rollback
```

## 📝 Documentation Requirements

### API Documentation
- [ ] All endpoints documented
- [ ] Request/response examples
- [ ] Error codes documented
- [ ] Authentication requirements
- [ ] Rate limits documented

### Smart Contract Documentation
- [ ] All functions documented
- [ ] Parameter types documented
- [ ] Error conditions documented
- [ ] Gas costs documented
- [ ] Usage examples provided

### User Documentation
- [ ] Getting started guide
- [ ] API reference complete
- [ ] Troubleshooting guide
- [ ] FAQ section
- [ ] Video tutorials

## 🚨 Rollback Procedures

### Database Rollback
```bash
# Backup before deployment
pg_dump commodichain > backup.sql

# Rollback if needed
psql -d commodichain < backup.sql
```

### Smart Contract Rollback
```bash
# Get previous contract version
soroban contract inspect --id previous_contract_id

# Revert if needed
soroban contract invoke --contract_id new_contract_id --function rollback
```

### Frontend Rollback
```bash
# Revert to previous version
git checkout previous_tag

# Force refresh cache
npm run build:clean
```

## 📊 Monitoring and Alerting

### Key Metrics
- **API Response Time**
- **Error Rate**
- **Transaction Success Rate**
- **Contract Execution Time**
- **Database Performance**
- **User Activity**

### Alert Thresholds
- **API Error Rate**: > 5%
- **Response Time**: > 1s
- **Database Connections**: > 80%
- **Memory Usage**: > 80%
- **Disk Space**: > 90%

### Monitoring Tools
- **Application Performance Monitoring (APM)**
- **Log aggregation**
- **Error tracking**
- **Uptime monitoring**
- **Security monitoring**

---

**Remember**: Testing is not just about finding bugs - it's about ensuring reliability, security, and performance. Test thoroughly, document everything, and ship with confidence! 🚀
