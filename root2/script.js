// @ts-nocheck

// #region constants
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const rect = canvas.getBoundingClientRect();
// #endregion

// #region vars

let goalMode = false;
let carMode = false; //mode to spawn a car
let eraseMode = false; // delete targets instead of creating them

let carPosition = { x: -1000, y: -1000, degree: 90 };
let targets = []; // [pos1, pos2, name, color][]
let resetTargets = []; // for "z" and "y"
let elementIDCounter = 0;

let lastPos = { x: -1, y: -1 };

const getModeStr = () => (eraseMode ? 'Erase mode' : 'Create mode');
// #endregion

// #region event listeners
// key modifier: "e", "z" and "y"
document.addEventListener('keydown', (e) => {
  switch (e.keyCode) {
    case 69: // "e"
      eraseMode = !eraseMode; // switch erase mode
      // update the titel
      document.getElementById('mode').innerHTML = getModeStr();
      break;
    case 90: // "z"
      if (targets.length > 0) deleteTarget(targets[targets.length - 1][2]); // delete the last target
      updateScreen(); // redraw everything
      break;
    case 89: // "y"
      const val = resetTargets.pop();
      if (val !== undefined) {
        // an element can be restored
        targets.push(val); // readd the target
        document.getElementById('mode').innerHTML =
          getModeStr() + ' - Restored last deleted obstacle';
        setTimeout(() => {
          document.getElementById('mode').innerHTML = getModeStr();
        }, 2000);
      }
      updateScreen();
      break;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (carMode) return;
  // set titel to current coords
  document.getElementById('xy').innerHTML =
    getAbsCoordinates(e).x.toFixed(1) +
    'px , y: ' +
    (canvas.height - getAbsCoordinates(e).y).toFixed(1) +
    ' px';

  if (eraseMode || lastPos.x == -1) return;

  updateScreen();

  // #region draw a new target
  const pos2 = getAbsCoordinates(e);
  // start drawing the new rect
  ctx.beginPath();
  ctx.fillStyle = 'rgba(10,10,10,0.5)';
  // the new rect
  ctx.rect(lastPos.x, lastPos.y, pos2.x - lastPos.x, pos2.y - lastPos.y);
  ctx.fill(); // render the rect
  // #endregion
});

canvas.addEventListener('mousedown', (e) => {
  if (carMode) return;
  // save the click position to create a target with this as one of its corners
  if (!eraseMode) lastPos = getAbsCoordinates(e);
});

canvas.addEventListener('mouseup', (e) => {
  if (carMode) {
    let cord = getAbsCoordinates(e);
    spawnCar(cord.x, cord.y);
    return;
  }
  if (eraseMode) {
    const curPos = getAbsCoordinates(e);

    const oldLen = targets.length;
    for (let i = 0; i < targets.length; ++i) {
      const target = targets[i];

      // #region check if it hits it
      let x1 = -1;
      let x2 = -1; // the bigger one
      if (target[0].x < target[1].x) {
        x1 = target[0].x;
        x2 = target[1].x;
      } else {
        x2 = target[0].x;
        x1 = target[1].x;
      }

      let y1 = -1;
      let y2 = -1; // the bigger one
      if (target[0].y < target[1].y) {
        y1 = target[0].y;
        y2 = target[1].y;
      } else {
        y2 = target[0].y;
        y1 = target[1].y;
      }

      const isBetweenX = curPos.x >= x1 && curPos.x <= x2;
      const isBetweenY = curPos.y >= y1 && curPos.y <= y2;
      // #endregion

      if (isBetweenX && isBetweenY) deleteTarget(target[2]); // delete the target if same position
    }

    console.log('Deleted ' + (oldLen - targets.length) + ' targets');

    updateScreen();
  } else {
    resetTargets = []; // reset the previous stored deleted targets

    // push new [pos1, pos2, name, color]
    targets.push([
      lastPos,
      getAbsCoordinates(e),
      elementIDCounter.toString(),
      [10, 10, 10]
    ]);
    elementIDCounter++;

    updateScreen();

    lastPos = { x: -1, y: -1 }; // reset position for next target
  }
});
// #endregion

// #region functions
function getAbsCoordinates(event) {
  return {
    x: parseFloat(((event.clientX - rect.left) * (10 / 3)).toFixed(2)),
    y: parseFloat(((event.clientY - rect.top) * (10 / 3)).toFixed(2))
  };
}

function drawTargets() {
  for (const target of targets) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(${target[3][0]},${target[3][1]},${target[3][2]},0.5)`;
    ctx.rect(
      target[0].x,
      target[0].y,
      target[1].x - target[0].x,
      target[1].y - target[0].y
    );
    ctx.fill();
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onInputFieldChange() {
  for (let i = 0; i < targets.length; ++i) {
    const newVal = document.getElementById(targets[i][2]).value;

    // update the id and name to the new value
    document.getElementById(targets[i][2]).id = newVal;
    targets[i][2] = newVal.toString();
  }
}

function renderTargetsData() {
  let result = '';

  // create for each target a div with all the values
  for (const target of targets) {
    result +=
      `<div

            style="
              border-style: solid;
              height: 80px;
              margin-left: 20px;
              margin-right: 20px;
              border-color: rgb(0, 0, 0);
              margin-bottom: 10px;
            "
          >
          <div style="display: flex;">
            <input id="` +
      target[2] +
      `" type="text" value="` +
      target[2] +
      `" onchange="onInputFieldChange()"></input>
            <button id=id-` +
      target[2] +
      `  onclick="deleteTarget(` +
      target[2] +
      `)" style="margin-left: 10px; background-color: red;">delete</button>
          </div>
            <hr / style="margin-bottom: -10px;">
            <p>
              Corner 1: { x:` +
      target[0].x.toString() +
      `, y: ` +
      target[0].y.toString() +
      ` } <br />
              Cornder 2: { x:` +
      target[1].x +
      `, y: ` +
      target[1].y +
      ` }
            </p>
          </div>
        </div>`;
  }

  document.getElementById('elements').innerHTML = result;
}

