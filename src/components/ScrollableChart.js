import { useCallback, useMemo, useEffect, useState, useRef } from "react";

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

  /* -------------------------------------------------------------------------- */
  /*                                Initialize                                  */
  /* -------------------------------------------------------------------------- */
  const isInitialized = useRef(false);
  const plugin = useMemo(() => {
    return {
      id: "leo-1234",
      afterRender() {
        if (isInitialized.current === false) {
          isInitialized.current = true;
          goEitherScrollOrScaleMode();
        }
      },
    };
  }, [goEitherScrollOrScaleMode]);

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

  const chartWrapperRef = useRef(null);
  const chartRef = useRef(null);
  return (
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
  );
}
