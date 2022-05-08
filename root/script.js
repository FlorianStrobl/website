// @ts-nocheck evil

let startCar;
let endCar;
let _r;

function setOutput(...strs) {
  for (let i = 0; i < strs.length; ++i)
    document.getElementById('output' + i.toString()).innerHTML = strs[i];
}

function run() {
  // #region html input values
  const startValues = document
    .getElementById('startPos')
    .value.slice(1, -1)
    .split(',')
    .map((e) => Number(e));
  const endValues = document
    .getElementById('endPos')
    .value.slice(1, -1)
    .split(',')
    .map((e) => Number(e));

  startValues[2] = ReedSheepPaths.degToRad(startValues[2]);
  endValues[2] = ReedSheepPaths.degToRad(endValues[2]);

  // get the values from the document
  const turningRadius = Number(document.getElementById('turningRadius').value);
  const _startCar = {
    pos: { x: startValues[0], y: startValues[1] },
    heading: startValues[2]
  };
  const _endCar = {
    pos: { x: endValues[0], y: endValues[1] },
    heading: endValues[2]
  };

  _r = turningRadius;
  startCar = _startCar;
  endCar = _endCar;
  // #endregion

  const vals = ReedSheepPaths.getRSR(_startCar, _endCar, turningRadius, true);
  const vals2 = ReedSheepPaths.getLSL(_startCar, _endCar, turningRadius, true);

  clearScreen();
  updateScreen(vals.A, vals.B, vals.C, vals.D, vals.CMirror, vals.DMirror);
  updateScreen(
    vals2.A,
    vals2.B,
    vals2.C,
    vals2.D,
    vals2.CMirror,
    vals2.DMirror
  );

  const outputStr1 =
    'Right circle from start car middle point: { x: ' +
    vals.A.x.toFixed(2) +
    ', y: ' +
    vals.A.y.toFixed(2) +
    ' }';
  const outputStr2 =
    'Right circle from end car middle point: { x: ' +
    vals.B.x.toFixed(2) +
    ', y: ' +
    vals.B.y.toFixed(2) +
    ' }';

  const outputStr3 = JSON.stringify(
    vals,
    (key, value) => {
      if (
        typeof value === 'number' &&
        !key.startsWith('length') &&
        key.length !== 1 &&
        !key.endsWith('Mirror')
      )
        return ReedSheepPaths.radToDeg(value).toFixed(2) + '°';
      else if (typeof value === 'number') return value.toFixed(2);
      else return value;
    },
    '<br>'
  );

  setOutput(
    outputStr1,
    outputStr2,
    'Angles in deg, lengths in units: ' + outputStr3
  );
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const setPixel = (x, y, color) => {
  ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
  ctx.fillRect(x - 2, canvas.height - y - 2, 4, 4);
};

const drawRect = (x, y, w, h) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = 'rgba(225,225,225,0.5)';
  ctx.fill();
};

const drawCircle = (x, y, r, color) => {
  ctx.beginPath();
  ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`; // TODO
  ctx.arc(x, canvas.height - y, r, 0, Math.PI * 2);
  ctx.stroke();
};

const drawLine = (_x, _y) => {
  ctx.beginPath();
  ctx.moveTo(_x.x, canvas.height - _x.y);
  ctx.lineTo(_y.x, canvas.height - _y.y);
  ctx.stroke();
};

function updateScreen(__A, __B, __C, __D, __CMirror, __DMirror) {
  setPixel(startCar.pos.x, startCar.pos.y, [255, 0, 0]); // start car
  setPixel(endCar.pos.x, endCar.pos.y, [0, 255, 0]); // end car

  setPixel(__A.x, __A.y, [0, 0, 255]); // A
  setPixel(__B.x, __B.y, [255, 0, 255]); // B

  drawCircle(__A.x, __A.y, _r, [255, 0, 0]); // A circle
  drawCircle(__B.x, __B.y, _r, [255, 0, 0]); // B circle

  const C = __C;

  const D = __D;

  const C2 = __CMirror;

  const D2 = __DMirror;

  setPixel(Math.floor(C.x), Math.floor(C.y), [0, 255, 255]); // C

  setPixel(Math.floor(D.x), Math.floor(D.y), [255, 255, 0]); // D

  setPixel(Math.floor(C2.x), Math.floor(C2.y), [0, 255, 255]); // C2

  setPixel(Math.floor(D2.x), Math.floor(D2.y), [255, 255, 0]); // D2

  // A TO B
  drawLine(__A, __B);

  // C TO D
  drawLine(C, D);

  // C2 TO D2
  drawLine(C2, D2);

  // check if they are valid (when equal to 0)
  //const tmp = (_A.x - _B.x) * (_A.x - C.x) + (_A.y - _B.y) * (_A.y - C.y);
  //console.log(tmp.toString(9));
}

function clearScreen() {
  ctx.fillStyle = `rgb(0,0,0)`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
