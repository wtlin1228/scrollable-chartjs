import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import usePrevious from "../hooks/usePrevious";

const Y_AXES_LEFT_OVERFLOW_WIDTH = 7;

export const CHART_TYPE = {
  bar: "bar",
  line: "line",
};

const getShouldBeScrollMode = ({
  xTickMinWidth,
  xTickCount,
  currentChartAreaWidth,
}) => {
  const currentXTickWidth = currentChartAreaWidth / xTickCount;
  return currentXTickWidth < xTickMinWidth;
};

export default function ScrollableChart({
  chartType,
  height = 350,
  xTickMinWidth = 64,
  xTickCount,
  options,
  children,
}) {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const isScrollModeRef = useRef(false);
  const isCustomizedYAxisDrawnRef = useRef(false);

  /* -------------------------------------------------------------------------- */
  /*                                Helpers                                     */
  /* -------------------------------------------------------------------------- */
  const getWidthBesidesChartArea = () =>
    chartRef.current.width - chartRef.current.chartArea.width;

  const resizeChartForScrollMode = useCallback(() => {
    chartRef.current.resize(
      xTickMinWidth * xTickCount + getWidthBesidesChartArea(),
      height
    );
  }, [height, xTickCount, xTickMinWidth]);

  const goScrollMode = useCallback(() => {
    if (isScrollModeRef.current === false) {
      setIsScrollMode(true);
      isScrollModeRef.current = true;
    }

    resizeChartForScrollMode();
  }, [resizeChartForScrollMode]);

  const goScaleMode = useCallback(() => {
    if (isScrollModeRef.current === true) {
      setIsScrollMode(false);
      isScrollModeRef.current = false;
    }
  }, []);

  const goEitherScrollOrScaleMode = useCallback(() => {
    const shouldBeScrollMode = getShouldBeScrollMode({
      xTickMinWidth,
      xTickCount,
      currentChartAreaWidth:
        chartWrapperRef.current.getBoundingClientRect().width -
        getWidthBesidesChartArea(),
    });

    if (shouldBeScrollMode) {
      goScrollMode();
    } else {
      goScaleMode();
    }
  }, [xTickMinWidth, xTickCount, goScrollMode, goScaleMode]);

  const getOriginalYAxisWidth = useCallback(() => {
    if (chartType === CHART_TYPE.bar) {
      return chartRef.current.scales.y.width;
    }

    if (chartType === CHART_TYPE.line) {
      const xPositionForTheFirstXGridLine =
        chartRef.current.scales.x._gridLineItems[0].tx1;
      return Math.max(
        chartRef.current.scales.y.width,
        xPositionForTheFirstXGridLine
      );
    }
  }, [chartType]);

  const getOriginalYAxisHeight = useCallback(
    () =>
      chartRef.current.scales.y.height +
      chartRef.current.scales.y.paddingTop +
      chartRef.current.scales.y.top,
    []
  );

  const clearOriginalYAxis = useCallback(() => {
    chartRef.current.canvas
      .getContext("2d")
      .clearRect(0, 0, getOriginalYAxisWidth(), getOriginalYAxisHeight());
  }, [getOriginalYAxisHeight, getOriginalYAxisWidth]);

  const drawCustomizedYAxis = useCallback(() => {
    if (isCustomizedYAxisDrawnRef.current === true) {
      return;
    }

    const yAxisCtx = yAxisRef.current.getContext("2d");
    const scale = window.devicePixelRatio;
    const height = getOriginalYAxisHeight();
    const width = getOriginalYAxisWidth();

    yAxisCtx.scale(scale, scale);
    yAxisRef.current.height = height * scale;
    yAxisRef.current.width = width * scale;
    yAxisRef.current.style.height = height + "px";
    yAxisRef.current.style.width = width + "px";
    yAxisCtx.drawImage(
      chartRef.current.canvas,
      0,
      0,
      (width - Y_AXES_LEFT_OVERFLOW_WIDTH) * scale,
      height * scale,
      0,
      0,
      (width - Y_AXES_LEFT_OVERFLOW_WIDTH) * scale,
      height * scale
    );

    isCustomizedYAxisDrawnRef.current = true;
  }, [getOriginalYAxisHeight, getOriginalYAxisWidth]);

  /* -------------------------------------------------------------------------- */
  /*                                Initialize                                  */
  /* -------------------------------------------------------------------------- */
  const isInitializedRef = useRef(false);
  const plugin = useMemo(() => {
    return {
      id: "draw-customized-y-axis-plugin",
      afterDraw() {
        if (isScrollModeRef.current === false) {
          return;
        }

        if (isCustomizedYAxisDrawnRef.current === false) {
          drawCustomizedYAxis();
        }

        // Note:
        // We can skip `clearOriginalYAxis()`
        // if the background color of custom y axis is not transparent.
        clearOriginalYAxis();
      },
      afterRender() {
        if (isInitializedRef.current === false) {
          isInitializedRef.current = true;
          goEitherScrollOrScaleMode();
        }
      },
    };
  }, [clearOriginalYAxis, drawCustomizedYAxis, goEitherScrollOrScaleMode]);

  /* -------------------------------------------------------------------------- */
  /*     Whenever xTickCount changes, we need to redraw customized y axis.      */
  /* -------------------------------------------------------------------------- */
  const previousXTickCount = usePrevious(xTickCount);
  useEffect(() => {
    if (isInitializedRef.current === false) {
      return;
    }

    if (previousXTickCount !== xTickCount) {
      isCustomizedYAxisDrawnRef.current = false;
    }
  }, [previousXTickCount, xTickCount]);

  /* -------------------------------------------------------------------------- */
  /*                                Resize                                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!chartWrapperRef.current) {
      return;
    }

    const targetElem = chartWrapperRef.current;

    const resizeObserver = new ResizeObserver(goEitherScrollOrScaleMode);
    resizeObserver.observe(targetElem);
    return () => resizeObserver.unobserve(targetElem);
  }, [goEitherScrollOrScaleMode]);

  /* -------------------------------------------------------------------------- */
  /*                          Patched Chart Props                               */
  /* -------------------------------------------------------------------------- */
  const optionsBasedOnScrollMode = useMemo(
    () => ({
      ...options,
      responsive: !isScrollMode,
    }),
    [isScrollMode, options]
  );

  /* -------------------------------------------------------------------------- */
  /*                           HTML Element Ref                                 */
  /* -------------------------------------------------------------------------- */
  const chartWrapperRef = useRef(null);
  const chartRef = useRef(null);
  const yAxisRef = useRef(null);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div
        ref={chartWrapperRef}
        style={{
          position: "relative",
          height: `${height}px`,
          width: "100%",
          overflowX: "scroll",
        }}
      >
        {children({
          ref: chartRef,
          options: optionsBasedOnScrollMode,
          plugins: [plugin],
        })}
      </div>
      <canvas
        ref={yAxisRef}
        height={height}
        width="0"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          background: "white",
          borderRight: "1px solid #ebebeb",
          display: isScrollMode ? "block" : "none",
        }}
      ></canvas>
    </div>
  );
}
