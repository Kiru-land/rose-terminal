// src/components/ChartModal.js
import React, { useRef, useEffect } from 'react';
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

const ChartModal = ({ onClose }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
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

    const lineSeries = chart.addLineSeries({
      color: 'rgba(38,198,218, 1)',
      lineWidth: 2,
    });

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
        const formattedData = Object.keys(rawData).map(timestamp => ({
          time: Number(timestamp) / 1000, // Convert milliseconds to seconds
          value: rawData[timestamp],
        }));
        // Sort data by time in ascending order
        formattedData.sort((a, b) => a.time - b.time);
        lineSeries.setData(formattedData);
      })
      .catch(err => console.error('Error fetching data', err));

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>Close</CloseButton>
        <ChartContainer ref={chartContainerRef} />
      </ModalContent>
    </ModalOverlay>
  );
};

export default ChartModal;