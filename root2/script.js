// @ts-nocheck

// #region constants
const canvas = document.querySelector('canvas');
const rect = canvas.getBoundingClientRect();
const ctx = canvas.getContext('2d');
// #endregion

// #region vars
let targets = []; // goal
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
          }, 2500);
        }
        resetCanvas(); // reset canvas and draw all the targets again
        drawTargets();

        visualizeTargets(targets); // ouput the outer HTML
      }
      break;
    case 89: // "y"
      if (!eraseMode) {
        const val = resetTargets.pop();
        if (val !== undefined) {
          targets.push(val); // delete last target and save it for "y"
          document.getElementById('mode').innerHTML =
            md() + ' - Restored an obstacle';
        }
        resetCanvas(); // reset canvas and draw all the targets again
        drawTargets();

        visualizeTargets(targets); // ouput the outer HTML
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
    console.log('test');
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
  drawNewTarget(getAbsCoordinates(e)); // draw the new target

  targets.push([pos1, getAbsCoordinates(e), elementIDCounter.toString()]);
  elementIDCounter++;
  visualizeTargets(targets);

  pos1 = { x: -1, y: -1 }; // reset position for next target
});
// #endregion

// #region functions
function drawNewTarget(pos2) {
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

function visualizeTargets(objects) {
  let elements = document.getElementById('elements');

  const elementsChildren = document.getElementById('elements').children;

  for (let i = 0; i < elementsChildren.length; i++) {
    const elementsChildren = document.getElementById('elements').children;
    let child = elementsChildren[i];
    console.log(child.children[0].children[0]);

    //child = children[i];
    //console.log(child.children[0].children[0].value.toString());
    //targets[i][2] = child.children[0].children[0].value.toString();
    //console.log(child.children[0].children[0].value);
  }

  let result = '';
  let x = 0;

  //Pass through all child to get the name

  for (const object of objects) {
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
      object[2] +
      `"></input>
            <button id=id-` +
      x +
      `  onclick="deleteElement(` +
      x +
      `)" style="margin-left: 10px; background-color: red;">delete</button>
          </div>
            <hr / style="margin-bottom: -10px;">
            <p>
              [{x:` +
      object[0].x.toString() +
      `, y: ` +
      object[0].y.toString() +
      `} <br />
              {x:` +
      object[1].x +
      `, y: ` +
      object[1].y +
      `}]
            </p>
          </div>
        </div>`;
    x += 1;
  }

  elements.innerHTML = result;
}

function deleteElement(id) {
  console.log('Delete' + id);
  targets = targets.filter((_, i) => i !== id);
  visualizeTargets(targets);
  drawTargets();
}
// #endregion
