// src/components/ChartModal.js
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { createChart, CrosshairMode } from 'lightweight-charts';
// Import icons (you need to have these icons in your assets)
import { ReactComponent as LineChartIcon } from '../assets/line-chart-icon.svg';
import { ReactComponent as CandlestickIcon } from '../assets/candlestick-icon.svg';

const ModalOverlay = styled.div`
  /* Adjusted styles to match app's background */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Adjust if needed to match app's style */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  /* Adjusted styles to match app's background */
  background-color: #222; /* Replace with your app's background color */
  padding: 20px;
  border-radius: 4px;
  width: 90%;
  max-width: 800px;
  position: relative;
`;

const ChartContainer = styled.div`
  height: 400px;
`;

const CloseButton = styled.button`
  padding: 6px 10px;
  background-color: #ff4444;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  position: absolute;
  top: 10px;
  right: 10px;
`;

const ChartTitle = styled.button`
  font-family: 'Fira Code', monospace;
  color: #00FF00;
  font-size: 18px;
  background: none;
  border: none;
  cursor: pointer;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const ControlIcon = styled.div`
  cursor: pointer;
  margin-right: 15px;

  svg {
    fill: #00FF00;
    width: 24px;
    height: 24px;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const Select = styled.select`
  font-family: 'Fira Code', monospace;
  background: none;
  color: #00FF00;
  border: none;
  cursor: pointer;
  font-size: 14px;

  option {
    background-color: #222;
    color: #fff;
  }

  &:focus {
    outline: none;
  }
`;

const ChartModal = ({ onClose }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const [chartType, setChartType] = useState('line');
  const [lineSeriesRef, setLineSeriesRef] = useState(null);
  const [candlestickSeriesRef, setCandlestickSeriesRef] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lineData, setLineData] = useState([]);
  const [candlestickData, setCandlestickData] = useState([]);
  const [timeframe, setTimeframe] = useState('300'); // Default to 5 minutes

  const timeframeOptions = [
    { label: '3m', value: '180' },
    { label: '5m', value: '300' },
    { label: '15m', value: '900' },
    { label: '30m', value: '1800' },
    { label: '1h', value: '3600' },
    { label: '4h', value: '14400' },
    { label: '1D', value: '86400' },
    { label: '3D', value: '259200' },
    { label: '1W', value: '604800' },
    { label: '1M', value: '2592000' },
  ];

  useEffect(() => {
    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: 'solid', color: 'black' },
        textColor: 'white', // This will change the text color to white for better visibility
      },
      grid: {
        vertLines: {
          color: '#444',
        },
        horzLines: {
          color: '#444',
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#ccc',
      },
      timeScale: {
        borderColor: '#ccc',
      },
    });

    chartRef.current = chart;

    // Resize chart on container resize
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    // Fetch price data from your API
    fetch('https://rose-price.vercel.app/api/readPrice')
      .then(response => response.json())
      .then(data => {
        const rawData = data.data;
        const lineData = Object.keys(rawData).map(timestamp => ({
          time: Number(timestamp) / 1000, // Convert milliseconds to seconds
          value: rawData[timestamp],
        }));
        // Sort data by time in ascending order
        lineData.sort((a, b) => a.time - b.time);
        setLineData(lineData);

        // Generate candlestick data based on initial timeframe
        const candlestickData = convertToCandlestickData(lineData, timeframe);
        setCandlestickData(candlestickData);

        setIsLoading(false);
      })
      .catch(err => console.error('Error fetching data', err));

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update candlestick data when timeframe changes
  useEffect(() => {
    if (lineData.length > 0) {
      const newCandlestickData = convertToCandlestickData(lineData, timeframe);
      setCandlestickData(newCandlestickData);
    }
  }, [timeframe, lineData]);

  // Effect to update chart when chartType or data changes
  useEffect(() => {
    if (isLoading) return;

    const chart = chartRef.current;

    // Remove existing series if any
    if (lineSeriesRef) {
      chart.removeSeries(lineSeriesRef);
      setLineSeriesRef(null);
    }
    if (candlestickSeriesRef) {
      chart.removeSeries(candlestickSeriesRef);
      setCandlestickSeriesRef(null);
    }

    if (chartType === 'line') {
      const lineSeries = chart.addLineSeries({
        color: '#00FF00', // Updated color
        lineWidth: 2,
      });
      lineSeries.setData(lineData);
      setLineSeriesRef(lineSeries);
    } else if (chartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#00FF00', // Up candle color
        downColor: '#009900', // Down candle color
        borderUpColor: '#00FF00',
        borderDownColor: '#009900',
        wickUpColor: '#00FF00',
        wickDownColor: '#009900',
      });
      candlestickSeries.setData(candlestickData);
      setCandlestickSeriesRef(candlestickSeries);
    }
  }, [chartType, isLoading, candlestickData]);

  const convertToCandlestickData = (data, timeframe) => {
    // Aggregate lineData into candlestick data based on timeframe
    // timeframe is in seconds
    const interval = parseInt(timeframe); // Ensure it's a number

    const candlestickData = [];
    let currentCandle = null;

    data.forEach(dataPoint => {
      const time = Math.floor(dataPoint.time / interval) * interval;
      if (!currentCandle || currentCandle.time !== time) {
        if (currentCandle) {
          candlestickData.push(currentCandle);
        }
        currentCandle = {
          time: time,
          open: dataPoint.value,
          high: dataPoint.value,
          low: dataPoint.value,
          close: dataPoint.value,
        };
      } else {
        currentCandle.high = Math.max(currentCandle.high, dataPoint.value);
        currentCandle.low = Math.min(currentCandle.low, dataPoint.value);
        currentCandle.close = dataPoint.value;
      }
    });

    if (currentCandle) {
      candlestickData.push(currentCandle);
    }

    return candlestickData;
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>Close</CloseButton>
        <ControlsContainer>
          <ControlIcon onClick={() => setChartType('line')}>
            <LineChartIcon />
          </ControlIcon>
          <ControlIcon onClick={() => setChartType('candlestick')}>
            <CandlestickIcon />
          </ControlIcon>
          <Select value={timeframe} onChange={handleTimeframeChange}>
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </ControlsContainer>
        <ChartContainer ref={chartContainerRef} />
      </ModalContent>
    </ModalOverlay>
  );
};

export default ChartModal;