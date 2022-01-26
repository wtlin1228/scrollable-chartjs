import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";

export default function ScrollableBar({ x = 50, data, options }) {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const chartRef = useRef(null);
  const WRef = useRef(null);
  const currentNRef = useRef(null);
  const NRef = useRef(null);
  const isScrollModeRef = useRef(null);
  const nxRef = useRef(null);

  const optionsBasedOnIsScrollMode = useMemo(
    () => ({
      ...options,
      responsive: !isScrollMode,
    }),
    [isScrollMode, options]
  );

  const n = useMemo(() => {
    const result = data.datasets.reduce((acc, curr) => {
      if (curr.data.length > acc) {
        return curr.data.length;
      }
      return acc;
    }, 0);
    currentNRef.current = result;
    return result;
  }, [data]);

  const resizeChartBasedPointNumber = useCallback(({ forceResize } = {}) => {
    if (isScrollModeRef.current === null || nxRef.current === null) {
      return;
    }

    if (forceResize || isScrollModeRef.current === true) {
      chartRef.current.resize(
        nxRef.current +
          chartRef.current.width -
          chartRef.current.chartArea.width,
        350
      );
    }
  }, []);

  const goScrollMode = useCallback(() => {
    WRef.current = window.innerWidth;
    NRef.current = currentNRef.current;
    resizeChartBasedPointNumber({ forceResize: true });
    setIsScrollMode(true);
  }, [resizeChartBasedPointNumber]);

  const goRegularMode = useCallback(() => {
    WRef.current = null;
    setIsScrollMode(false);
  }, []);

  useEffect(() => {
    // console.log(`Current state: ${isScrollMode ? "Scroll" : "Regular"} Mode`);
    isScrollModeRef.current = isScrollMode;
  }, [isScrollMode]);

  useEffect(() => {
    nxRef.current = n * x;
  }, [n, x]);

  // initialization
  useEffect(() => {
    if (chartRef.current === null || nxRef.current === null) {
      return;
    }

    if (chartRef.current.chartArea.width < nxRef.current) {
      console.log(
        `Schedule a resize for chart if it's going to be scroll mode`
      );
      // TODO: (wtlin1228) don't know why synchronous resize doesn't work
      setTimeout(() => {
        chartRef.current.resize(
          nxRef.current +
            chartRef.current.width -
            chartRef.current.chartArea.width,
          350
        );
      }, 100);
    }
  }, []);

  // handle n changes
  useEffect(() => {
    // console.log(`handle n changes`);

    if (isScrollModeRef.current === null) {
      return;
    }

    if (isScrollModeRef.current === true) {
      // console.log(`handle n changes -> resizeChartBasedPointNumber`);
      resizeChartBasedPointNumber();
      if (n < NRef.current) {
        // console.log("handle n changes -> go regular mode");
        goRegularMode();
      }
      return;
    }

    if (isScrollModeRef.current === false) {
      if (chartRef.current.chartArea.width < n * x) {
        // console.log("handle n changes -> go scroll mode");
        goScrollMode();
      }
      return;
    }
  }, [n, x, resizeChartBasedPointNumber, goRegularMode, goScrollMode]);

  // handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      // console.log(`handle window resizes`);
      if (isScrollModeRef.current === null || nxRef.current === null) {
        return;
      }

      if (isScrollModeRef.current === true) {
        if (
          window.innerWidth >= WRef.current &&
          window.innerWidth >= nxRef.current
        ) {
          // console.log(`handle window resizes -> go regular mode`);
          goRegularMode();
        }
        return;
      }

      if (isScrollModeRef.current === false) {
        if (chartRef.current.chartArea.width < nxRef.current) {
          // console.log(`handle window resizes -> go scroll mode`);
          goScrollMode();
        }
        return;
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [goRegularMode, goScrollMode, resizeChartBasedPointNumber]);

  window.chartRef = chartRef.current;
  return (
    <div
      style={{
        position: "relative",
        minHeight: "350px",
        width: "100%",
        overflowX: "scroll",
      }}
    >
      <Bar ref={chartRef} options={optionsBasedOnIsScrollMode} data={data} />
    </div>
  );
}
