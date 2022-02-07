import { useState, useMemo } from "react";

import { Bar } from "react-chartjs-2";
import ScrollableChart, { CHART_TYPE } from "./ScrollableChart";
import { withMultiLineLabels, joinMultiLineLabels } from "../utils/chart";

const labels = [
  "台北通喔哈1 店",
  "台北2 店",
  "新北1 店",
  "新北2 店",
  "台北3 店",
  "新北3 店",
  "澎湖1 店",
];
const defaultData = {
  labels: labels,
  datasets: [
    {
      label: "目前區間",
      data: [65, 59, 23, 43, 56, -55, 40],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
    },
    {
      label: "去年同期",
      data: [47, 0, -20, 50, 20, 30, 32],
      backgroundColor: "rgba(255, 159, 64, 0.2)",
    },
    {
      label: "前期",
      data: [12, 0, -20, 50, 20, 30, 50],
      backgroundColor: "rgba(100, 159, 64, 0.2)",
    },
  ],
};
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        font() {
          return {
            size: 12,
          };
        },
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title(context) {
          return context.map(joinMultiLineLabels);
        },
      },
    },
  },
};

let storeIdx = 20;
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

export default function DemoBar() {
  const [data, setData] = useState(defaultData);

  const addNewStore = () => {
    storeIdx += 1;
    setData((old) => {
      return {
        labels: [...old.labels, `中彰投 ${storeIdx} 店`],
        datasets: old.datasets.map((dataset) => ({
          ...dataset,
          data: [...dataset.data, getRandomInt(-100, 100)],
        })),
      };
    });
  };

  const removeLastStore = () => {
    storeIdx -= 1;
    setData((old) => {
      return {
        labels: old.labels.slice(0, old.labels.length - 1),
        datasets: old.datasets.map((dataset) => ({
          ...dataset,
          data: dataset.data.slice(0, dataset.data.length - 1),
        })),
      };
    });
  };

  const dataWithMultiLineLabel = useMemo(() => {
    return {
      ...data,
      labels: withMultiLineLabels({ labels: data.labels, maxCharPerLine: 5 }),
    };
  }, [data]);

  return (
    <div>
      <button onClick={addNewStore} style={{ display: "block" }}>
        Add A Store
      </button>
      <button onClick={removeLastStore} style={{ display: "block" }}>
        Remove Last Store
      </button>

      <ScrollableChart
        chartType={CHART_TYPE.bar}
        options={defaultOptions}
        xTickCount={data.labels.length}
        customizedYAxisBackgroundColor="transparent"
      >
        {(props) => <Bar {...props} data={dataWithMultiLineLabel} />}
      </ScrollableChart>
    </div>
  );
}
