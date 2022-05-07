// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths

namespace ReedSheepPaths {
  let debug: boolean = false;

  // conventions:

  // L: left-forward, R: right-forward, S: straight-forward,
  // l: left-backwards, r: right-backwards, s: straight-backwards

  // 0 radiants/0 degree means in generell east/right, no negative values (0 to 360)
  // position (0, 0) is the middle of the field like coordinate system in mathematics
  // if we look from (0, 0): (1, 0)=0deg; (0, 1)=90deg; (-1, 0)=180deg; (0, -1)=270deg

  // #region types and constants
  const twoPi: number = Math.PI * 2;
  const halfPi: number = Math.PI / 2;

  type pos = { x: number; y: number }; // a position
  export type car = { pos: pos; heading: number }; // a cars values

  export type path = {
    pathType: string;
    pathTypeValue: string;
    arc1: number;
    straight: number;
    arc2: number;
  };

  // #endregion

  // #region car data
  // the turning radius r for the given car
  const turningRadius: number = 10; // some arbitrary number for now

  // TODO, not sure about that haha
  // if start car = (0, 0, 0) and end car = (x, 0, PI)
  // then the RSR path has the length = turningRadius * PI + (|A-B|)

  // start values of the car
  export const _startCar: car = {
    pos: { x: 0, y: 0 },
    heading: degToRad(0) // 0 is right, 90 is north
  };
  // end/final values of the car
  export const _goalCar: car = {
    pos: { x: 653, y: 135 },
    heading: degToRad(246)
  };
  // #endregion

  // #region helper functions
  export function radToDeg(val: number): number {
    return ((val * 180) / Math.PI) % 360;
  }
  export function degToRad(val: number): number {
    return ((val * Math.PI) / 180) % twoPi;
  }
  function correctRad(val: number): number {
    if (val < 0) return Math.abs((twoPi + val) % twoPi);
    else return Math.abs(val % twoPi);
  }
  // #endregion

  // #region get turning circles middle points from car values
  // get the left/right middle point of the current car
  // (if the car steers to the left, it turns around this point with the distance r)
  function getLeftCircle(car: car, r: number = turningRadius): pos {
    return {
      x: car.pos.x + r * Math.cos(car.heading + halfPi),
      y: car.pos.y + r * Math.sin(car.heading + halfPi)
    };
  }
  export function getRightCircle(car: car, r: number = turningRadius): pos {
    return {
      x: car.pos.x - r * Math.cos(car.heading + halfPi), // rotate the heading by +90deg
      y: car.pos.y - r * Math.sin(car.heading + halfPi)
    };
  }
  // #endregion

