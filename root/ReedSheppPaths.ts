// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths

namespace ReedSheepPaths {
  // conventions:

  // L: left-forward, R: right-forward, S: straight-forward,
  // l: left-backwards, r: right-backwards, s: straight-backwards

  // 0 radiants/0 degree means in generell east/right, no negative values (0 to 360)
  // position (0, 0) is the middle of the field like coordinate system in mathematics

  // #region types
  type pos = { x: number; y: number }; // a position
  type car = { pos: pos; heading: number }; // a cars values
  // #endregion

  // #region car data
  // the turning radius r for the given car
  const turningRadius: number = 10; // some arbitrary number for now

  // TODO, not sure about that haha
  // if start car = (0, 0, 0) and end car = (x, 0, PI)
  // then the RSR path has the length = turningRadius * PI + (|A-B|)

  // start values of the car
  const startCar: car = {
    pos: { x: 0, y: 0 },
    heading: degToRad(0) // 0 is right, 90 is north
  };
  // end/final values of the car
  const goalCar: car = {
    pos: { x: 1, y: 1 },
    heading: degToRad(45)
  };
  // #endregion

  // #region helper functions
  export function radToDeg(val: number): number {
    return ((val * 180) / Math.PI) % 360;
  }
  export function degToRad(val: number): number {
    return ((val * Math.PI) / 180) % (2 * Math.PI);
  }
  function correctRad(val: number): number {
    if (val < 0) return Math.abs((Math.PI * 2 + val) % (Math.PI * 2));
    else return Math.abs(val % (Math.PI * 2));
  }
  // #endregion

  // #region get turning circles middle points from car values
  // get the left/right middle point of the current car
  // (if the car steers to the left, it turns around this point with the distance r)
  function getLeftCircle(car: car, r: number = turningRadius): pos {
    return {
      x: car.pos.x + r * Math.cos(car.heading + Math.PI / 2),
      y: car.pos.y + r * Math.sin(car.heading + Math.PI / 2)
    };
  }
  export function getRightCircle(car: car, r: number = turningRadius): pos {
    return {
      x: car.pos.x - r * Math.cos(car.heading + Math.PI / 2), // rotate the heading by +90deg
      y: car.pos.y - r * Math.sin(car.heading + Math.PI / 2)
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
     * car1 is on the circumference of the circle A with radius r and with the middle point circle1
     * car2 is on the circumference of the circle B with radius r and with the middle point circle2
     *
     * we need to search the points C and D, which are on the circumference of A and B respectively
     * and which are orthogonal to the line of circle1 to circle2
     * because these are the two arcs we need:
     * car1 goes to C (arc1), then from C to D (CD), and then D to car2 (arc2)
     *
     * the distance AB (other term for circle1 to circle2) equals to sqrt((y*y)/(x*x))
     * this distance has the same length as the distance CD
     *
     * now need the arc length of car1 to C (arc1) and car2 to D (arc2)
     * for that we use the formular: arcLength = centralAngle * r
     *
     * to get the centralAngle we take the angle from car1 to A and C to A and get their absolute difference
     * arctan( slope(carX, circleX) ), but we have to watch out something,
     * if the carX is to the left of the circleX,
     * we have to wrap this around 180 degrees
     * we do the same thing for C/D to A/B
     * then we get the absolute difference between these two values to get centralAngle
     *
     * orientation: (1, 0)=0deg; (0, 1)=90deg; (-1, 0)=180deg; (0, -1)=270deg
     */

    // #region circles
    // the right cirlces of start car and end car
    let A: pos = getRightCircle(car1, r);
    let B: pos = getRightCircle(car2, r);
    // #endregion

    // #region get linear distances
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
    // the angle around the circle to C or D
    const cOrDAngle: number = correctRad(
      Math.atan2(B.y - A.y, B.x - A.x) + Math.PI / 2
    );
    // its mirror (NOT C/D Prime' for RSL)
    const cOrDAngle2: number = correctRad(
      Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2
    );
    // #endregion

    // #region get inner angles
    // difference of the two angles, or 360deg - itself
    const innerAngleStartC: number = Math.abs(cOrDAngle - startCarToAAngle);
    const innerAngleStartCPrime: number = Math.PI * 2 - innerAngleStartC;
    // same for the other side
    const innerAngleDEnd: number = Math.abs(cOrDAngle - endCarToBAngle);
    const innerAngleDPrimeEnd = Math.PI * 2 - innerAngleDEnd;
    // #endregion

    // #region arc lengths
    // arcLength = turningRadius * innerAngle
    // startCar to C
    const lengthArc1: number = r * correctRad(innerAngleStartC);
    // D to endCar
    const lengthArc2: number = r * correctRad(innerAngleDEnd);

    // same but the other way around (forward gets to backwards and vice versa)
    const lengthArcPrime1: number = r * correctRad(innerAngleStartCPrime);
    const lengthArcPrime2: number = r * correctRad(innerAngleDPrimeEnd);
    // #endregion

    // #region C and D
    // get the position of C
    const C = {
      x: A.x + Math.cos(cOrDAngle) * r,
      y: A.y + Math.sin(cOrDAngle) * r
    };
    const D = {
      x: B.x + Math.cos(cOrDAngle) * r,
      y: B.y + Math.sin(cOrDAngle) * r
    };
    // #endregion

    // TODO check if it is forwards or backwards
    console.log(
      'path lengths: ',
      C,
      lengthArc1,
      {
        x: car1.pos.x + lengthArc1 * Math.cos(car1.heading),
        y: car1.pos.y + lengthArc1 * Math.sin(car1.heading)
      },
      {
        x: car1.pos.x - lengthArc1 * Math.cos(car1.heading),
        y: car1.pos.y - lengthArc1 * Math.sin(car1.heading)
      },
      Math.round(lengthArc1 + lengthArc2 + CD),
      Math.round(lengthArcPrime1 + lengthArc2 + CD),
      Math.round(lengthArcPrime2 + lengthArc1 + CD),
      Math.round(lengthArcPrime1 + lengthArcPrime2 + CD)
    );

    return {
      startCarToAAngle: startCarToAAngle,
      endCarToBAngle: endCarToBAngle,
      cOrDAngle: cOrDAngle,
      innerAngleStartC: innerAngleStartC,
      innerAngleDEnd: innerAngleDEnd,
      innerAngleStartCPrime: innerAngleStartCPrime,
      innerAngleDPrimeEnd: innerAngleDPrimeEnd,
      lengthArc1: lengthArc1,
      lengthArc2: lengthArc2,
      lengthArcPrime1: lengthArcPrime1,
      lengthArcPrime2: lengthArcPrime2,
      cOrDAngle2: cOrDAngle2,
      lengthTotalDistance: lengthArc1 + CD + lengthArc2,
      A: A,
      B: B,
      C: C,
      D: D
    } as unknown as number;
    //return lengthArc1 + CD + lengthArc2;
  }
  // #endregion
}
