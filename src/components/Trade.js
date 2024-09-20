import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useWeb3 } from '../contexts/Web3Context';
import { usePopUp } from '../contexts/PopUpContext';
import { FaEthereum } from 'react-icons/fa6';
import { ethers } from 'ethers';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const TradeContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  padding: 30px;
  z-index: 1000;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  animation: ${fadeIn} 0.3s ease-out;
  width: 350px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  font-size: 20px;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
  }
`;

const TradeRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  font-size: 24px;
  cursor: pointer;
  margin-right: 10px;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
  }
`;

const Panel = styled.div`
  background-color: rgba(0, 255, 0, 0.1);
  border-radius: 15px;
  padding: 15px;
  height: 60px;
  display: flex;
  align-items: center;
  flex-grow: 1;
`;

const InputWrapper = styled.div`
  flex-grow: 1;
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: none;
  background-color: transparent;
  color: #00ff00;
  font-size: 18px;
  outline: none;
  text-align: left;
  font-family: inherit; // Add this line to inherit the font from the parent
  maxLength={8}  // Add this line
  padding-right: 40px; // Reduced padding for smaller max button
`;

const MaxButton = styled.button`
  position: absolute;
  right: 5px;
  top: 5px;
  background: none;
  border: none;
  color: rgba(0, 255, 0, 0.5); // Dimmed color
  padding: 2px 4px;
  font-size: 12px; // Increased from 10px to 12px
  cursor: pointer;
  transition: color 0.2s;
  text-transform: lowercase; // Ensure 'max' is lowercase

  &:hover {
    color: rgba(0, 255, 0, 0.8);
  }
`;

const QuoteText = styled.p`
  color: #00ff00;
  font-size: 18px;
  text-align: left;
  margin: 0;
`;

const ExecuteButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: #000000; // Black background
  color: ${props => props.disabled ? '#333333' : '#00ff00'}; // Dark grey when disabled, bright green otherwise
  border: none;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: capitalize; // Changed from uppercase to capitalize
  letter-spacing: 1px;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  margin-top: 20px; // Add some margin to lower the button

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: #00ff00;
    z-index: -1;
    filter: blur(10px);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 0.7;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const SliderContainer = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
`;

const Slider = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 5px;
  border-radius: 5px;
  background: #00ff00;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #00ff00;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #00ff00;
    cursor: pointer;
  }
`;

const SliderLabel = styled.span`
  color: #00ff00;
  margin-left: 10px;
  min-width: 60px;
`;

const SliderTitle = styled.span`
  color: rgba(0, 255, 0, 0.5);  // Dimmed green color
  font-size: 0.7em;
  margin-bottom: 5px;
`;