  // #region CSC
  // RSR, (rsr) paths
  export function getRSR(
    car1: car = _startCar,
    car2: car = _goalCar,
    r: number = turningRadius
  ): path[] {
    /**
     * RSR paths:
     * car1 is on the circumference of the circle A with radius r
     * car2 is on the circumference of the circle B with radius r
     *
     * we need to search the points C and D, which are on the circumference of A and B respectively
     * and which are orthogonal to the line of A to B
     * because these are the two arcs we need:
     * car1 goes to C (arc1), then from C to D (CD), and then D to car2 (arc2)
     *
     * the distance AB is equals to sqrt((deltaY**2)+(deltaX**2))
     * this distance has the same length as the distance CD
     *
     * now need the arc length of car1 to C (arc1) and car2 to D (arc2)
     * for that we use the formular: arcLength = innerAngle * r
     *
     * OLD VERSION:
     * to get the centralAngle we take the angle from car1 to A and C to A and get their absolute difference
     * arctan( slope(carX, circleX) ), but we have to watch out something,
     * if the carX is to the left of the circleX,
     * we have to wrap this around 180 degrees
     * we do the same thing for C/D to A/B
     * then we get the absolute difference between these two values to get centralAngle
     *
     * orientation: (1, 0)=0deg; (0, 1)=90deg; (-1, 0)=180deg; (0, -1)=270deg
     */

    // #region circles and distances
    // the right cirlces of start car and end car
    const A: pos = getRightCircle(car1, r);
    const B: pos = getRightCircle(car2, r);
    // distance between point A and B
    const AB: number = Math.sqrt((A.y - B.y) ** 2 + (A.x - B.x) ** 2);
    const CD: number = AB; // distance CD is the same as the one from AB
    // #endregion

    // #region get simple (outer) angles
    // the angle the car has to the circle if you trace around the circumference
    const startCarToAAngle: number = correctRad(
      Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x)
    );
    const endCarToBAngle: number = correctRad(
      Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x)
    );
    const tmpAngle: number = Math.atan2(B.y - A.y, B.x - A.x);
    // the angle around the circle to C or D
    const cdAngle: number = correctRad(tmpAngle + halfPi);
    // it's mirror (its simply on the other side) (NOT C/D Prime/' for RSL nor (360deg - cdAngle))
    const cdMirrorAngle: number = correctRad(tmpAngle - halfPi);
    // #endregion

    // #region C and D
    // get the position of C
    const C = {
      x: A.x + Math.cos(cdAngle) * r,
      y: A.y + Math.sin(cdAngle) * r
    };
    const D = {
      x: B.x + Math.cos(cdAngle) * r,
      y: B.y + Math.sin(cdAngle) * r
    };
    const CMirror = {
      x: A.x + Math.cos(cdMirrorAngle) * r,
      y: A.y + Math.sin(cdMirrorAngle) * r
    };
    const DMirror = {
      x: B.x + Math.cos(cdMirrorAngle) * r,
      y: B.y + Math.sin(cdMirrorAngle) * r
    };
    // #endregion

    // #region get inner angles
    // difference of the two angles, (or 360deg - itself for the primes)
    const innerAngleStartC: number =
      startCarToAAngle >= cdAngle
        ? startCarToAAngle - cdAngle
        : twoPi - (cdAngle - startCarToAAngle);
    // same for the other side
    const innerAngleDEnd: number =
      endCarToBAngle <= cdAngle
        ? cdAngle - endCarToBAngle
        : twoPi - (endCarToBAngle - cdAngle);
    // prime: the other way around (reversing the C part)
    const innerAngleStartCPrime: number = twoPi - innerAngleStartC;
    const innerAngleDPrimeEnd = twoPi - innerAngleDEnd;

    const innerAngleStartCMirror: number =
      startCarToAAngle >= cdMirrorAngle
        ? startCarToAAngle - cdMirrorAngle
        : twoPi - (cdMirrorAngle - startCarToAAngle);
    // same for the other side
    const innerAngleDMirrorEnd: number =
      endCarToBAngle <= cdMirrorAngle
        ? cdMirrorAngle - endCarToBAngle
        : twoPi - (endCarToBAngle - cdMirrorAngle);
    // prime: the other way around (when reversing)
    const innerAngleStartCMirrorPrime: number = twoPi - innerAngleStartCMirror;
    const innerAngleDMirrorPrimeEnd = twoPi - innerAngleDMirrorEnd;
    // #endregion

    // #region arc lengths
    // arcLength = turningRadius * innerAngle

    // startCar to C
    const lengthArc1: number = r * correctRad(innerAngleStartC);
    // D to endCar
    const lengthArc2: number = r * correctRad(innerAngleDEnd);

    // same but the other way around (reversing)
    const lengthArcPrime1: number = r * correctRad(innerAngleStartCPrime);
    const lengthArcPrime2: number = r * correctRad(innerAngleDPrimeEnd);

    // startCar to C mirror
    const lengthArc1Mirror: number = r * correctRad(innerAngleStartCMirror);
    // D mirror to endCar
    const lengthArc2Mirror: number = r * correctRad(innerAngleDMirrorEnd);

    // reversing upper paths
    const lengthArcPrime1Mirror: number =
      r * correctRad(innerAngleStartCMirrorPrime);
    const lengthArcPrime2Mirror: number =
      r * correctRad(innerAngleDMirrorPrimeEnd);
    // #endregion

    const result: path[] = [
      {
        pathType: 'CSC',
        pathTypeValue: 'RSR',
        arc1: lengthArc1,
        straight: CD,
        arc2: lengthArc2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'RSr',
        arc1: lengthArc1,
        straight: CD,
        arc2: lengthArcPrime2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'rSR',
        arc1: lengthArcPrime1,
        straight: CD,
        arc2: lengthArc2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'rSr',
        arc1: lengthArcPrime1,
        straight: CD,
        arc2: lengthArcPrime2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'RsR',
        arc1: lengthArc1Mirror,
        straight: CD,
        arc2: lengthArc2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'Rsr',
        arc1: lengthArc1Mirror,
        straight: CD,
        arc2: lengthArcPrime2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'rsR',
        arc1: lengthArcPrime1Mirror,
        straight: CD,
        arc2: lengthArc2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'rsr',
        arc1: lengthArcPrime1Mirror,
        straight: CD,
        arc2: lengthArcPrime2Mirror
      }
    ];

    // console.log(result);

    if (debug) {
      return {
        // @ts-ignore
        startCarToAAngle: startCarToAAngle,
        endCarToBAngle: endCarToBAngle,
        cOrDAngle: cdAngle,
        innerAngleStartC: innerAngleStartC,
        innerAngleDEnd: innerAngleDEnd,
        lengthArc1: lengthArc1,
        lengthArc2: lengthArc2,
        lengthCD: CD,
        lengthTotalDistance: lengthArc1 + CD + lengthArc2,
        innerAngleStartCPrime: innerAngleStartCPrime,
        innerAngleDPrimeEnd: innerAngleDPrimeEnd,
        lengthArcPrime1: lengthArcPrime1,
        lengthArcPrime2: lengthArcPrime2,
        cOrDAngle2: cdMirrorAngle,
        A: A,
        B: B,
        C: C,
        D: D,
        CMirror: CMirror,
        DMirror: DMirror
      };
    } else return result;
  }

  export function getLSL(
    car1: car = _startCar,
    car2: car = _goalCar,
    r: number = turningRadius
  ): path[] {
    // #region circles and distances
    // the right cirlces of start car and end car
    const A: pos = getLeftCircle(car1, r);
    const B: pos = getLeftCircle(car2, r);
    // distance between point A and B
    const AB: number = Math.sqrt((A.y - B.y) ** 2 + (A.x - B.x) ** 2);
    const CD: number = AB; // distance CD is the same as the one from AB
    // #endregion

    // #region get simple (outer) angles
    // the angle the car has to the circle if you trace around the circumference
    const startCarToAAngle: number = correctRad(
      Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x)
    );
    const endCarToBAngle: number = correctRad(
      Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x)
    );
    const tmpAngle: number = Math.atan2(B.y - A.y, B.x - A.x);
    // the angle around the circle to C or D
    const cdAngle: number = correctRad(tmpAngle - halfPi);
    // it's mirror (its simply on the other side) (NOT C/D Prime/' for RSL nor (360deg - cdAngle))
    const cdMirrorAngle: number = correctRad(tmpAngle + halfPi);
    // #endregion

    // #region C and D
    // get the position of C
    const C = {
      x: A.x + Math.cos(cdAngle) * r,
      y: A.y + Math.sin(cdAngle) * r
    };
    const D = {
      x: B.x + Math.cos(cdAngle) * r,
      y: B.y + Math.sin(cdAngle) * r
    };
    const CMirror = {
      x: A.x + Math.cos(cdMirrorAngle) * r,
      y: A.y + Math.sin(cdMirrorAngle) * r
    };
    const DMirror = {
      x: B.x + Math.cos(cdMirrorAngle) * r,
      y: B.y + Math.sin(cdMirrorAngle) * r
    };
    // #endregion

    // #region get inner angles
    // difference of the two angles, (or 360deg - itself for the primes)
    const innerAngleStartC: number =
      startCarToAAngle >= cdAngle
        ? twoPi - (startCarToAAngle - cdAngle)
        : cdAngle - startCarToAAngle;
    // same for the other side
    const innerAngleDEnd: number =
      endCarToBAngle <= cdAngle
        ? twoPi - (cdAngle - endCarToBAngle)
        : endCarToBAngle - cdAngle;
    // prime: the other way around (reversing the C part)
    const innerAngleStartCPrime: number = twoPi - innerAngleStartC;
    const innerAngleDPrimeEnd = twoPi - innerAngleDEnd;

    const innerAngleStartCMirror: number =
      startCarToAAngle >= cdMirrorAngle
        ? twoPi - (startCarToAAngle - cdMirrorAngle)
        : cdMirrorAngle - startCarToAAngle;
    // same for the other side
    const innerAngleDMirrorEnd: number =
      endCarToBAngle <= cdMirrorAngle
        ? twoPi - (cdMirrorAngle - endCarToBAngle)
        : endCarToBAngle - cdMirrorAngle;
    // prime: the other way around (when reversing)
    const innerAngleStartCMirrorPrime: number = twoPi - innerAngleStartCMirror;
    const innerAngleDMirrorPrimeEnd = twoPi - innerAngleDMirrorEnd;
    // #endregion

    // #region arc lengths
    // arcLength = turningRadius * innerAngle

    // startCar to C
    const lengthArc1: number = r * correctRad(innerAngleStartC);
    // D to endCar
    const lengthArc2: number = r * correctRad(innerAngleDEnd);

    // same but the other way around (reversing)
    const lengthArcPrime1: number = r * correctRad(innerAngleStartCPrime);
    const lengthArcPrime2: number = r * correctRad(innerAngleDPrimeEnd);

    // startCar to C mirror
    const lengthArc1Mirror: number = r * correctRad(innerAngleStartCMirror);
    // D mirror to endCar
    const lengthArc2Mirror: number = r * correctRad(innerAngleDMirrorEnd);

    // reversing upper paths
    const lengthArcPrime1Mirror: number =
      r * correctRad(innerAngleStartCMirrorPrime);
    const lengthArcPrime2Mirror: number =
      r * correctRad(innerAngleDMirrorPrimeEnd);
    // #endregion

    const result: path[] = [
      {
        pathType: 'CSC',
        pathTypeValue: 'LSL',
        arc1: lengthArc1,
        straight: CD,
        arc2: lengthArc2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'LSl',
        arc1: lengthArc1,
        straight: CD,
        arc2: lengthArcPrime2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'lSL',
        arc1: lengthArcPrime1,
        straight: CD,
        arc2: lengthArc2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'lSl',
        arc1: lengthArcPrime1,
        straight: CD,
        arc2: lengthArcPrime2
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'LsL',
        arc1: lengthArc1Mirror,
        straight: CD,
        arc2: lengthArc2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'Lsl',
        arc1: lengthArc1Mirror,
        straight: CD,
        arc2: lengthArcPrime2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'lsL',
        arc1: lengthArcPrime1Mirror,
        straight: CD,
        arc2: lengthArc2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: 'lsl',
        arc1: lengthArcPrime1Mirror,
        straight: CD,
        arc2: lengthArcPrime2Mirror
      }
    ];

    // console.log(result);

    if (debug) {
      return {
        // @ts-ignore
        startCarToAAngle: startCarToAAngle,
        endCarToBAngle: endCarToBAngle,
        cOrDAngle: cdAngle,
        innerAngleStartC: innerAngleStartC,
        innerAngleDEnd: innerAngleDEnd,
        lengthArc1: lengthArc1,
        lengthArc2: lengthArc2,
        lengthCD: CD,
        lengthTotalDistance: lengthArc1 + CD + lengthArc2,
        innerAngleStartCPrime: innerAngleStartCPrime,
        innerAngleDPrimeEnd: innerAngleDPrimeEnd,
        lengthArcPrime1: lengthArcPrime1,
        lengthArcPrime2: lengthArcPrime2,
        cOrDAngle2: cdMirrorAngle,
        A: A,
        B: B,
        C: C,
        D: D,
        CMirror: CMirror,
        DMirror: DMirror
      };
    } else return result;
  }

  export function getCSCPaths(
    car1: car = _startCar,
    car2: car = _goalCar,
    r: number = turningRadius
  ): path[] {
    const rsrPaths: path[] = getRSR(car1, car2, r);
    const lslPaths: path[] = getLSL(car1, car2, r);
    // sort the paths after their length
    const paths: path[] = [...rsrPaths, ...lslPaths].sort(
      (a, b) => a.arc1 + a.arc2 - (b.arc1 + b.arc2)
    );
    return paths;
  }
  // #endregion
}

