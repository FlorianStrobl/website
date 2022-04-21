// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths

// conventions
// L: left forward, R: right forward, S: straight forward,
// l: left backwards, r: right backwards, s: straight backwards
// 0 radiants/0 degree means in generell east/right, no negative values
// position (0, 0) is the middle of the field

const printf = (...x: any) => console.log(...x);

// #region types
type rad = number; // radiants
type pos = { x: number; y: number }; // a position
type car = { pos: pos; heading: rad }; // a cars values
// #endregion

// #region car data
// the turning radius r for the given car
const turningRadius: number = 1; // some arbitrary number for now

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
function radToDeg(val: rad): number {
  return ((val * 180) / Math.PI) % 360;
}
function degToRad(val: number): rad {
  return ((val * Math.PI) / 180) % (2 * Math.PI);
}
function correctRad(val: rad): rad {
  if (val < 0) return Math.abs((Math.PI * 2 + val) % (Math.PI * 2));
  else return Math.abs(val % (Math.PI * 2));
}
// #endregion

// #region get turning circles middle points from car values
// get the left/right middle point of the current car (if the car steers to the left, it turns around this point with the distance r)
function getLeftCircle(car: car, r: number = turningRadius): pos {
  return {
    x: car.pos.x + r * Math.cos(car.heading + Math.PI / 2),
    y: car.pos.y + r * Math.sin(car.heading + Math.PI / 2)
  };
}
function getRightCircle(car: car, r: number = turningRadius): pos {
  return {
    x: car.pos.x - r * Math.cos(car.heading + Math.PI / 2),
    y: car.pos.y - r * Math.sin(car.heading + Math.PI / 2)
  };
}
// #endregion

// #region CSC
// RSR, (rsr) paths
function getRSR(
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
   */

  // TODO, fix division by 0 and negatives in the sqrts

  // #region get circles
  // the right cirlces of start car and end car
  let A: pos = getRightCircle(startCar);
  let B: pos = getRightCircle(goalCar);
  // #endregion

  // #region get linear distances
  // distance between point A and B (circle1 and circle2)
  const AB: number = Math.sqrt((A.y - B.y) ** 2 + (A.x - B.x) ** 2);
  const CD: number = AB; // distance CD is the same as the one from AB
  // #endregion

  // #region get simple (outer) angles
  // (1, 0)=0deg; (0, 1)=90deg; (-1, 0)=180deg; (0, -1)=270deg
  // the angle the car has to the circle if you trace around the circumference
  const startCarToAAngle: rad = correctRad(
    Math.atan2(startCar.pos.y - A.y, startCar.pos.x - A.x)
  );
  const endCarToBAngle: rad = correctRad(
    Math.atan2(goalCar.pos.y - B.y, goalCar.pos.x - B.x)
  );
  // the angle around the circle to C or D
  const cOrDAngle: rad = correctRad(
    Math.atan2(B.y - A.y, B.x - A.x) + Math.PI / 2
  );
  // #endregion

  // #region get inner angles
  let innerAngleStartC: rad = 0;
  if (startCarToAAngle > cOrDAngle)
    innerAngleStartC = Math.PI * 2 - (startCarToAAngle - cOrDAngle);
  else innerAngleStartC = cOrDAngle - startCarToAAngle;
  // same for the other side
  let innerAngleDEnd: rad = endCarToBAngle - cOrDAngle;
  if (endCarToBAngle > cOrDAngle)
    innerAngleDEnd = Math.PI * 2 - (endCarToBAngle - cOrDAngle);
  else innerAngleDEnd = cOrDAngle - endCarToBAngle;
  // #endregion

  // console.log(
  //   'start car to A angle: ',
  //   radToDeg(startCarToAAngle),
  //   'C angle:',
  //   radToDeg(cOrDAngle),
  //   'inner angle start:',
  //   radToDeg(innerAngleStartC),
  //   'inner angle end:',
  //   radToDeg(innerAngleDEnd)
  // );

  // Length=radius*innerAngle
  const lengthArc1: number = r * correctRad(innerAngleStartC); // some code
  const lengthArc2: number = r * correctRad(innerAngleDEnd);

  // console.log(
  //   'length linear: ',
  //   CD,
  //   'length arc 1: ',
  //   lengthArc1,
  //   'length arc 2: ',
  //   lengthArc2
  // );

  return lengthArc1 + CD + lengthArc2;

  // // orthogonal slope to AB, along this is C and mirrorC/D and mirrorD
  // let invAB: number =
  //   -1 / ((circle2.y - circle1.y) ** 2 / (circle2.x - circle1.x) ** 2);
  // // car start position to the circle1
  // let angleCar1ToCircle1: number =
  //   (car1.pos.y - circle1.y) ** 2 / (car1.pos.x - circle1.x) ** 2;
  // // car end position to the circle2
  // let angleCar2ToCircle2: number =
  //   (car2.pos.y - circle2.y) ** 2 / (car2.pos.x - circle2.x) ** 2;

  // // difference in angle between car and point C/D, (the inner angle)
  // let arcLength1: number = arcLength(
  //   circle1,
  //   circle2,
  //   invAB,
  //   angleCar1ToCircle1,
  //   r
  // ); // car to C forward vs car to C backwards, with in mind 2*r*pi (half)
  // let arcLength2: number = arcLength(
  //   circle1,
  //   circle2,
  //   invAB,
  //   angleCar2ToCircle2,
  //   r
  // ); // D to car forward vs D to car backwards, with in mind 2*r*pi (half)

  // return arcLength1 + CD + arcLength2;

  // function arcLength(
  //   circ1: pos,
  //   circ2: pos,
  //   slope1: number,
  //   slope2: number,
  //   r: number
  // ): number {
  //   // angle for C or D to A or B
  //   let theta1: number = Math.atan(slope1) % (2 * Math.PI);
  //   if (circ1.y < circ2.y) {
  //     theta1 += Math.PI;
  //     theta1 %= Math.PI;
  //   }

  //   // angle for car to A or B
  //   let theta2: number = Math.atan(slope2) % (2 * Math.PI);
  //   // car was to the left of the circle, so function has to add 180 degrees (since arctan(slope) only is for the right side)
  //   if (car1.pos.x < circ1.x) {
  //     theta2 += Math.PI; // add 180 degrees
  //     theta2 %= Math.PI; // wrap around PI
  //   }
  //   return r * Math.abs(theta1 - theta2);
  // }
}

//console.log('total length: ', getRSR(startCar, goalCar));

// LSL, lsl paths
function getLSL(circle1: pos, circle2: pos) {}

// LSR, RSL, lsr, rsl
function getLSRorRLS(circle1: pos, circle2: pos) {}
// #endregion

//printf(getRSR(getLeftCircle(startCar), getLeftCircle(goalCar)));
