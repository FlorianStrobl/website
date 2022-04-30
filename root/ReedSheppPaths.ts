// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths

namespace ReedSheepPaths {
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
  type car = { pos: pos; heading: number }; // a cars values

  enum CSC {
    RSR,
    rSR,
    RSr,
    rSr,
    RsR,
    rsR,
    Rsr,
    rsr
  }
  // #endregion

  // #region car data
  // the turning radius r for the given car
  const turningRadius: number = 10; // some arbitrary number for now

  // TODO, not sure about that haha
  // if start car = (0, 0, 0) and end car = (x, 0, PI)
  // then the RSR path has the length = turningRadius * PI + (|A-B|)

  // start values of the car
  export const startCar: car = {
    pos: { x: 0, y: 0 },
    heading: degToRad(0) // 0 is right, 90 is north
  };
  // end/final values of the car
  export const goalCar: car = {
    pos: { x: 10, y: 0 },
    heading: degToRad(45)
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
    car1: car = startCar,
    car2: car = goalCar,
    r: number = turningRadius
  ): number {
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

    return [
      {
        pathType: 'CSC',
        pathTypeValue: CSC.RSR,
        arc1: lengthArc1,
        straight: CD,
        arc2: lengthArc2
      },
      {
        pathType: 'CSC',
        pathTypeValue: CSC.RSr,
        arc1: lengthArc1,
        straight: CD,
        arc2: lengthArcPrime2
      },
      {
        pathType: 'CSC',
        pathTypeValue: CSC.rSR,
        arc1: lengthArcPrime1,
        straight: CD,
        arc2: lengthArc2
      },
      {
        pathType: 'CSC',
        pathTypeValue: CSC.rSr,
        arc1: lengthArcPrime1,
        straight: CD,
        arc2: lengthArcPrime2
      },
      {
        pathType: 'CSC',
        pathTypeValue: CSC.RsR,
        arc1: lengthArc1Mirror,
        straight: CD,
        arc2: lengthArc2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: CSC.Rsr,
        arc1: lengthArc1Mirror,
        straight: CD,
        arc2: lengthArcPrime2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: CSC.rsR,
        arc1: lengthArcPrime1Mirror,
        straight: CD,
        arc2: lengthArc2Mirror
      },
      {
        pathType: 'CSC',
        pathTypeValue: CSC.rsr,
        arc1: lengthArcPrime1Mirror,
        straight: CD,
        arc2: lengthArcPrime2Mirror
      }
    ] as unknown as number;

    return {
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
      D: D
    } as unknown as number;
  }

  export function getLSL(): {
    pathType: string;
    pathTypeValue: string;
    arc1: number;
    straight: number;
    arc2: number;
  }[] {
    return [{ x: -1 }] as any;
  }
  // #endregion
}

console.log(
  ReedSheepPaths.getRSR(ReedSheepPaths.startCar, ReedSheepPaths.goalCar, 10)
);