namespace Drive {
  const carData = {
    wheelCirc: 5,
    turningRadius: 1
  };

  // instructions for the car
  interface instr {
    direction: number; // -1 to 1 (left to right)
    len: number; // 0 to inf (mm)
  }

  // drive direction
  enum drDirec {
    L = -1,
    S = 0,
    R = 1
  }

  export function getPath(
    startCar: ReedSheepPaths.car,
    endCar: ReedSheepPaths.car,
    turningRadius: number
  ): instr[] {
    // all CSC paths
    const paths: ReedSheepPaths.path[] = ReedSheepPaths.getCSCPaths(
      startCar,
      endCar,
      turningRadius
    );

    // check if path doesnt collide with car and obstacles
    for (const path of paths) {
      const instr: instr[] = pathToInstr(path);
      if (Sim.drivePath(startCar, instr, []) === true) {
        // path can be driven even with the obstacles!
        console.log('path, instr:', path, instr);
        return instr;
      }
    }

    throw Error("Coulnd't find a valid path");
  }

  function pathToInstr(path: ReedSheepPaths.path): instr[] {
    if (path.pathType === 'CSC') {
      let instruction: instr[] = [];
      let type: string = path.pathTypeValue;

      // part 1: C
      if (type.toLowerCase().startsWith('r'))
        instruction.push({
          direction: drDirec.R,
          len: type.startsWith('r') ? -path.arc1 : path.arc1 // forward/reversing
        });
      else
        instruction.push({
          direction: drDirec.L,
          len: type.startsWith('l') ? -path.arc1 : path.arc1 // forward/reversing
        });

      // part 2: S
      instruction.push({
        direction: drDirec.S,
        len: type[1] === 'S' ? path.straight : -path.straight // forward/reversing
      });

      // part 3: C
      if (type.toLowerCase().endsWith('r'))
        instruction.push({
          direction: drDirec.R,
          len: type.endsWith('r') ? -path.arc1 : path.arc1
        });
      else
        instruction.push({
          direction: drDirec.L,
          len: type.endsWith('l') ? -path.arc1 : path.arc1
        });

      return instruction;
    } else return 'error' as any;
  }

