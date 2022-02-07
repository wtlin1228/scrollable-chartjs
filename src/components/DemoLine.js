import { useMemo, useState } from "react";

import { Line } from "react-chartjs-2";
import ScrollableChart, { CHART_TYPE } from "./ScrollableChart";
import { withMultiLineLabels, joinMultiLineLabels } from "../utils/chart";

const labels = [
  "2020-01-01",
  "2020-01-02",
  "2020-01-03",
  "2020-01-04",
  "2020-01-05",
  "2020-01-06",
  "2020-01-07",
];
const defaultData = {
  labels: labels,
  datasets: [
    {
      label: "你選擇的區間",
      data: [65, 59, 80, 81, 56, 55, 40],
      borderColor: "rgb(75, 192, 192)",
    },
    {
      label: "前一年同期",
      data: [81, 56, 55, 40, 65, 59, 80],
      borderColor: "rgb(143, 34, 192)",
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

const getNextDate = (date) => {
  const today = new Date(date);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

export default function DemoLine() {
  const [data, setData] = useState(defaultData);

  const addNewDate = () => {
    setData((old) => {
      const newLabel = getNextDate(old.labels[old.labels.length - 1]);
      return {
        labels: [...old.labels, newLabel],
        datasets: old.datasets.map((dataset) => ({
          ...dataset,
          data: [...dataset.data, getRandomInt(0, 200)],
        })),
      };
    });
  };

  const removeLastDate = () => {
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
      labels: withMultiLineLabels({ labels: data.labels, maxCharPerLine: 10 }),
    };
  }, [data]);

  return (
    <div>
      <button onClick={addNewDate} style={{ display: "block" }}>
        Add A Date
      </button>
      <button onClick={removeLastDate} style={{ display: "block" }}>
        Remove Last Date
      </button>

      <ScrollableChart
        chartType={CHART_TYPE.line}
        options={defaultOptions}
        xTickCount={data.labels.length}
        xTickMinWidth={70}
      >
        {(props) => <Line {...props} data={dataWithMultiLineLabel} />}
      </ScrollableChart>
    </div>
  );
}
