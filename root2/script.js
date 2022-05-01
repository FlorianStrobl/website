// @ts-nocheck

// #region constants
const canvas = document.querySelector('canvas');
const rect = canvas.getBoundingClientRect();
const ctx = canvas.getContext('2d');
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
        const val = targets.pop();
        if (val !== undefined) {
          resetTargets.push(val); // delete last target and save it for "y"
          document.getElementById('mode').innerHTML =
            md() + ' - Deleted an obstacle';
          setTimeout(() => {
            document.getElementById('mode').innerHTML = md();
          }, 2000);
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
            md() + ' - Restored an obstacle';
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

    targets = targets.filter((target) => {
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

      console.log(x1, x2, y1, y2);

      const isBetweenX = curPos.x >= x1 && curPos.x <= x2;
      const isBetweenY = curPos.y >= y1 && curPos.y <= y2;
      return !(isBetweenX && isBetweenY);
    });

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
  console.log('input field change');
  const elements = document.getElementById('elements');

  const oldNames = elements.innerHTML.matchAll(/value="(.*?)"/g);
  console.clear();
  for (const c of oldNames) console.log('Names: ', c[1]);
}

function visualizeTargets() {
  const elements = document.getElementById('elements');

  // update all the names before
  //const oldNames = elements.innerHTML.matchAll(/value="(.*?)"/g);
  //for (const c of oldNames) console.log('Old names: ', c[1]);

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
            <input value="` +
      target[2] +
      `" onchange="onInputFieldChange()"></input>
            <button id=id-` +
      x +
      `  onclick="deleteElement(` +
      x +
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
    x += 1;
  }

  elements.innerHTML = result;
}

function deleteElement(id) {
  targets = targets.filter((_, i) => i !== id);
  resetCanvas();
  visualizeTargets();
  drawTargets();
}
// #endregion
