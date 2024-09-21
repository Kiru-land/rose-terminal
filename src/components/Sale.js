import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useWeb3 } from '../contexts/Web3Context';
import { usePopUp } from '../contexts/PopUpContext';
import { FaEthereum, FaQuestionCircle } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ethers } from 'ethers';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const SaleContainer = styled.div`
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
  width: 380px;
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

const SaleRow = styled.div`
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
  margin-top: 30px;
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

const DashboardContainer = styled.div`
  margin-top: 20px;
`;

const DashboardTitle = styled.div`
  color: ${props => props.isOpen ? 'rgba(0, 255, 0, 0.8)' : 'grey'};
  font-size: 0.9em;
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  font-weight: 500;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    color: ${props => props.isOpen ? 'rgba(0, 255, 0, 1)' : 'lightgrey'};
  }
`;

const ArrowIcon = styled.span`
  display: inline-block;
  transition: transform 0.3s ease;
  transform: ${props => props.isOpen ? 'rotate(-90deg)' : 'rotate(90deg)'};
`;

const DashboardContent = styled.div`
  display: ${props => props.isVisible ? 'block' : 'none'};
  animation: ${fadeIn} 0.3s ease-out;
`;

const Dashboard = styled.div`
  background-color: rgba(0, 255, 0, 0.1);
  border-radius: 15px;
  padding: 10px;
  margin-top: 15px;
`;

const DashboardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 14px;
  color: #00ff00;
`;

const DashboardLabel = styled.span`
  opacity: 0.7;
  display: flex;
  align-items: center;
`;

const DashboardValue = styled.span`
  font-weight: normal;
`;

const HelpIcon = styled(FaQuestionCircle)`
  margin-left: 5px;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const HelpTooltip = styled.div`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.9);
  color: #00ff00;
  padding: 15px;
  border-radius: 15px;
  font-size: 12px;
  max-width: 400px;
  width: 400px;
  z-index: 1000;
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  opacity: ${props => props.visible ? 1 : 0};
  transition: visibility 0.2s, opacity 0.2s;
  left: 100%;
  top: 0;
  margin-left: 10px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  line-height: 1.4;
  border: 1px solid rgba(0, 255, 0, 0.3);
`;

const ChartContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 15px;
`;

const CustomTooltip = styled.div`
  background-color: rgba(0, 0, 0, 0.8);
  border: 1px solid #00ff00;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
`;

const TooltipLabel = styled.p`
  color: #00ff00;
  font-size: 14px;
  margin: 0;
  text-shadow: 0 0 5px #00ff00;
