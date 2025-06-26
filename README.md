# Crypto Trading Calculator

A modern React-based cryptocurrency trading calculator with real-time price data and comprehensive profit/loss analysis.

## Features

🚀 **Live Price Data**: Real-time cryptocurrency prices from CoinPaprika API  
📊 **Dual Calculation Modes**: Calculate profit from sell price or find required sell price for target profit  
💾 **Auto-Save**: Automatically saves and restores inputs for each token  
📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile  
⚡ **Real-time Updates**: Instant calculations as you type  
🎨 **Modern UI**: Beautiful gradient design with Tailwind CSS  

## Supported Cryptocurrencies

- **ETH** (Ethereum)
- **SOL** (Solana) 
- **XRP** (XRP)
- **SUI** (Sui)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

### Build for Production

```bash
npm run build
```

## How to Use

### 1. Select Token
Choose from ETH, SOL, XRP, or SUI to automatically load current market prices. Your inputs are saved for each token (blue dot indicates saved data).

### 2. Calculate Profit Mode
- Enter your investment amount ($)
- Set buy price (auto-filled when selecting a token)
- Set sell price
- View detailed profit/loss analysis

### 3. Find Sell Price Mode
- Enter your investment amount ($)
- Set buy price (auto-filled when selecting a token)
- Enter target profit ($)
- Get the required sell price to achieve your goal

## Features Explained

### Transaction Fees
- **0.10% fee** automatically applied to both buy and sell orders
- **Real-world accuracy** for better trading decisions
- **Fee breakdown** shown in results

### Auto-Save Functionality
- Inputs automatically saved for each cryptocurrency
- Data persists between page refreshes
- Switch between tokens without losing your calculations

### Live Price Integration
- Real-time price data from CoinPaprika API
- Fallback data ensures the app always works
- Manual refresh option available

## Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **CoinPaprika API** - Real-time cryptocurrency data

## Project Structure

```
krypto/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── crypto-trading-calculator.tsx
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

## API Information

This application uses the CoinPaprika API:
- **Endpoint**: `https://api.coinpaprika.com/v1/tickers/{token-id}`
- **Rate Limit**: No authentication required for basic usage
- **Fallback**: Demo data used if API is unavailable

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.

---

Built with ❤️ using React and Tailwind CSS