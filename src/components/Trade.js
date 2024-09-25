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
  top: 55%;
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
  font-family: inherit;
  maxLength={8}
  padding-right: 40px;

  &::placeholder {
    font-size: 15px;
    color: rgba(0, 255, 0, 0.5);
  }
`;

const MaxButton = styled.button`
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 4px;
  color: rgba(0, 255, 0, 0.5);
  padding: 2px 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: lowercase;

  &:hover {
    background: rgba(0, 255, 0, 0.2);
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
  padding: 14px;
  background-color: #000000;
  color: ${props => props.disabled ? '#333333' : '#00ff00'};
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: capitalize;
  letter-spacing: 0px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  margin-top: 20px;
  font-family: inherit;

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
    opacity: ${props => props.disabled ? 0 : 0.7};
  }

  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 0 20px rgba(0, 255, 0, 0.5)'};
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'translateY(1px)'};
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
  overflow: hidden;
  max-height: ${props => props.isVisible ? '50px' : '0'};
  transition: max-height 0.3s ease-out;
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
  font-weight: 500;
  font-size: 13px;
`;

const SliderTitle = styled.span`
  color: ${props => props.isOpen ? 'rgba(0, 255, 0, 0.5)' : 'grey'};
  font-size: 0.7em;
  margin-bottom: 5px;
  cursor: pointer;
  display: flex;
  font-weight: 500;
  align-items: center;
  
  &:hover {
    color: ${props => props.isOpen ? 'rgba(0, 255, 0, 0.8)' : 'lightgrey'};
  }
`;

const ArrowIcon = styled.span`
  margin-left: 5px;
  display: inline-block;
  transition: transform 0.3s ease;
  transform: ${props => props.isOpen ? 'rotate(-90deg)' : 'rotate(90deg)'};
`;

const Trade = ({ onClose, animateLogo, setAsyncOutput }) => {
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [isEthOnTop, setIsEthOnTop] = useState(true);
  const { showPopUp } = usePopUp();
  const { signer, rose, balance: nativeBalance, roseBalance, reserve1 } = useWeb3();
  const [slippage, setSlippage] = useState(3);
  const [isSliderVisible, setIsSliderVisible] = useState(false);

  const getQuote = useCallback(async () => {
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

      if (quoteAmount === 0) {
        return "loading quote...";
      }

      return ethers.formatEther(quoteAmount);
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }, [signer, rose, amount, isEthOnTop]);

  const fetchQuote = useCallback(async () => {
    if (amount) {
      const newQuote = await getQuote();
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
    const newQuote = await getQuote();
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
      const newQuote = await getQuote();
      setQuote(newQuote);
    };
    updateQuote();
  }, [isEthOnTop]);

  const handleSlippageChange = (e) => {
    const value = parseFloat(e.target.value);
    setSlippage(Math.round(value * 10) / 10);
  };

  const toggleSliderVisibility = () => {
    setIsSliderVisible(!isSliderVisible);
  };

  const handleExecute = async () => {
    if (!signer) {
      showPopUp('Please connect your wallet first.');
      return;
    }

    const amountInWei = ethers.parseEther(amount);
    const roundedAmount = Math.round(parseFloat(amount) * 1e6) / 1e6;

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

        const numericReserve1 = parseFloat(reserve1);
        if (parseFloat(amount) > (numericReserve1 / 20)) {
          showPopUp(`Amount too large, can only sell up to 5% of the pool at a time. Max sell: ${(numericReserve1/20).toFixed(6)}🌹`);
          return;
        }

        try {
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
      const maxEth = parseFloat(nativeBalance) - 0.01;
      setAmount(maxEth > 0 ? maxEth.toFixed(6) : '0');
    } else {
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
              onKeyPress={handleKeyPress} 
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
        <SliderTitle onClick={toggleSliderVisibility} isOpen={isSliderVisible}>
          Slippage
          <ArrowIcon isOpen={isSliderVisible}>
            &#10095;
          </ArrowIcon>
        </SliderTitle>
        <SliderRow isVisible={isSliderVisible}>
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
        disabled={!amount}
      >
        Execute
      </ExecuteButton>
    </TradeContainer>
  );
};

export default Trade;