`;

const Sale = ({ onClose, animateLogo, setAsyncOutput }) => {
  const [amount, setAmount] = useState('');
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { showPopUp } = usePopUp();
  const { signer, balance: nativeBalance, sale: saleAddress } = useWeb3();

  const softCap = "200 ETH";
  const hardCap = "1000 ETH";
  const amountRaised = "75 ETH";
  const expectedMarketCap = "$1m";

  const data = [
    { name: 'Fair Launch', value: 75 },
    { name: 'Liquidity', value: 20 },
    { name: 'Treasury', value: 5 },
  ];

  const COLORS = ['#00ff00', '#00ccff', '#ff00ff'];

  const handleAmountChange = (e) => {
    const newAmount = e.target.value.slice(0, 8);
    setAmount(newAmount);
  };

  const handleMaxClick = () => {
    const maxEth = parseFloat(nativeBalance) - 0.01;
    setAmount(maxEth > 0 ? maxEth.toFixed(6) : '0');
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
      const nativeBalanceInWei = ethers.parseEther(nativeBalance);
      if (amountInWei > nativeBalanceInWei) {
        showPopUp(<>Insufficient ETH balance. <br /> Current balance: {parseFloat(ethers.formatEther(nativeBalanceInWei)).toFixed(6)}<FaEthereum /></>);
        return;
      }

      try {
        setAsyncOutput(<>Processing participation of {amount}<FaEthereum /> ...</>);

        if (amountInWei > nativeBalanceInWei) {
          showPopUp(<>Insufficient ETH balance. <br /> Current balance: {parseFloat(ethers.formatEther(nativeBalanceInWei)).toFixed(6)}<FaEthereum /></>);
          return;
        }

        const saleContract = new ethers.Contract(
          saleAddress,
          ['function participate() payable'],
          signer
        );

        const tx = await saleContract.participate({
          value: amountInWei
        });

        showPopUp('Transaction sent. Waiting for confirmation...');

        await tx.wait();

        setAsyncOutput(<>Successfully participated for {amount}<FaEthereum /></>);
        showPopUp(<>Successfully participated in the sale for {amount}<FaEthereum /></>);
      } catch (error) {
        console.error('Error during sale participation:', error);
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
        setAsyncOutput('Error occurred during sale participation. Please try again.');
      }
    });
  };

  const CustomTooltipContent = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <CustomTooltip>
          <TooltipLabel>{`${data.name}: ${data.value}%`}</TooltipLabel>
        </CustomTooltip>
      );
    }
    return null;
  };

  const toggleDashboardVisibility = () => {
    setIsDashboardVisible(!isDashboardVisible);
  };

  return (
    <SaleContainer>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <SaleRow>
        <IconButton>
          <FaEthereum />
        </IconButton>
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
      </SaleRow>
      <DashboardContainer>
        <DashboardTitle onClick={toggleDashboardVisibility} isOpen={isDashboardVisible}>
          Sale Details
          <ArrowIcon isOpen={isDashboardVisible}>
            &#10095;
          </ArrowIcon>
        </DashboardTitle>
        <DashboardContent isVisible={isDashboardVisible}>
          <Dashboard>
            <DashboardRow>
              <DashboardLabel>
                Type:
                <HelpIcon 
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                <HelpTooltip visible={showTooltip}>
                  <strong>Proportional Oversubscribed Capped Sale</strong><br /><br />
                  This Fair Launch has a <em>soft</em> and <em>hard</em> cap. <br /> <br />
                  1.) If the total amount raised is smaller than the soft cap, all participation gets reimbursed. <br /> <br />
                  2.) If the amount raised is bigger than the hard cap, the excess tokens get proportionally reimbursed to every user.<br /> <br />
                  Participants receive a part of the 75% of ROSE tokens sold based on their proportional share of the total <FaEthereum /> submitted.<br /> <br />
                  <em>Note: This expected total market cap will vary between 800<FaEthereum /> for the soft cap and 4000<FaEthereum /> for the hard cap.</em>
                </HelpTooltip>
              </DashboardLabel>
              <DashboardValue>Fair Launch</DashboardValue>
            </DashboardRow>
            <DashboardRow>
              <DashboardLabel>Soft Cap:</DashboardLabel>
              <DashboardValue>{softCap}</DashboardValue>
            </DashboardRow>
            <DashboardRow>
              <DashboardLabel>Hard Cap:</DashboardLabel>
              <DashboardValue>{hardCap}</DashboardValue>
            </DashboardRow>
            <DashboardRow>
              <DashboardLabel>Amount Raised:</DashboardLabel>
              <DashboardValue>{amountRaised}</DashboardValue>
            </DashboardRow>
            <DashboardRow>
              <DashboardLabel>Expected Market Cap:</DashboardLabel>
              <DashboardValue>{expectedMarketCap}</DashboardValue>
            </DashboardRow>
            <ChartContainer>
              <PieChart width={240} height={240}>
                <Pie
                  data={data}
                  cx={120}
                  cy={120}
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  cornerRadius={6}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="rgba(0, 0, 0, 0.3)"
                      strokeWidth={1}
                      style={{
                        filter: `drop-shadow(0 0 3px ${COLORS[index % COLORS.length]})`
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </Dashboard>
        </DashboardContent>
      </DashboardContainer>
      <ExecuteButton 
        onClick={handleExecute} 
        disabled={!amount}
      >
        Participate
      </ExecuteButton>
    </SaleContainer>
  );
};

export default Sale;