function deleteTarget(name) {
  name = name.toString();

  let activeTimeout = -1;

  // TODO
  for (let i = 0; i < targets.length; ++i) {
    // for each target
    if (targets[i][2] === name) {
      // if it has the correct name

      const val = targets.splice(i, 1)[0]; // delete the element
      if (val !== undefined) {
        resetTargets.push(val); // save the value for restore option

        // dont reset the html with the previous timer
        if (activeTimeout !== -1) clearTimeout(activeTimeout);

        // update the html
        document.getElementById('mode').innerHTML =
          getModeStr() + ' - Deleted an obstacle';

        // reset the html in 2 seconds
        activeTimeout = setTimeout(() => {
          document.getElementById('mode').innerHTML = getModeStr();
        }, 2000);
      }
    }
  }

  updateScreen();
}

function updateScreen() {
  clearCanvas(); // reset the entire screen
  drawTargets(); // draw all the targets
  renderTargetsData(); // update the html
  drawCar2(carPosition.x, carPosition.y, carPosition.degree);
}

function drawCarOLD(x, y, rotation) {
  ctx.beginPath();
  const width = 1000;
  const height = 1000;

  ctx.fillStyle = `rgba(${target[3][0]},${target[3][1]},${target[3][2]},0.5)`;

  rotation *= Math.PI / 180;
  ctx.rotate(rotation);

  const _x =
    Math.floor(
      width * Math.cos(rotation) * 0.5 - height * Math.sin(rotation) * 0.5
    ) + x;
  const _y =
    Math.floor(
      width * Math.sin(rotation) * 0.5 + height * Math.cos(rotation) * 0.5
    ) + y;

  ctx.rect(_x, _y, width, height);
  ctx.stroke();
  ctx.rotate(-rotation);

  ctx.fill();
}

function drawCar2(x, y, rotation) {
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'green';
  ctx.globalAlpha = 0.8;

  ctx.beginPath();

  var rect = { x: x, y: y, width: 175, height: 50 };

  rotation *= Math.PI / 180;

  ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.rotate(rotation);
  ctx.translate(-rect.x - rect.width / 2, -rect.y - rect.height / 2);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.fill();
  ctx.rotate(-rotation);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function deleteCar() {
  let carPosition = { x: -1000, y: -1000, degree: 90 };
}

function spawnCar(x, y) {
  const rotation = parseInt(document.getElementById('rotationInput').value);
  carPosition = { x: x, y: y, degree: rotation };
  drawCar2(x, y, rotation);
  carMode = false;
  updateScreen();
}

let setCarMode = () => (carMode = true);

let setGoalMode = () => (goalMode = true);

// #endregion