const Trade = ({ onClose, animateLogo, setAsyncOutput }) => {
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [isEthOnTop, setIsEthOnTop] = useState(true);
  const { showPopUp } = usePopUp();
  const { signer, rose, balance: nativeBalance, roseBalance, reserve1 } = useWeb3();
  const [slippage, setSlippage] = useState(3); // Default 3% slippage

  const getQuote = async (amount) => {
    if (!signer || !rose || !amount) return null;

    try {
      const roseContract = new ethers.Contract(
        rose,
        [
          'function quoteDeposit(uint256 amount) view returns (uint256)',
          'function quoteWithdraw(uint256 amount) view returns (uint256)'
        ],
        signer
      );

      const amountInWei = ethers.parseEther(amount);
      let quoteAmount;

      if (isEthOnTop) {
        quoteAmount = await roseContract.quoteDeposit(amountInWei);
      } else {
        quoteAmount = await roseContract.quoteWithdraw(amountInWei);
      }

      return ethers.formatEther(quoteAmount);
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  };

  const fetchQuote = useCallback(async () => {
    if (amount) {
      const newQuote = await getQuote(amount);
      setQuote(newQuote);
      console.log(`Quote updated`);
    }
  }, [amount, getQuote]);

  useEffect(() => {
    if (amount) {
      const intervalId = setInterval(fetchQuote, 5000);
      return () => clearInterval(intervalId);
    }
  }, [amount, fetchQuote]);

  const handleAmountChange = async (e) => {
    const newAmount = e.target.value.slice(0, 8);
    setAmount(newAmount);
    const newQuote = await getQuote(newAmount);
    setQuote(newQuote);
    console.log(`Quote updated`);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleExecute();
    }
  };

  useEffect(() => {
    const updateQuote = async () => {
      const newQuote = await getQuote(amount);
      setQuote(newQuote);
    };
    updateQuote();
  }, [isEthOnTop]);

  const handleSlippageChange = (e) => {
    const value = parseFloat(e.target.value);
    setSlippage(Math.round(value * 10) / 10); // Round to 1 decimal place
  };

  const handleExecute = async () => {
    if (!signer) {
      showPopUp('Please connect your wallet first.');
      return;
    }

    const amountInWei = ethers.parseEther(amount);
    const roundedAmount = Math.round(parseFloat(amount) * 1e6) / 1e6;

    // Check if the amount is greater than 0 and meets the minimum requirement
    if (roundedAmount < 0.000001) {
      showPopUp(<>Amount too small. <br /> Minimum amount: 0.000001.</>);
      return;
    }

    animateLogo(async () => {
      if (isEthOnTop) {
        ////////////////////////////////////////////////////////////////////
        ///////////////////////////  Deposit  //////////////////////////////
        ////////////////////////////////////////////////////////////////////
        const nativeBalanceInWei = ethers.parseEther(nativeBalance);
        if (amountInWei > nativeBalanceInWei) {
          showPopUp(<>Insufficient ETH balance. <br /> Current balance: {parseFloat(ethers.formatEther(nativeBalanceInWei)).toFixed(6)}<FaEthereum /></>);
          return;
        }

        try {
          // Set the processing message
          setAsyncOutput(<>Processing deposit of {amount}<FaEthereum /> ...</>);

          const roseContract = new ethers.Contract(
            rose,
            ['function deposit(uint256) payable'],
            signer
          );

          const minQuote = parseFloat(quote) * (100 - slippage) / 100;
          const minQuoteInWei = ethers.parseEther(minQuote.toString());
          const tx = await roseContract.deposit(minQuoteInWei, {
            value: amountInWei
          });

          showPopUp('Transaction sent. Waiting for confirmation...');

          await tx.wait();

          // Set the received message
          setAsyncOutput(<>Received {quote}🌹</>);
          showPopUp(<>Successfully deposited {amount}<FaEthereum /> for {quote}🌹</>);
        } catch (error) {
          console.error('Error during deposit:', error);
          let errorMessage = "An error occurred during the transaction.";
          
          if (error.reason) {
            errorMessage = error.reason;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          // Add this condition
          if (errorMessage.toLowerCase().includes('rejected')) {
            errorMessage = "User rejected the request";
          }
          
          showPopUp(errorMessage);
          setAsyncOutput('Error occurred during deposit. Please try again.');
        }
      } else {
        ////////////////////////////////////////////////////////////////////
        ///////////////////////////  Withdraw  /////////////////////////////
        ////////////////////////////////////////////////////////////////////
        if (amountInWei > ethers.parseEther(roseBalance)) {
          showPopUp(<>Insufficient ROSE balance. <br /> Current balance: {parseFloat(roseBalance).toFixed(6)}🌹</>);
          return;
        }

        // Add check for maximum sell amount (2% of pool)
        const numericReserve1 = parseFloat(reserve1);
        if (parseFloat(amount) > (numericReserve1 / 20)) {
          showPopUp(`Amount too large, can only sell up to 5% of the pool at a time. Max sell: ${(numericReserve1/20).toFixed(6)}🌹`);
          return;
        }

        try {
          // Set the processing message
          setAsyncOutput(<>Processing withdrawal of {amount}🌹 ...</>);

          const roseContract = new ethers.Contract(
            rose,
            ['function withdraw(uint256,uint256)'],
            signer
          );

          const minQuote = parseFloat(quote) * (100 - slippage) / 100;
          const minQuoteInWei = ethers.parseEther(minQuote.toString());
          const tx = await roseContract.withdraw(amountInWei, minQuoteInWei);

          showPopUp('Transaction sent. Waiting for confirmation...');

          await tx.wait();

          // Set the received message
          setAsyncOutput(<>Received {parseFloat(quote).toFixed(6)}<FaEthereum /></>);
          showPopUp(<>Successfully withdrawn {amount}🌹 for {parseFloat(quote).toFixed(6)}<FaEthereum /></>);
        } catch (error) {
          console.error('Error during withdrawal:', error);
          let errorMessage = "An error occurred during the transaction.";
          
          if (error.reason) {
            errorMessage = error.reason;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          // Add this condition
          if (errorMessage.toLowerCase().includes('rejected')) {
            errorMessage = "User rejected the request";
          }
          
          showPopUp(errorMessage);
          setAsyncOutput('Error occurred during withdrawal. Please try again.');
        }
      }
    });
  };

  const handleIconClick = () => {
    setIsEthOnTop(!isEthOnTop);
  };

  const handleMaxClick = () => {
    if (isEthOnTop) {
      // Set max ETH balance, leaving some for gas
      const maxEth = parseFloat(nativeBalance) - 0.01; // Leave 0.01 ETH for gas
      setAmount(maxEth > 0 ? maxEth.toFixed(6) : '0');
    } else {
      // Set max ROSE balance
      setAmount(roseBalance);
    }
  };

  return (
    <TradeContainer>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <TradeRow>
        <IconButton onClick={handleIconClick}>
          {isEthOnTop ? <FaEthereum /> : '🌹'}
        </IconButton>
        <Panel>
          <InputWrapper>
            <Input 
              type="text" 
              value={amount} 
              onChange={handleAmountChange} 
              onKeyPress={handleKeyPress}  // Add this line
              placeholder="Enter amount"
            />
            <MaxButton onClick={handleMaxClick}>max</MaxButton>
          </InputWrapper>
        </Panel>
      </TradeRow>
      <TradeRow>
        <IconButton onClick={handleIconClick}>
          {isEthOnTop ? '🌹' : <FaEthereum />}
        </IconButton>
        <Panel>
          <QuoteText>
            {quote ? parseFloat(quote).toFixed(6) : '0'}
          </QuoteText>
        </Panel>
      </TradeRow>
      <SliderContainer>
        <SliderTitle>Slippage</SliderTitle>
        <SliderRow>
          <Slider
            type="range"
            min="0.1"
            max="25"
            step="0.1"
            value={slippage}
            onChange={handleSlippageChange}
          />
          <SliderLabel>{slippage.toFixed(1)}%</SliderLabel>
        </SliderRow>
      </SliderContainer>
      <ExecuteButton 
        onClick={handleExecute} 
        disabled={!amount} // Disable the button when amount is empty
      >
        Execute
      </ExecuteButton>
    </TradeContainer>
  );
};

export default Trade;
