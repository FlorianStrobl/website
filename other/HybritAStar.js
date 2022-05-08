var HybritAStar;
(function (HybritAStar) {
  const exploringResolution = 1;
  const possibleSteps = ['R', 'r', 'L', 'l', 'S', 's'];
  const nodes = [];
  class Node {
    constructor(prevNode, gCost, hCost, pos, heading) {
      this.prevNode = prevNode;
      this.gCost = gCost;
      this.hCost = hCost;
      this.pos = pos;
      this.heading = heading;
    }
    getFCost() {
      return this.gCost + this.hCost;
    }
    isOpen() {
      return this.open;
    }
    setOpen(isOpen) {
      this.open = isOpen;
    }
  }
  function main(startCar, endCar, turningRadius) {
    // get theoretical best paths
    //const rsPath = ReedSheepPaths.getRSR(startCar, endCar, turningRadius);
    nodes.push(
      new Node(
        null,
        0,
        calcHCost(startCar, endCar),
        startCar.pos,
        startCar.heading
      )
    );
    while (true) {}
  }
  function calcHCost(startCar, endCar) {
    return -1;
  }
})(HybritAStar || (HybritAStar = {}));
