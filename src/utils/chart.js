const splitWithLength = (s, n) => {
  const result = [];
  for (let i = 0; i < s.length / n; i++) {
    result.push(s.slice(i * n, (i + 1) * n));
  }
  return result;
};

export const withMultiLineLabels = ({ labels, maxCharPerLine }) => {
  return labels.map((label) => splitWithLength(label, maxCharPerLine));
};

export const joinMultiLineLabels = ({ label }) => label.split(",").join("");
