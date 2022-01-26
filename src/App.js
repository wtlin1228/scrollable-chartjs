import { useState } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ScrollableBar from "./ScrollableBar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const labels = [
  "台北 1 店",
  "台北 2 店",
  "新北 1 店",
  "新北 2 店",
  "台北 3 店",
  "新北 3 店",
  "澎湖 1 店",
];
const defaultData = {
  labels: labels,
  datasets: [
    {
      label: "目前區間",
      data: [65, 59, 80, 81, 56, -55, 40],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
    },
    {
      label: "去年同期",
      data: [80, 0, -20, 50, 20, 30, 100],
      backgroundColor: "rgba(255, 159, 64, 0.2)",
    },
    {
      label: "前期",
      data: [80, 0, -20, 50, 20, 30, 100],
      backgroundColor: "rgba(100, 159, 64, 0.2)",
    },
  ],
};
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      display: false,
    },
    title: {
      display: true,
      text: "Chart.js Bar Chart",
    },
  },
};

let storeIdx = 20;
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

function App() {
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

  return (
    <div className="App">
      <button onClick={addNewStore} style={{ display: "block" }}>
        Add A Store
      </button>
      <button onClick={removeLastStore} style={{ display: "block" }}>
        Remove Last Store
      </button>

      <ScrollableBar options={defaultOptions} data={data} />
    </div>
  );
}

export default App;