  export function drive(instrs: instr[]): void {
    // TODO
    // init motors

    let oldSteerVal: number = instrs[0].direction;
    for (let i = 0; i < instrs.length; ++i) {
      const instr: instr = instrs[i];
      // #region set the front wheels
      // steering from -1 (left) to 1 (right) is +2 steps...
      // first step is different tho
      const steer: number =
        i === 0
          ? instr.direction
          : (oldSteerVal <= instr.direction ? 1 : -1) *
            Math.abs(oldSteerVal - instr.direction);
      oldSteerVal = instr.direction;

      // rotate front wheels whith this val
      // #endregion

      // drive with back wheels
    }
  }

  namespace Sim {
    // returns true if the path is drivable
    export function drivePath(
      startCar: ReedSheepPaths.car,
      instrs: instr[],
      obstacles: []
    ): boolean {
      /*
        X(t+dt) = X(t) + (v cos) dt
        Y(t+dt) = Y(t) + (v sin) dt
        theta(t+dt) = theta(t) + dt (v/r)
      */

      for (const instr of instrs) {
        let newCarValues: ReedSheepPaths.car = startCar;
        const deltaT: number = 0.001; // in s
        const speed: number = 1; // 1mm per s
        const timeNeeded: number = instr.len / speed;

        for (let i = 0; i < timeNeeded; i += deltaT) {
          newCarValues = updateCar(newCarValues, instr.direction);
          // if newCarValue hit an obstacle stop
          // if newCarValues is at the end, stop
        }

        console.log(newCarValues);

        function updateCar(
          car: ReedSheepPaths.car,
          steering: number
        ): ReedSheepPaths.car {
          // set new position and heading
          car.heading += deltaT * (speed / carData.turningRadius);

          car.pos.x += deltaT * Math.cos(car.heading) * speed;
          car.pos.y += deltaT * Math.sin(car.heading) * speed;

          return car;
        }
      }

      return true;
    }
  }
}

console.log(
  Drive.drive(
    Drive.getPath(ReedSheepPaths._startCar, ReedSheepPaths._goalCar, 10)
  )
);
