
fetch("dataset.csv")
  .then(r => r.text())
  .then(csv => {
    const rows = csv.trim().split("\n");
    const [x, y] = [[], []];

    for (let i = 1; i < rows.length; i++) {
      const [d, us] = rows[i].split(",");

      x.push(parseFloat(d));
      y.push(parseFloat(us));
    }

    draw(x, y);
});

function polyFit(x, y ,degree){
  const n = x.length;
  const m = degree + 1;

  let A = Array.from({length: m}, () => Array(m).fill(0));
  let B = Array(m).fill(0);

  for (let row = 0; row < m; row++) {
    for (let col = 0; col < m; col++){
        let s = 0;
        for (let i = 0; i < n; i++) s += Math.pow(x[i], row + col);
        A[row][col] = s;
    }

    let s = 0;
    for (let i = 0; i < n; i++) s += y[i] * Math.pow(x[i], row);
    
    B[row] = s;
  }

  return gaussian(A, B);
}

function gaussian(A, b){
  const n = b.length;
  for (let i = 0; i < n; i++){
    let max = i;
    for (let j = i + 1; j < n; j++)
      if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;

    [A[i], A[max]] = [A[max], A[i]];
    [b[i], b[max]] = [b[max], b[i]];

    for(let j=i+1;j<n;j++){
      const f = A[j][i] / A[i][i];
      for (let k = i; k < n; k++) A[j][k] -= f * A[i][k];
      b[j] -= f * b[i];
    }
  }

  const x = Array(n);
  for (let i = n - 1; i >= 0; i--){
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];

    x[i] = s / A[i][i];
  }

  return x;
}

function evalPoly(c, x){
  let y=0;
  for (let i = 0; i < c.length; i++) y += c[i] * Math.pow(x, i);
  return y;
}

function draw(x, y){
  const deg1 = polyFit(x, y, 1);
  const deg2 = polyFit(x, y, 2);
  const deg3 = polyFit(x, y, 3);

  console.log("Linear:", deg1);
  console.log("Quadratic:", deg2);
  console.log("Cubic:", deg3);

  const xs = [];

  const y1 = [];
  const y2 = [];
  const y3 = [];

  const min = Math.min(...x);
  const max = Math.max(...x);

  for (let i = min; i <= max; i += 0.02) {
    xs.push(i);

    y1.push(evalPoly(deg1, i));
    y2.push(evalPoly(deg2, i));
    y3.push(evalPoly(deg3, i));
  }

  Plotly.newPlot("plot", [
    {
      x: x,
      y: y,
      mode: "markers",
      name: "Data",
      marker: {size: 8}
    }, {
      x: xs,
      y: y1,
      mode: "lines",
      name: "Linear"
    }, {
      x: xs,
      y: y2,
      mode: "lines",
      name: "Quadratic"
    }, {
      x: xs,
      y: y3,
      mode: "lines",
      name: "Cubic"
    }
  ], {
    title: "US Ring Size Regression",
    xaxis: { title: "Diameter (mm)" },
    yaxis: { title: "US  Ring  Size" }
  });
}

/**
 * Approximate formula obtained from cubic regression calculated from the given dataset.csv
 */
const diameterToUS = D => Math.round(( // us
  + 0.001241881 * D ** 3
  - 0.070527223 * D ** 2
  + 2.54855059 * D
  - 22.4160466
) * 4) / 4;

function drawRing(r) {
    const canvas = document.getElementById("ring");
        
    const dpr = 1 // window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    
    ctx.scale(dpr, dpr);

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Center
    const cx = w / 2;
    const cy = h / 2 + 30;

    // Scale (pixels per mm)
    const ring_scale = 10;
    const radius = r / 10;
    
    const innerR = radius * ring_scale;
    const outerR = innerR + 5;

    // ========= Ring =========

    // Outer
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = "#d6d6d6";
    ctx.fill();

    // Inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();

    // Outline
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#555";
    ctx.stroke();

    const diamondY = cy - outerR - 18;

    ctx.beginPath();
    ctx.moveTo(cx, diamondY - 12);
    ctx.lineTo(cx + 12, diamondY);
    ctx.lineTo(cx, diamondY + 12);
    ctx.lineTo(cx - 12, diamondY);
    ctx.closePath();

    ctx.fillStyle = "#b4e5ff";
    ctx.fill();

    ctx.strokeStyle = "#60abe0";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - outerR);
    ctx.lineTo(cx + 6, cy - outerR);
    ctx.lineTo(cx + 3, diamondY + 10);
    ctx.lineTo(cx - 3, diamondY + 10);
    ctx.closePath();

    ctx.fillStyle = "#999";
    ctx.fill();

    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(cx - innerR, cy);
    ctx.lineTo(cx + innerR, cy);
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center point
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
}

const resize_habdler = () => {
  document.documentElement.style.setProperty('--width', `${window.innerWidth}px`);
  document.documentElement.style.setProperty('--height', `${window.innerHeight}px`);
}

document.body.onresize = ev => resize_habdler();
resize_habdler();

const input = document.getElementById("circumference");
input.onkeyup = e => {
  const circumference = parseFloat(input.value);

  if (isNaN(circumference) || circumference <= 0) return;

  // C=2*π*R -> D=2*R=C/π
  var diameter = circumference / Math.PI;

  if (diameter < 12) diameter = 12;
  else if (diameter > 25) diameter = 25;

  const size = diameterToUS(diameter);

  const result = document.getElementById("result");
  result.style.setProperty('display', 'flex');

  console.log(size);
  drawRing(diameter);

  document.querySelector("#result > span").innerHTML = `Your Finger Size: <b>${size}</b>`;
}