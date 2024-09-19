import React, { useState, useEffect } from 'react';
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
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: none;
  background-color: transparent;
  color: #00ff00;
  font-size: 18px;
  outline: none;
  text-align: left;  // Changed from center to left
`;

const QuoteText = styled.p`
  color: #00ff00;
  font-size: 18px;
  text-align: left;  // Changed from center to left
  margin: 0;
`;

const ExecuteButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: #000000; // Black background
  color: #00ff00; // Bright green text
  border: none;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  position: relative;
  overflow: hidden;

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

const Trade = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [isEthOnTop, setIsEthOnTop] = useState(true);
  const { showPopUp } = usePopUp();
  const { signer, rose, balance: nativeBalance, roseBalance } = useWeb3();

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

  const handleAmountChange = async (e) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
    const newQuote = await getQuote(newAmount);
    setQuote(newQuote);
  };

  useEffect(() => {
    const updateQuote = async () => {
      const newQuote = await getQuote(amount);
      setQuote(newQuote);
    };
    updateQuote();
  }, [isEthOnTop]);

  const handleExecute = async () => {
    if (!signer) {
      showPopUp('Please connect your wallet first.');
      return;
    }

    const amountInWei = ethers.parseEther(amount);

    if (isEthOnTop) {
      // ETH to ROSE (deposit)
      if (amountInWei > nativeBalance) {
        showPopUp('Insufficient ETH balance. Please enter a smaller amount.');
        return;
      }

      try {
        const roseContract = new ethers.Contract(
          rose,
          ['function deposit() payable'],
          signer
        );

        const tx = await roseContract.deposit({
          value: amountInWei
        });

        showPopUp('Transaction sent. Waiting for confirmation...');

        await tx.wait();

        showPopUp(`Successfully deposited ${amount} ETH for ${quote} ROSE`);
      } catch (error) {
        console.error('Error during deposit:', error);
        showPopUp(`Error: ${error.message}`);
      }
    } else {
      // ROSE to ETH (withdraw)
      if (amountInWei > roseBalance) {
        showPopUp('Insufficient ROSE balance. Please enter a smaller amount.');
        return;
      }

      try {
        const roseContract = new ethers.Contract(
          rose,
          ['function withdraw(uint256 amount)'],
          signer
        );

        const tx = await roseContract.withdraw(amountInWei);

        showPopUp('Transaction sent. Waiting for confirmation...');

        await tx.wait();

        showPopUp(`Successfully withdrawn ${amount} ROSE for ${quote} ETH`);
      } catch (error) {
        console.error('Error during withdrawal:', error);
        showPopUp(`Error: ${error.message}`);
      }
    }
  };

  const handleIconClick = () => {
    setIsEthOnTop(!isEthOnTop);
  };

  return (
    <TradeContainer>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <TradeRow>
        <IconButton onClick={handleIconClick}>
          {isEthOnTop ? <FaEthereum /> : '🌹'}
        </IconButton>
        <Panel>
          <Input 
            type="text" 
            value={amount} 
            onChange={handleAmountChange} 
            placeholder="Enter amount to trade"
          />
        </Panel>
      </TradeRow>
      <TradeRow>
        <IconButton onClick={handleIconClick}>
          {isEthOnTop ? '🌹' : <FaEthereum />}
        </IconButton>
        <Panel>
          <QuoteText>
            {quote ? `Quote: ${quote}` : 'Enter an amount to see quote'}
          </QuoteText>
        </Panel>
      </TradeRow>
      <ExecuteButton onClick={handleExecute}>Execute</ExecuteButton>
    </TradeContainer>
  );
};

export default Trade;
