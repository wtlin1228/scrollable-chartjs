import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import usePrevious from "../hooks/usePrevious";

const splitWithLength = (s, n) => {
  const result = [];
  for (let i = 0; i < s.length / n; i++) {
    result.push(s.slice(i * n, (i + 1) * n));
  }
  return result;
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
  height = 350,
  xTickMinWidth = 64,
  xTickCount,
  data,
  options,
  children,
}) {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const isScrollModeRef = useRef(false);
  const isCustomizedYAxisDraughtRef = useRef(false);

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

  const getOriginalYAxisWidth = useCallback(
    () => chartRef.current.scales.y.width,
    []
  );

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
    if (isCustomizedYAxisDraughtRef.current === true) {
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
      width * scale,
      height * scale,
      0,
      0,
      width * scale,
      height * scale
    );

    isCustomizedYAxisDraughtRef.current = true;
    clearOriginalYAxis();
  }, [getOriginalYAxisHeight, getOriginalYAxisWidth, clearOriginalYAxis]);

  /* -------------------------------------------------------------------------- */
  /*                                Initialize                                  */
  /* -------------------------------------------------------------------------- */
  const isInitializedRef = useRef(false);
  const plugin = useMemo(() => {
    return {
      id: "leo-1234",
      afterDraw() {
        if (isCustomizedYAxisDraughtRef.current === false) {
          drawCustomizedYAxis();
          return;
        }

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
      isCustomizedYAxisDraughtRef.current = false;
    }
  }, [drawCustomizedYAxis, previousXTickCount, xTickCount]);

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
  const optionsBasedOnState = useMemo(
    () => ({
      ...options,
      responsive: !isScrollMode,
    }),
    [isScrollMode, options]
  );

  const dataWithMultiLineLabel = useMemo(() => {
    return {
      ...data,
      labels: data.labels.map((label) => splitWithLength(label, 5)),
    };
  }, [data]);

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
          minHeight: `${height}px`,
          width: "100%",
          overflowX: "scroll",
        }}
      >
        {children({
          ref: chartRef,
          options: optionsBasedOnState,
          data: dataWithMultiLineLabel,
          plugins: [plugin],
        })}
      </div>
      <canvas
        ref={yAxisRef}
        height={height}
        width="0"
        style={{ position: "absolute", top: 0, left: 0, background: "white" }}
      ></canvas>
    </div>
  );
}
