import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useWeb3 } from '../contexts/Web3Context';
import { usePopUp } from '../contexts/PopUpContext';
import { FaEthereum } from 'react-icons/fa6';
import { ethers } from 'ethers';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const TransferContainer = styled.div`
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

const TransferRow = styled.div`
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

const formatAddress = (address) => {
    if (address.length < 14) return address; // Return as-is if it's not a full Ethereum address
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const Transfer = ({ onClose, animateLogo, setAsyncOutput }) => {
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const { showPopUp } = usePopUp();
    const { signer, rose, roseBalance } = useWeb3();

    const handleAmountChange = (e) => {
        const newAmount = e.target.value.slice(0, 8);
        setAmount(newAmount);
    };

    const handleRecipientChange = (e) => {
        setRecipient(e.target.value);
    };

    const handleMaxClick = () => {
        setAmount(parseFloat(roseBalance).toFixed(6) - 0.000001);
    };

    const handleExecute = async () => {
        if (!signer) {
            showPopUp('Please connect your wallet first.');
            return;
        }

        const amountInWei = ethers.parseEther(amount);
        const roundedAmount = Math.round(parseFloat(amount) * 1e6) / 1e6;

        if (roundedAmount > roseBalance) {
            showPopUp(<>Amount greater than balance. <br /> &nbsp; &nbsp; &nbsp; &nbsp; Current rose balance: {roseBalance}🌹</>);
            return;
        }

        if (roundedAmount < 0.000001) {
            showPopUp(<>Amount too small. <br /> Minimum amount: 0.000001.</>);
            return;
        }

        animateLogo(async () => {
            try {
                setAsyncOutput(<>Processing transfer of {amount}🌹 to {recipient} ...</>);

                const roseContract = new ethers.Contract(
                    rose,
                    ['function transfer(address to, uint256 amount) returns (bool)'],
                    signer
                );

                const tx = await roseContract.transfer(recipient, amountInWei);

                showPopUp('Transaction sent. Waiting for confirmation...');

                await tx.wait();

                const formattedRecipient = formatAddress(recipient);
                setAsyncOutput(<>Transferred {amount}🌹 to {recipient}</>);
                showPopUp(<>Transferred {amount}🌹 to {formattedRecipient}</>);
            } catch (error) {
                console.error('Error during transfer:', error);
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
                setAsyncOutput('Error occurred during transfer. Please try again.');
            }
        });
    };

    return (
        <TransferContainer>
            <CloseButton onClick={onClose}>&times;</CloseButton>
            <TransferRow>
                <IconButton>⊡⚃</IconButton>
                <Panel>
                    <InputWrapper>
                        <Input
                            type="text"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Enter amount"
                        />
                        <MaxButton onClick={handleMaxClick}>max</MaxButton>
                    </InputWrapper>
                </Panel>
            </TransferRow>
            <TransferRow>
                <IconButton>⟼</IconButton>
                <Panel>
                    <InputWrapper>
                        <Input
                            type="text"
                            value={recipient}
                            onChange={handleRecipientChange}
                            placeholder="Enter address or ENS"
                        />
                    </InputWrapper>
                </Panel>
            </TransferRow>
            <ExecuteButton
                onClick={handleExecute}
                disabled={!amount || !recipient}
            >
                Transfer
            </ExecuteButton>
        </TransferContainer>
    );
};

export default Transfer;
