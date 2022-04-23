namespace HybritAStar {
  type pos = { x: number; y: number };
  type rad = number;
  type car = { pos: pos; heading: rad };

  const exploringResolution: number = 1;
  const possibleSteps: string[] = ['R', 'r', 'L', 'l', 'S', 's'];

  const nodes: Node[] = [];

  class Node {
    private prevNode: Node | null;
    private gCost: number;
    private hCost: number;

    private pos: pos;
    private heading: rad;

    private open: boolean;

    constructor(
      prevNode: Node | null,
      gCost: number,
      hCost: number,
      pos: pos,
      heading: rad
    ) {
      this.prevNode = prevNode;
      this.gCost = gCost;
      this.hCost = hCost;
      this.pos = pos;
      this.heading = heading;
    }

    public getFCost(): number {
      return this.gCost + this.hCost;
    }

    public isOpen(): boolean {
      return this.open;
    }

    public setOpen(isOpen: boolean): void {
      this.open = isOpen;
    }
  }

  function main(startCar: car, endCar: car, turningRadius: number): void {
    // get theoretical best paths
    const rsPath = ReedSheepPaths.getRSR(startCar, endCar, turningRadius);

    nodes.push(
      new Node(
        null,
        0,
        calcHCost(startCar, endCar),
        startCar.pos,
        startCar.heading
      )
    );
    while (true) {
      
    }
  }

  function calcHCost(startCar: car, endCar: car): number {
    return -1;
  }
}
