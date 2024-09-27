// src/components/ChartModal.js
import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { createChart, CrosshairMode } from 'lightweight-charts';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #222;
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

const SwitchButton = styled.button`
  padding: 6px 12px;
  margin-right: 10px;
  background-color: #555;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #777;
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

  useEffect(() => {
    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: '#222',
        textColor: '#d1d4dc',
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

        // Convert to candlestick data
        const candlestickData = convertToCandlestickData(lineData);
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
        color: 'rgba(38,198,218, 1)',
        lineWidth: 2,
      });
      lineSeries.setData(lineData);
      setLineSeriesRef(lineSeries);
    } else if (chartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#0f0',
        downColor: '#f00',
        borderUpColor: '#0f0',
        borderDownColor: '#f00',
        wickUpColor: '#0f0',
        wickDownColor: '#f00',
      });
      candlestickSeries.setData(candlestickData);
      setCandlestickSeriesRef(candlestickSeries);
    }
  }, [chartType, isLoading]);

  const convertToCandlestickData = (lineData) => {
    // Aggregate lineData into candlestick data
    // For simplicity, group data into 5-minute intervals
    const interval = 300; // 5 minutes in seconds
    const candlestickData = [];
    let currentCandle = null;

    lineData.forEach(dataPoint => {
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

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>Close</CloseButton>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <SwitchButton onClick={() => setChartType('line')}>Line Chart</SwitchButton>
          <SwitchButton onClick={() => setChartType('candlestick')}>Candlestick Chart</SwitchButton>
        </div>
        <ChartContainer ref={chartContainerRef} />
      </ModalContent>
    </ModalOverlay>
  );
};

export default ChartModal;