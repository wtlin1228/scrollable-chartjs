import { useCallback, useMemo, useEffect, useRef } from "react";
import usePrevious from "../hooks/usePrevious";
import useIsScrollMode from "../hooks/useIsScrollMode";

const Y_AXES_LEFT_OVERFLOW_WIDTH = 7;

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
  options,
  customizedYAxisBackgroundColor = "white",
  children,
}) {
  const [isScrollMode, setIsScrollMode, isScrollModeRef] =
    useIsScrollMode(false);
  const shouldDrawCustomizedYAxisRef = useRef(true);

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
    setIsScrollMode(true);
    resizeChartForScrollMode();
  }, [setIsScrollMode, resizeChartForScrollMode]);

  const goScaleMode = useCallback(() => {
    setIsScrollMode(false);
  }, [setIsScrollMode]);

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
    return chartRef.current.scales.y.right;
  }, []);

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
    if (shouldDrawCustomizedYAxisRef.current === false) {
      return;
    }

    const yAxisContext = yAxisRef.current.getContext("2d");
    const scale = window.devicePixelRatio;

    const height = Math.round(getOriginalYAxisHeight());
    const width = Math.round(getOriginalYAxisWidth());

    yAxisContext.scale(scale, scale);
    yAxisRef.current.height = height * scale;
    yAxisRef.current.width = width * scale;
    yAxisRef.current.style.height = height + "px";
    yAxisRef.current.style.width = width + "px";

    yAxisContext.drawImage(
      /* image= */ chartRef.current.canvas,
      /* sx= */ 0,
      /* sy= */ 0,
      /* sWidth= */ (width - Y_AXES_LEFT_OVERFLOW_WIDTH) * scale,
      /* sHeight= */ height * scale,
      /* dx= */ 0,
      /* dy= */ 0,
      /* dWidth= */ (width - Y_AXES_LEFT_OVERFLOW_WIDTH) * scale,
      /* dHeight= */ height * scale
    );

    shouldDrawCustomizedYAxisRef.current = false;
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

        if (shouldDrawCustomizedYAxisRef.current === true) {
          drawCustomizedYAxis();
        }

        if (customizedYAxisBackgroundColor === "transparent") {
          clearOriginalYAxis();
        }
      },
      afterRender() {
        if (isInitializedRef.current === false) {
          isInitializedRef.current = true;
          goEitherScrollOrScaleMode();
        } else {
          drawCustomizedYAxis({ force: true });
        }
      },
    };
  }, [
    isScrollModeRef,
    customizedYAxisBackgroundColor,
    clearOriginalYAxis,
    drawCustomizedYAxis,
    goEitherScrollOrScaleMode,
  ]);

  /* -------------------------------------------------------------------------- */
  /*     Whenever xTickCount changes, we need to redraw customized y axis.      */
  /* -------------------------------------------------------------------------- */
  const previousXTickCount = usePrevious(xTickCount);
  useEffect(() => {
    if (isInitializedRef.current === false) {
      return;
    }

    if (previousXTickCount !== xTickCount) {
      shouldDrawCustomizedYAxisRef.current = true;
    }
  }, [previousXTickCount, xTickCount]);

  /* -------------------------------------------------------------------------- */
  /*                                Resize                                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
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

  useEffect(() => {
    window.chartRef = chartRef;
  }, []);

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
          background: customizedYAxisBackgroundColor,
          borderRight: "1.3px solid #d4d4d4",
          display: isScrollMode ? "block" : "none",
        }}
      ></canvas>
    </div>
  );
}
