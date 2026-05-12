# Contributing to CommodiChain

CommodiChain is a blockchain-based platform for issuing NFT-based ownership certificates for physical commodities on Stellar network. We welcome contributions from the community!

## 🚀 Quick Start for Contributors

### Prerequisites
- Node.js 18+ 
- Rust 1.70+
- Soroban CLI
- Git
- Basic knowledge of Stellar blockchain
- Familiarity with React and smart contracts

### Development Setup
```bash
# Clone the repository
git clone https://github.com/vicistar-star/CommodiChain.git
cd CommodiChain

# Install dependencies
./scripts/buildAndDeploy.sh

# Start development servers
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

## 📋 How to Contribute

### 🐛 Bug Reports
- Use the issue tracker with clear, descriptive titles
- Include steps to reproduce
- Add screenshots if applicable
- Specify environment (OS, browser, node version)

### ✨ Feature Requests
- Open an issue with "Feature Request" label
- Describe the use case and expected behavior
- Consider impact on existing functionality

### 💻 Code Contributions

#### Areas for Contribution
1. **Frontend (React)**
   - UI/UX improvements
   - New components/pages
   - Performance optimizations
   - Mobile responsiveness

2. **Backend (Node.js)**
   - API endpoints
   - Database optimizations
   - Security improvements
   - Integration services

3. **Smart Contracts (Rust/Soroban)**
   - New contract features
   - Gas optimizations
   - Security audits
   - Testing improvements

4. **DevOps/Infrastructure**
   - Build scripts
   - CI/CD pipelines
   - Deployment automation
   - Documentation

#### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m "Add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

#### Code Standards
- Follow existing code style and patterns
- Add comments for complex logic
- Include tests for new functionality
- Update documentation as needed

### 📝 Documentation
- API documentation improvements
- README updates
- Code comments
- Tutorial creation

### 🧪 Testing
- Unit tests for new functions
- Integration tests for workflows
- Smart contract testing
- Frontend component testing

## 🏗️ Project Structure

```
CommodiChain/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── routes/         # API routes
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/       # API clients
│   │   └── contexts/       # React contexts
│   └── package.json
├── contracts/              # Soroban smart contracts
│   ├── commodity_nft/     # NFT contract
│   └── custodian_registry/ # Custodian contract
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

## 🎯 Current Development Focus

### Priority Areas
1. **Frontend Polish** (High Priority)
   - Advanced search and filtering
   - Real-time notifications
   - Mobile app optimization
   - Performance improvements

2. **Smart Contract Features** (High Priority)
   - Advanced compliance checks
   - Batch operations
   - Cross-chain functionality
   - Gas optimization

3. **Production Readiness** (Medium Priority)
   - Security audit completion
   - Performance monitoring
   - Error tracking
   - CI/CD pipeline

4. **Documentation** (Medium Priority)
   - API documentation completion
   - Developer tutorials
   - Architecture diagrams
   - Deployment guides

## 🔧 Development Guidelines

### Frontend Development
- Use React 18+ with hooks
- Follow existing component patterns
- Implement responsive design with Tailwind CSS
- Use TypeScript for new components
- Test with different screen sizes

### Backend Development
- Follow RESTful API principles
- Implement proper error handling
- Use environment variables for configuration
- Add comprehensive logging
- Validate all inputs

### Smart Contract Development
- Follow Soroban best practices
- Implement comprehensive error handling
- Add input validation
- Consider gas costs
- Write thorough tests

### Git Workflow
- Use conventional commit messages
- Keep PRs focused and small
- Update documentation with changes
- Tag releases properly

## 📊 Getting Started

### For Frontend Developers
```bash
# Install dependencies
cd frontend && npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### For Backend Developers
```bash
# Install dependencies
cd backend && npm install

# Start development server
npm run dev

# Run database migrations
npx prisma migrate dev

# Run tests
npm test
```

### For Smart Contract Developers
```bash
# Build contracts
./contracts/build.sh

# Deploy contracts
node scripts/deploySorobanContracts.js

# Test contracts
node scripts/testSorobanContracts.js
```

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Community highlights
- Development milestone achievements

## 📞 Getting Help

- **Discord**: Join our development community
- **GitHub Issues**: For bug reports and questions
- **Documentation**: Check existing guides first
- **Code Reviews**: Request reviews on PRs

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🎉 Thank You

Thank you for considering contributing to CommodiChain! Your contributions help make commodity trading more transparent and accessible through blockchain technology.

---

### Quick Checklist for Contributors
- [ ] Read the Code of Conduct
- [ ] Forked the repository
- [ ] Created a feature branch
- [ ] Made your changes
- [ ] Added tests
- [ ] Updated documentation
- [ ] All tests pass
- [ ] Submitted a Pull Request

We look forward to your contributions! 🚀
