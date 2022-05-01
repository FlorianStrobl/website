// @ts-nocheck

// #region constants
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const rect = canvas.getBoundingClientRect();
// #endregion

// #region vars
let targets = []; // [pos1, pos2, name, color][]
let resetTargets = []; // for "z" and "y"
let elementIDCounter = 0;
let eraseMode = false; // delete targets instead of creating them

let pos1 = { x: -1, y: -1 };
// #endregion

// #region event listeners
// key modifier: "e" and "z"
document.addEventListener('keydown', (e) => {
  const md = () => (eraseMode ? 'Erase mode' : 'Create mode');
  switch (e.keyCode) {
    case 69: // "e"
      eraseMode = !eraseMode; // go into erase mode
      if (eraseMode) document.getElementById('mode').innerHTML = md();
      else document.getElementById('mode').innerHTML = md();
      break;
    case 90: // "z"
      if (!eraseMode) {
        deleteObstacle(targets[targets.length - 1][2]);
        const val = targets.pop();
        if (val !== undefined) {
          resetTargets.push(val); // delete last target and save it for "y"
        }
        resetCanvas(); // reset canvas and draw all the targets again
        drawTargets();

        visualizeTargets(); // ouput the outer HTML
      }
      break;
    case 89: // "y"
      if (!eraseMode) {
        const val = resetTargets.pop();
        if (val !== undefined) {
          targets.push(val); // delete last target and save it for "y"
          document.getElementById('mode').innerHTML =
            md() + ' - Restored last deleted obstacle';
          setTimeout(() => {
            document.getElementById('mode').innerHTML = md();
          }, 2000);
        }

        resetCanvas(); // reset canvas and draw all the targets again
        drawTargets();

        visualizeTargets(); // ouput the outer HTML
      }
      break;
  }
});

canvas.addEventListener('mousemove', (e) => {
  // set titel to current coords
  document.getElementById('xy').innerHTML =
    ' : ' +
    getAbsCoordinates(e).x.toFixed(1) +
    'px , y: ' +
    (canvas.height - getAbsCoordinates(e).y).toFixed(1) +
    ' px';

  if (eraseMode || pos1.x == -1) return;

  resetCanvas();
  drawNewTarget(getAbsCoordinates(e));
  drawTargets();
});

canvas.addEventListener('mousedown', (e) => {
  if (!eraseMode) pos1 = getAbsCoordinates(e);
});

canvas.addEventListener('mouseup', (e) => {
  if (eraseMode) {
    // TODO
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

      const hit = isBetweenX && isBetweenY;

      if (hit) deleteObstacle(target[2]);
    }

    console.log('Deleted ' + (oldLen - targets.length) + ' targets');

    resetCanvas(); // reset the canvas first

    drawTargets(); // draw the old targets

    return; // no further code execution
  }

  resetCanvas(); // reset the canvas first

  drawTargets(); // draw the old targets
  // onCreate()
  drawNewTarget(getAbsCoordinates(e)); // draw the new target

  // pos1, pos2, name, color
  targets.push([
    pos1,
    getAbsCoordinates(e),
    elementIDCounter.toString(),
    [10, 10, 10]
  ]);
  elementIDCounter++;
  visualizeTargets();

  pos1 = { x: -1, y: -1 }; // reset position for next target
});
// #endregion

// #region functions
function drawNewTarget(pos2) {
  resetTargets = []; // reset the previous data
  // start drawing the new rect
  ctx.beginPath();
  ctx.fillStyle = 'rgba(10,10,10,0.5)';
  // the new rect
  ctx.rect(pos1.x, pos1.y, pos2.x - pos1.x, pos2.y - pos1.y);
  ctx.fill(); // render the rect
}

function getAbsCoordinates(event) {
  return {
    x: parseFloat(((event.clientX - rect.left) * (10 / 3)).toFixed(2)),
    y: parseFloat((event.clientY - rect.top) * (10 / 3)).toFixed(2)
  };
}

function drawTargets() {
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.fillStyle = 'rgba(10,10,10,0.5)';
  for (const target of targets) {
    ctx.rect(
      target[0].x,
      target[0].y,
      target[1].x - target[0].x,
      target[1].y - target[0].y
    );
  }
  ctx.fill();
}

function resetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onInputFieldChange() {
  for (let i = 0; i < targets.length; ++i) {
    const newVal = document.getElementById(targets[i][2]).value;

    // update the id and name to the new value
    document.getElementById(targets[i][2]).id = newVal;
    targets[i][2] = newVal.toString();
  }

  //const oldNames = elements.innerHTML.matchAll(/value="(.*?)"/g);
  //for (const c of oldNames) console.log('Names: ', c[1]);
}

function visualizeTargets() {
  const elements = document.getElementById('elements');

  let result = '';
  let x = 0;

  //Pass through all child to get the name

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
      x +
      `  onclick="deleteObstacle(` +
      target[2] +
      `)" style="margin-left: 10px; background-color: red;">delete</button>
          </div>
            <hr / style="margin-bottom: -10px;">
            <p>
              [{x:` +
      target[0].x.toString() +
      `, y: ` +
      target[0].y.toString() +
      `} <br />
              {x:` +
      target[1].x +
      `, y: ` +
      target[1].y +
      `}]
            </p>
          </div>
        </div>`;
  }

  elements.innerHTML = result;
}

function deleteObstacle(name) {
  let activeTimeout = -1;
  for (let i = 0; i < targets.length; ++i) {
    if (targets[i][2] === name) {
      const val = targets.splice(i, 1);
      if (val !== undefined) {
        resetTargets.push(val);
        if (activeTimeout !== -1) {
          clearTimeout(activeTimeout);
          document.getElementById('mode').innerHTML =
            md() + ' - Deleted last created obstacle';
          activeTimeout = setTimeout(() => {
            document.getElementById('mode').innerHTML = md();
          }, 2000);
        }
      }
    }
  }

  resetCanvas();

  visualizeTargets();
  drawTargets();
}
// #endregion
