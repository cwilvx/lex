import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Coins, RefreshCw, Plus, Trash2, BarChart3, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

interface QueuedTrade {
  id: string;
  timestamp: number;
  token: {
    id: string;
    symbol: string;
    name: string;
  };
  parameters: {
    investmentAmount: number;
    buyPrice: number;
    sellPrice: number;
    calculationMode: string;
  };
  results: {
    tokensCanBuy: number;
    totalRevenue: number;
    netProfit: number;
    profitPercentage: number;
    totalFees: number;
  };
}

const CryptoTradingCalculator = () => {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [targetProfit, setTargetProfit] = useState('');
  const [results, setResults] = useState<any>(null);
  const [calculationMode, setCalculationMode] = useState('profit');
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [tokenPrices, setTokenPrices] = useState<any>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [savedInputs, setSavedInputs] = useState<any>({});
  const [userHasEditedBuyPrice, setUserHasEditedBuyPrice] = useState(false);
  const [userHasEditedSellPrice, setUserHasEditedSellPrice] = useState(false);
  const [queuedTrades, setQueuedTrades] = useState<QueuedTrade[]>([]);
  const [sortBy, setSortBy] = useState('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortSettingsLoaded, setSortSettingsLoaded] = useState(false);

  const tokens = [
    { id: 'eth-ethereum', symbol: 'ETH', name: 'Ethereum', color: 'bg-white' },
    { id: 'sol-solana', symbol: 'SOL', name: 'Solana', color: 'bg-white' },
    { id: 'xrp-xrp', symbol: 'XRP', name: 'XRP', color: 'bg-white' },
    { id: 'sui-sui', symbol: 'SUI', name: 'Sui', color: 'bg-white' }
  ];

  const fetchTokenPrices = async () => {
    setLoadingPrices(true);
    
    try {
      const pricePromises = tokens.map(async (token) => {
        try {
          const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${token.id}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data.quotes || !data.quotes.USD) {
            throw new Error('Invalid data received from API');
          }
          
          return {
            id: token.id,
            price: data.quotes.USD.price,
            change24h: data.quotes.USD.percent_change_24h,
            marketCap: data.quotes.USD.market_cap
          };
        } catch (error) {
          console.error(`Error fetching price for ${token.symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(pricePromises);
      const prices: any = {};
      let successfulFetches = 0;
      
      results.forEach((result, index) => {
        if (result) {
          prices[tokens[index].id] = {
            usd: result.price,
            usd_24h_change: result.change24h,
            market_cap: result.marketCap
          };
          successfulFetches++;
        } else {
          const demoData: any = {
            'eth-ethereum': { usd: 3245.67, usd_24h_change: 2.34, market_cap: 390000000000 },
            'sol-solana': { usd: 198.43, usd_24h_change: -1.22, market_cap: 93000000000 },
            'xrp-xrp': { usd: 0.634, usd_24h_change: 0.87, market_cap: 36000000000 },
            'sui-sui': { usd: 4.12, usd_24h_change: 5.43, market_cap: 11000000000 }
          };
          prices[tokens[index].id] = demoData[tokens[index].id];
        }
      });
      
      setTokenPrices(prices);
      
      if (successfulFetches === tokens.length) {
        console.log('✅ All token prices loaded successfully from CoinPaprika API');
      } else if (successfulFetches > 0) {
        console.log(`⚠️ Partial success: ${successfulFetches}/${tokens.length} prices loaded from API, others using fallback data`);
      } else {
        console.log('❌ All API calls failed, using fallback data');
      }
      
    } catch (error) {
      console.error('Critical error in fetchTokenPrices:', error);
      
      const fallbackData: any = {
        'eth-ethereum': { usd: 3245.67, usd_24h_change: 2.34, market_cap: 390000000000 },
        'sol-solana': { usd: 198.43, usd_24h_change: -1.22, market_cap: 93000000000 },
        'xrp-xrp': { usd: 0.634, usd_24h_change: 0.87, market_cap: 36000000000 },
        'sui-sui': { usd: 4.12, usd_24h_change: 5.43, market_cap: 11000000000 }
      };
      setTokenPrices(fallbackData);
      
      console.log('🔄 Using complete fallback data due to critical error');
    } finally {
      setLoadingPrices(false);
    }
  };

  const saveInputs = (tokenId: string, inputs: any) => {
    try {
      const newSavedInputs = { ...savedInputs, [tokenId]: inputs };
      setSavedInputs(newSavedInputs);
      const inputsString = JSON.stringify(newSavedInputs);
      const storageKey = 'cryptoCalculatorInputs';
      
      // Try localStorage first, fallback to window storage
      try {
        localStorage.setItem(storageKey, inputsString);
      } catch (localStorageError) {
        console.log('localStorage not available, using window storage');
        (window as any)[storageKey] = inputsString;
      }
      
      // Also save the current buy price with the inputs
      const enhancedInputs = { ...inputs, buyPrice };
      const enhancedSavedInputs = { ...savedInputs, [tokenId]: enhancedInputs };
      const enhancedInputsString = JSON.stringify(enhancedSavedInputs);
      
      try {
        localStorage.setItem(storageKey, enhancedInputsString);
      } catch (localStorageError) {
        (window as any)[storageKey] = enhancedInputsString;
      }
    } catch (error) {
      console.log('Error saving inputs:', error);
    }
  };

  const loadSavedInputs = () => {
    try {
      const storageKey = 'cryptoCalculatorInputs';
      
      // Try localStorage first, fallback to window storage
      let saved = null;
      try {
        saved = localStorage.getItem(storageKey);
      } catch (localStorageError) {
        console.log('localStorage not available, using window storage');
        saved = (window as any)[storageKey];
      }
      
      let parsedInputs = null;
      if (saved) {
        parsedInputs = JSON.parse(saved);
        setSavedInputs(parsedInputs);
      }
      
      // Note: Calculation mode is now loaded per-token below
      
      // Load global investment amount (shared across tokens)
      let savedInvestmentAmount = null;
      try {
        savedInvestmentAmount = localStorage.getItem('cryptoCalculatorInvestmentAmount');
      } catch (localStorageError) {
        savedInvestmentAmount = (window as any)['cryptoCalculatorInvestmentAmount'];
      }
      
      if (savedInvestmentAmount) {
        setInvestmentAmount(savedInvestmentAmount);
      }

      // Load last selected token
      let lastSelectedToken = null;
      try {
        lastSelectedToken = localStorage.getItem('cryptoCalculatorLastToken');
      } catch (localStorageError) {
        lastSelectedToken = (window as any)['cryptoCalculatorLastToken'];
      }
      
      if (lastSelectedToken && parsedInputs) {
        const tokenData = JSON.parse(lastSelectedToken);
        const token = tokens.find(t => t.id === tokenData.id);
        if (token) {
          setSelectedToken(token);
          // Load the token's saved inputs
          const tokenInputs = parsedInputs[token.id];
          if (tokenInputs) {
            // Don't load investment amount - it's loaded globally above
            setBuyPrice(tokenInputs.buyPrice || '');
            setSellPrice(tokenInputs.sellPrice || '');
            setTargetProfit(tokenInputs.targetProfit || '');
            if (tokenInputs.calculationMode) {
              setCalculationMode(tokenInputs.calculationMode);
            }
            setUserHasEditedBuyPrice(tokenInputs.userHasEditedBuyPrice || false);
            setUserHasEditedSellPrice(tokenInputs.userHasEditedSellPrice || false);
          }
        }
      }
    } catch (error) {
      console.log('No saved inputs found or error loading:', error);
    }
  };

  const saveCalculationMode = (mode: string) => {
    try {
      // Try localStorage first, fallback to window storage
      try {
        localStorage.setItem('cryptoCalculatorMode', mode);
      } catch (localStorageError) {
        console.log('localStorage not available, using window storage');
        (window as any)['cryptoCalculatorMode'] = mode;
      }
    } catch (error) {
      console.log('Error saving calculation mode:', error);
    }
  };

  const loadInputsForToken = (token: any) => {
    if (!token || !token.id) return;
    
    const tokenInputs = savedInputs[token.id];
    if (tokenInputs) {
      // Don't load investment amount - it's shared across tokens
      setBuyPrice(tokenInputs.buyPrice || '');
      setSellPrice(tokenInputs.sellPrice || '');
      setTargetProfit(tokenInputs.targetProfit || '');
      if (tokenInputs.calculationMode) {
        setCalculationMode(tokenInputs.calculationMode);
      }
      setUserHasEditedBuyPrice(tokenInputs.userHasEditedBuyPrice || false);
      setUserHasEditedSellPrice(tokenInputs.userHasEditedSellPrice || false);
    }
  };

  const selectToken = (token: any) => {
    if (!token || !token.id) return;
    
    if (selectedToken && selectedToken.id) {
      const currentInputs = {
        buyPrice,
        sellPrice,
        targetProfit,
        calculationMode,
        userHasEditedBuyPrice,
        userHasEditedSellPrice
      };
      saveInputs(selectedToken.id, currentInputs);
      
      // Save investment amount globally (shared across tokens)
      try {
        localStorage.setItem('cryptoCalculatorInvestmentAmount', investmentAmount);
      } catch (error) {
        (window as any)['cryptoCalculatorInvestmentAmount'] = investmentAmount;
      }
    }

    setSelectedToken(token);
    
    // Save last selected token
    try {
      localStorage.setItem('cryptoCalculatorLastToken', JSON.stringify(token));
    } catch (localStorageError) {
      (window as any)['cryptoCalculatorLastToken'] = JSON.stringify(token);
    }
    
    // Reset edit flags when switching tokens
    setUserHasEditedBuyPrice(false);
    setUserHasEditedSellPrice(false);
    
    loadInputsForToken(token);
    
    // Set buy price to current token price and fill sell price if empty
    const price = tokenPrices[token.id]?.usd;
    if (price) {
      setBuyPrice(price.toFixed(4));
      
      // Only set sell price if it's currently empty
      if (!sellPrice) {
        const sellPriceValue = price * 1.05; // 5% gain
        setSellPrice(sellPriceValue.toFixed(4));
      }
    }
  };

  const getTokenIcon = (symbol: string) => {
    const tokenLogos: { [key: string]: string } = {
      'ETH': 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
      'XRP': 'https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png?1696501442',
      'SOL': 'https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756',
      'SUI': 'https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290'
    };
    return tokenLogos[symbol.toUpperCase()] || `https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/32`;
  };

  useEffect(() => {
    loadSavedInputs();
    fetchTokenPrices();
    loadQueuedTrades();
    loadSortSettings();
  }, []);

  useEffect(() => {
    if (selectedToken && selectedToken.id) {
      const currentInputs = {
        buyPrice,
        sellPrice,
        targetProfit,
        calculationMode,
        userHasEditedBuyPrice,
        userHasEditedSellPrice
      };
      saveInputs(selectedToken.id, currentInputs);
    }
  }, [buyPrice, sellPrice, targetProfit, calculationMode, userHasEditedBuyPrice, userHasEditedSellPrice, selectedToken]);

  // Save investment amount globally (shared across tokens)
  useEffect(() => {
    try {
      localStorage.setItem('cryptoCalculatorInvestmentAmount', investmentAmount);
    } catch (error) {
      (window as any)['cryptoCalculatorInvestmentAmount'] = investmentAmount;
    }
  }, [investmentAmount]);

  // Save sort settings when they change (but only after initial load)
  useEffect(() => {
    if (sortSettingsLoaded) {
      saveSortSettings(sortBy, sortDirection);
    }
  }, [sortBy, sortDirection, sortSettingsLoaded]);

  // Calculation mode is now saved per-token in the other useEffect

  const calculateTrade = () => {
    const investment = parseFloat(investmentAmount) || 0;
    const buy = parseFloat(buyPrice) || parseFloat(getDefaultBuyPrice()) || 0;
    const sell = parseFloat(sellPrice) || parseFloat(getDefaultSellPrice()) || 0;
    const profit = parseFloat(targetProfit) || 0;

    if (investment <= 0 || buy <= 0) {
      setResults(null);
      return;
    }

    // Apply 0.10% transaction fee on buy
    const buyFeeRate = 0.001; // 0.10%
    const sellFeeRate = 0.001; // 0.10%
    
    const buyFee = investment * buyFeeRate;
    const investmentAfterBuyFee = investment - buyFee;
    const tokensCanBuy = investmentAfterBuyFee / buy;
    
    if (calculationMode === 'profit' && sell > 0) {
      // Calculate revenue before sell fee
      const grossRevenue = tokensCanBuy * sell;
      const sellFee = grossRevenue * sellFeeRate;
      const totalRevenue = grossRevenue - sellFee;
      
      const netProfit = totalRevenue - investment; // Compare against original investment
      const profitPercentage = (netProfit / investment) * 100;
      const priceDifference = sell - buy;
      
      setResults({
        tokensCanBuy: tokensCanBuy,
        totalRevenue: totalRevenue,
        grossRevenue: grossRevenue,
        netProfit: netProfit,
        profitPercentage: profitPercentage,
        priceDifference: priceDifference,
        requiredSellPrice: sell,
        buyFee: buyFee,
        sellFee: sellFee,
        totalFees: buyFee + sellFee
      });
    } else if (calculationMode === 'sellPrice' && profit > 0) {
      // Work backwards from desired profit
      const desiredTotalRevenue = investment + profit;
      
      // Account for sell fee: grossRevenue * (1 - sellFeeRate) = desiredTotalRevenue
      const requiredGrossRevenue = desiredTotalRevenue / (1 - sellFeeRate);
      const requiredSellPrice = requiredGrossRevenue / tokensCanBuy;
      
      const sellFee = requiredGrossRevenue * sellFeeRate;
      const profitPercentage = (profit / investment) * 100;
      const priceDifference = requiredSellPrice - buy;
      
      setResults({
        tokensCanBuy: tokensCanBuy,
        totalRevenue: desiredTotalRevenue,
        grossRevenue: requiredGrossRevenue,
        netProfit: profit,
        profitPercentage: profitPercentage,
        priceDifference: priceDifference,
        requiredSellPrice: requiredSellPrice,
        buyFee: buyFee,
        sellFee: sellFee,
        totalFees: buyFee + sellFee
      });
    }
  };

  useEffect(() => {
    calculateTrade();
  }, [investmentAmount, buyPrice, sellPrice, targetProfit, calculationMode, selectedToken, tokenPrices]);

  const formatCurrency = (amount: number, showDecimals = false) => {
    if (showDecimals) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number, decimals = 6) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const getStepValue = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === 0) return "0.1";
    
    // Get the number of digits before the decimal point
    const integerPart = Math.floor(Math.abs(numPrice));
    const digitsBeforeDecimal = integerPart.toString().length;
    
    if (digitsBeforeDecimal === 1) return "0.1";      // 1 digit: 0.1
    if (digitsBeforeDecimal === 2) return "1";        // 2 digits: 1
    if (digitsBeforeDecimal >= 3) return "10";        // 3+ digits: 10
    
    return "0.1"; // fallback
  };

  const getDefaultBuyPrice = () => {
    if (!selectedToken || !tokenPrices[selectedToken.id]) return '';
    return tokenPrices[selectedToken.id].usd.toFixed(4);
  };

  const getDefaultSellPrice = () => {
    if (!selectedToken || !tokenPrices[selectedToken.id]) return '';
    const currentPrice = tokenPrices[selectedToken.id].usd;
    return (currentPrice * 1.05).toFixed(4); // 5% gain
  };

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
    // Remove any non-numeric characters except decimal point
    let cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Handle edge cases
    if (cleanValue === '.') {
      cleanValue = '0.';
    }
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Prevent leading zeros (except for decimals like 0.5)
    if (cleanValue.length > 1 && cleanValue[0] === '0' && cleanValue[1] !== '.') {
      cleanValue = cleanValue.substring(1);
    }
    
    // Convert to number to check if it's valid and positive
    const numValue = parseFloat(cleanValue);
    if (cleanValue !== '' && (isNaN(numValue) || numValue < 0)) {
      return;
    }
    
    setter(cleanValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow: backspace, delete, tab, escape, enter, home, end, arrow keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    // Allow: numbers, decimal point
    const allowedChars = /^[0-9.]$/;
    
    // Allow copy/paste operations (Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X)
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // For number inputs, we want to allow up/down arrows to work natively
    // so don't prevent default for those
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      return;
    }
    
    // Allow if it's a control key or allowed character
    if (allowedKeys.includes(e.key) || allowedChars.test(e.key)) {
      return;
    }
    
    // Block everything else
    e.preventDefault();
  };

  const getInputValue = (currentValue: string, defaultValue: string, userHasEdited: boolean) => {
    // If user has manually edited the field, always show their value (even if empty)
    if (userHasEdited) {
      return currentValue;
    }
    // Otherwise, show default value if current value is empty
    return currentValue || defaultValue || '';
  };

  const handleBuyPriceChange = (value: string) => {
    setUserHasEditedBuyPrice(true);
    handleNumberInput(value, setBuyPrice);
  };

  const handleSellPriceChange = (value: string) => {
    setUserHasEditedSellPrice(true);
    handleNumberInput(value, setSellPrice);
  };

  const handleBuyPriceBlur = () => {
    const numValue = parseFloat(buyPrice);
    if (numValue === 0 || isNaN(numValue)) {
      setBuyPrice('');
      setUserHasEditedBuyPrice(false);
    }
  };

  const handleSellPriceBlur = () => {
    const numValue = parseFloat(sellPrice);
    if (numValue === 0 || isNaN(numValue)) {
      setSellPrice('');
      setUserHasEditedSellPrice(false);
    }
  };

  const saveQueuedTrades = (trades: QueuedTrade[]) => {
    try {
      const tradesString = JSON.stringify(trades);
      try {
        localStorage.setItem('cryptoCalculatorQueuedTrades', tradesString);
      } catch (localStorageError) {
        (window as any)['cryptoCalculatorQueuedTrades'] = tradesString;
      }
    } catch (error) {
      console.log('Error saving queued trades:', error);
    }
  };

  const loadQueuedTrades = () => {
    try {
      let saved = null;
      try {
        saved = localStorage.getItem('cryptoCalculatorQueuedTrades');
      } catch (localStorageError) {
        saved = (window as any)['cryptoCalculatorQueuedTrades'];
      }
      
      if (saved) {
        const parsedTrades = JSON.parse(saved);
        setQueuedTrades(parsedTrades);
      }
    } catch (error) {
      console.log('Error loading queued trades:', error);
    }
  };

  const saveSortSettings = (sortBy: string, sortDirection: 'asc' | 'desc') => {
    try {
      const sortSettings = { sortBy, sortDirection };
      const settingsString = JSON.stringify(sortSettings);
      try {
        localStorage.setItem('cryptoCalculatorSortSettings', settingsString);
      } catch (localStorageError) {
        (window as any)['cryptoCalculatorSortSettings'] = settingsString;
      }
    } catch (error) {
      console.log('Error saving sort settings:', error);
    }
  };

  const loadSortSettings = () => {
    try {
      let saved = null;
      try {
        saved = localStorage.getItem('cryptoCalculatorSortSettings');
      } catch (localStorageError) {
        saved = (window as any)['cryptoCalculatorSortSettings'];
      }
      
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        if (parsedSettings.sortBy) {
          setSortBy(parsedSettings.sortBy);
        }
        if (parsedSettings.sortDirection) {
          setSortDirection(parsedSettings.sortDirection);
        }
      }
      setSortSettingsLoaded(true);
    } catch (error) {
      console.log('Error loading sort settings:', error);
      setSortSettingsLoaded(true);
    }
  };

  const addTradeToComparison = () => {
    if (!selectedToken || !results) return;

    // Validate that all required parameters are positive (non-zero)
    const investment = parseFloat(investmentAmount) || 0;
    const buy = parseFloat(buyPrice) || parseFloat(getDefaultBuyPrice()) || 0;
    const sell = parseFloat(sellPrice) || parseFloat(getDefaultSellPrice()) || 0;
    const profit = parseFloat(targetProfit) || 0;

    // Prevent adding trades with zero values
    if (investment <= 0) return;
    if (buy <= 0) return;
    if (calculationMode === 'profit' && sell <= 0) return;
    if (calculationMode === 'sellPrice' && profit <= 0) return;

    const trade: QueuedTrade = {
      id: `${selectedToken.id}-${Date.now()}`,
      timestamp: Date.now(),
      token: {
        id: selectedToken.id,
        symbol: selectedToken.symbol,
        name: selectedToken.name
      },
      parameters: {
        investmentAmount: investment,
        buyPrice: buy,
        sellPrice: sell,
        calculationMode
      },
      results: {
        tokensCanBuy: results.tokensCanBuy,
        totalRevenue: results.totalRevenue,
        netProfit: results.netProfit,
        profitPercentage: results.profitPercentage,
        totalFees: results.totalFees
      }
    };

    // Check for duplicate trades (same token + same parameters)
    const isDuplicate = queuedTrades.some(existingTrade => 
      existingTrade.token.id === trade.token.id &&
      existingTrade.parameters.investmentAmount === trade.parameters.investmentAmount &&
      existingTrade.parameters.buyPrice === trade.parameters.buyPrice &&
      existingTrade.parameters.sellPrice === trade.parameters.sellPrice
    );

    if (isDuplicate) return;

    const newTrades = [...queuedTrades, trade];
    setQueuedTrades(newTrades);
    saveQueuedTrades(newTrades);
  };

  const removeTradeFromComparison = (tradeId: string) => {
    const newTrades = queuedTrades.filter(trade => trade.id !== tradeId);
    setQueuedTrades(newTrades);
    saveQueuedTrades(newTrades);
  };

  const clearAllTrades = () => {
    setQueuedTrades([]);
    saveQueuedTrades([]);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
  };

  const getSortedTrades = () => {
    const tradesCopy = [...queuedTrades];
    
    const sortMultiplier = sortDirection === 'desc' ? -1 : 1;
    
    switch (sortBy) {
      case 'profit':
        return tradesCopy.sort((a, b) => (b.results.netProfit - a.results.netProfit) * sortMultiplier);
      case 'percentage':
        return tradesCopy.sort((a, b) => (b.results.profitPercentage - a.results.profitPercentage) * sortMultiplier);
      case 'investment':
        return tradesCopy.sort((a, b) => (b.parameters.investmentAmount - a.parameters.investmentAmount) * sortMultiplier);
      case 'token':
        return tradesCopy.sort((a, b) => {
          const comparison = a.token.symbol.localeCompare(b.token.symbol);
          return comparison * sortMultiplier;
        });
      case 'date':
        return tradesCopy.sort((a, b) => (b.timestamp - a.timestamp) * sortMultiplier);
      default:
        return tradesCopy.sort((a, b) => (b.results.netProfit - a.results.netProfit) * sortMultiplier);
    }
  };

  const sortedTrades = getSortedTrades();

  return (
    <div className="dark min-h-screen bg-background p-4">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Lex Crypto Trading Calculator</h1>
          </div>
          <p className="text-muted-foreground">Plan your trades and calculate potential profits</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="min-h-[705px] border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Trade Parameters
                </CardTitle>
                <Button
                  onClick={fetchTokenPrices}
                  disabled={loadingPrices}
                  variant="outline"
                  size="sm"
                  title="Refresh real-time prices from CoinPaprika API"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingPrices ? 'animate-spin' : ''}`} />
                  Refresh Prices
                </Button>
              </div>
            </CardHeader>
            <CardContent>

            <div className="mb-6">
              <Label className="mb-3 block">
                Select Token (or enter custom price below)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {tokens.map((token) => {
                  if (!token || !token.id) return null;
                  
                  const price = tokenPrices[token.id]?.usd;
                  const change24h = tokenPrices[token.id]?.usd_24h_change;
                  const isSelected = selectedToken?.id === token.id;
                  
                  return (
                    <Button
                      key={token.id}
                      onClick={() => selectToken(token)}
                      variant={isSelected ? "default" : "outline"}
                      className={`p-3 h-auto flex-col items-start justify-start text-left token-button ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full ${token.color} flex items-center justify-center overflow-hidden`}>
                          <img
                            src={getTokenIcon(token.symbol)}
                            alt={token.symbol}
                            className="w-6 h-6"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                              (e.target as any).nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="text-xs font-bold hidden">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{token.symbol}</div>
                          <div className="text-xs text-muted-foreground">{token.name}</div>
                        </div>
                      </div>
                      {price && (
                        <div className="w-full">
                          <div className="flex items-baseline justify-between">
                            <div className="text-sm">
                              ${price.toLocaleString()}
                            </div>
                            {change24h && (
                              <div className={`text-xs ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {!price && (
                        <div className="text-xs text-muted-foreground">Price unavailable</div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">
                  Investment Amount ($)
                </Label>
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => handleNumberInput(e.target.value, setInvestmentAmount)}
                  onKeyDown={handleKeyDown}
                  placeholder="How much do you want to invest?"
                  step={getStepValue(investmentAmount || "1000")}
                />
              </div>

              <div>
                <Label className="mb-2 block">
                  Buy Price ($) {selectedToken && `- ${selectedToken.symbol}`}
                </Label>
                <Input
                  type="number"
                  value={getInputValue(buyPrice, getDefaultBuyPrice(), userHasEditedBuyPrice)}
                  onChange={(e) => handleBuyPriceChange(e.target.value)}
                  onBlur={handleBuyPriceBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={getDefaultBuyPrice() ? `$${parseFloat(getDefaultBuyPrice()).toFixed(4)}` : "Price per token to buy at"}
                  step={getStepValue(buyPrice || getDefaultBuyPrice())}
                />
                {selectedToken && tokenPrices[selectedToken.id] && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Current price: ${tokenPrices[selectedToken.id].usd.toLocaleString()}
                  </div>
                )}
              </div>

              <Tabs 
                value={calculationMode} 
                onValueChange={setCalculationMode}
                className="space-y-4"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="profit" 
                    className="tabs-trigger"
                    style={{ 
                      backgroundColor: calculationMode === 'profit' ? 'white' : undefined,
                      color: calculationMode === 'profit' ? 'black' : undefined
                    }}
                  >
                    Calculate Profit
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sellPrice" 
                    className="tabs-trigger"
                    style={{ 
                      backgroundColor: calculationMode === 'sellPrice' ? 'white' : undefined,
                      color: calculationMode === 'sellPrice' ? 'black' : undefined
                    }}
                  >
                    Find Sell Price
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profit">
                  <div>
                    <Label className="mb-2 block">
                      Sell Price ($)
                    </Label>
                    <Input
                      type="number"
                      value={getInputValue(sellPrice, getDefaultSellPrice(), userHasEditedSellPrice)}
                      onChange={(e) => handleSellPriceChange(e.target.value)}
                      onBlur={handleSellPriceBlur}
                      onKeyDown={handleKeyDown}
                      placeholder={getDefaultSellPrice() ? `$${parseFloat(getDefaultSellPrice()).toFixed(4)}` : "Price per token to sell at"}
                      step={getStepValue(sellPrice || getDefaultSellPrice())}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="sellPrice">
                  <div>
                    <Label className="mb-2 block">
                      Target Profit ($)
                    </Label>
                    <Input
                      type="number"
                      value={targetProfit}
                      onChange={(e) => handleNumberInput(e.target.value, setTargetProfit)}
                      onKeyDown={handleKeyDown}
                      placeholder="How much profit do you want?"
                      step={getStepValue(targetProfit || "50")}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            </CardContent>
          </Card>

          <Card className="min-h-[600px] border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trade Results
                </CardTitle>
                {selectedToken && (
                  <button className="flex items-center gap-2 bg-transparent border-0 h-9 px-3 py-2 text-sm pointer-events-none">
                    <img
                      src={getTokenIcon(selectedToken.symbol)}
                      alt={selectedToken.symbol}
                      className="w-4 h-4"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                        (e.target as any).nextSibling.style.display = 'inline';
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{selectedToken.symbol}</span>
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>

            {results ? (
              <div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1.5">View your potential profits and trade breakdown</p>
                </div>
                <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border border-input">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {selectedToken ? `${selectedToken.symbol} Tokens` : 'Tokens to Buy'}
                        </span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatNumber(results.tokensCanBuy, 4)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        After 0.10% buy fee
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-input">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Price Spread</span>
                      </div>
                      <div className={`text-lg font-semibold ${results.priceDifference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {results.priceDifference >= 0 ? '+' : ''}{formatCurrency(results.priceDifference, true)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Sell - Buy price
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {calculationMode === 'sellPrice' && (
                  <Card className="border border-input">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Required Sell Price</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(results.requiredSellPrice)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <Card className="border border-input">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Net Revenue (After Fees)</div>
                      <div className={`text-xl font-semibold ${results.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(results.totalRevenue)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Gross: {formatCurrency(results.grossRevenue)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-input">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Net Profit</div>
                      <div className={`text-xl font-semibold ${results.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(results.netProfit)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-input">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Profit Percentage</div>
                      <div className={`text-xl font-semibold ${results.profitPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {results.profitPercentage.toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>

                </div>

                <div className="text-left text-sm text-muted-foreground mt-4">
                  Total transaction fees: {formatCurrency(results.totalFees, true)}
                </div>

                <div className="mt-6 pt-4 border-t border-input">
                  <Button 
                    onClick={addTradeToComparison}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Comparison
                  </Button>
                </div>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1.5">View your potential profits and trade breakdown</p>
                </div>
                <div className="text-center py-12">
                  <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Enter your trade parameters to see calculations</p>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Compare Trades Section */}
        <Card className="mt-8 border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Compare Trades
              </CardTitle>
              <div className="flex items-center gap-3">
                {queuedTrades.length > 0 && (
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit">Profit</SelectItem>
                      <SelectItem value="percentage">Profit %</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="token">Token</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {queuedTrades.length > 0 && (
                  <Button
                    onClick={toggleSortDirection}
                    variant="outline"
                    size="sm"
                    title={`Sort ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortDirection === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                  </Button>
                )}
                {queuedTrades.length > 0 && (
                  <Button
                    onClick={clearAllTrades}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sortedTrades.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  {sortedTrades.length} trade{sortedTrades.length !== 1 ? 's' : ''} queued for comparison
                </div>
                <div className="grid gap-4">
                  {sortedTrades.map((trade) => (
                    <Card key={trade.id} className="border border-input">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Token Info - 2 columns */}
                          <div className="col-span-2 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                              <img
                                src={getTokenIcon(trade.token.symbol)}
                                alt={trade.token.symbol}
                                className="w-6 h-6"
                                onError={(e) => {
                                  (e.target as any).style.display = 'none';
                                  (e.target as any).nextSibling.style.display = 'block';
                                }}
                              />
                              <span className="text-xs font-bold hidden text-black">
                                {trade.token.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{trade.token.symbol}</div>
                              <div className="text-xs text-muted-foreground">{trade.token.name}</div>
                            </div>
                          </div>
                          
                          {/* Investment - 2 columns */}
                          <div className="col-span-2">
                            <div className="text-xs text-muted-foreground">Investment</div>
                            <div className="font-medium">{formatCurrency(trade.parameters.investmentAmount)}</div>
                          </div>
                          
                          {/* Buy → Sell - 3 columns */}
                          <div className="col-span-3">
                            <div className="text-xs text-muted-foreground">Buy → Sell</div>
                            <div className="font-medium text-sm">
                              ${trade.parameters.buyPrice.toFixed(4)} → ${trade.parameters.sellPrice.toFixed(4)}
                            </div>
                          </div>
                          
                          {/* Net Profit - 2 columns */}
                          <div className="col-span-2">
                            <div className="text-xs text-muted-foreground">Net Profit</div>
                            <div className={`font-semibold ${trade.results.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(trade.results.netProfit)}
                            </div>
                          </div>
                          
                          {/* Profit % - 2 columns */}
                          <div className="col-span-2">
                            <div className="text-xs text-muted-foreground">Profit %</div>
                            <div className={`font-semibold ${trade.results.profitPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {trade.results.profitPercentage.toFixed(2)}%
                            </div>
                          </div>
                          
                          {/* Delete Button - 1 column */}
                          <div className="col-span-1 flex justify-end">
                            <Button
                              onClick={() => removeTradeFromComparison(trade.id)}
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trades queued for comparison</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure a trade above and click "Add to Comparison" to start comparing trades
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CryptoTradingCalculator;