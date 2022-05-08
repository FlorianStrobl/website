// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths
// #endregion
var ReedSheepPaths;
(function (ReedSheepPaths) {
    // conventions:
    // L: left-forward, R: right-forward, S: straight-forward,
    // l: left-backwards, r: right-backwards, s: straight-backwards
    // 0 radiants/0 degree means in generell east/right, no negative values (0 to 360)
    // position (0, 0) is the middle of the field like coordinate system in mathematics
    // if we look from (0, 0): (1, 0)=0deg; (0, 1)=90deg; (-1, 0)=180deg; (0, -1)=270deg
    // #region types and constants
    const twoPi = Math.PI * 2;
    const halfPi = Math.PI / 2;
    // #endregion
    // #region car data
    // the turning radius r for the given car
    const turningRadius = 10; // some arbitrary number for now
    // #endregion
    // #region helper functions
    function radToDeg(val) {
        return ((val * 180) / Math.PI) % 360;
    }
    ReedSheepPaths.radToDeg = radToDeg;
    function degToRad(val) {
        return ((val * Math.PI) / 180) % twoPi;
    }
    ReedSheepPaths.degToRad = degToRad;
    function correctRad(val) {
        if (val < 0)
            return Math.abs((twoPi + val) % twoPi);
        else
            return Math.abs(val % twoPi);
    }
    // #endregion
    // #region get turning circles middle points from car values
    // get the left/right middle point of the current car
    // (if the car steers to the left, it turns around this point with the distance r)
    function getLeftCircle(car, r = turningRadius) {
        return {
            x: car.pos.x + r * Math.cos(car.heading + halfPi),
            y: car.pos.y + r * Math.sin(car.heading + halfPi)
        };
    }
    function getRightCircle(car, r = turningRadius) {
        return {
            x: car.pos.x - r * Math.cos(car.heading + halfPi),
            y: car.pos.y - r * Math.sin(car.heading + halfPi)
        };
    }
    // #endregion
    // #region CSC
    // RSR, (rsr) paths
    function getRSR(car1 = _startCar, car2 = _goalCar, r = turningRadius, debug = false) {
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
        const A = getRightCircle(car1, r);
        const B = getRightCircle(car2, r);
        // distance between point A and B
        const AB = Math.sqrt((A.y - B.y) ** 2 + (A.x - B.x) ** 2);
        const CD = AB; // distance CD is the same as the one from AB
        // #endregion
        // #region get simple (outer) angles
        // the angle the car has to the circle if you trace around the circumference
        const startCarToAAngle = correctRad(Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x));
        const endCarToBAngle = correctRad(Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x));
        const tmpAngle = Math.atan2(B.y - A.y, B.x - A.x);
        // the angle around the circle to C or D
        const cdAngle = correctRad(tmpAngle + halfPi);
        // it's mirror (its simply on the other side) (NOT C/D Prime/' for RSL nor (360deg - cdAngle))
        const cdMirrorAngle = correctRad(tmpAngle - halfPi);
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
        const innerAngleStartC = startCarToAAngle >= cdAngle
            ? startCarToAAngle - cdAngle
            : twoPi - (cdAngle - startCarToAAngle);
        // same for the other side
        const innerAngleDEnd = endCarToBAngle <= cdAngle
            ? cdAngle - endCarToBAngle
            : twoPi - (endCarToBAngle - cdAngle);
        // prime: the other way around (reversing the C part)
        const innerAngleStartCPrime = twoPi - innerAngleStartC;
        const innerAngleDPrimeEnd = twoPi - innerAngleDEnd;
        const innerAngleStartCMirror = startCarToAAngle >= cdMirrorAngle
            ? startCarToAAngle - cdMirrorAngle
            : twoPi - (cdMirrorAngle - startCarToAAngle);
        // same for the other side
        const innerAngleDMirrorEnd = endCarToBAngle <= cdMirrorAngle
            ? cdMirrorAngle - endCarToBAngle
            : twoPi - (endCarToBAngle - cdMirrorAngle);
        // prime: the other way around (when reversing)
        const innerAngleStartCMirrorPrime = twoPi - innerAngleStartCMirror;
        const innerAngleDMirrorPrimeEnd = twoPi - innerAngleDMirrorEnd;
        // #endregion
        // #region arc lengths
        // arcLength = turningRadius * innerAngle
        // startCar to C
        const lengthArc1 = r * correctRad(innerAngleStartC);
        // D to endCar
        const lengthArc2 = r * correctRad(innerAngleDEnd);
        // same but the other way around (reversing)
        const lengthArcPrime1 = r * correctRad(innerAngleStartCPrime);
        const lengthArcPrime2 = r * correctRad(innerAngleDPrimeEnd);
        // startCar to C mirror
        const lengthArc1Mirror = r * correctRad(innerAngleStartCMirror);
        // D mirror to endCar
        const lengthArc2Mirror = r * correctRad(innerAngleDMirrorEnd);
        // reversing upper paths
        const lengthArcPrime1Mirror = r * correctRad(innerAngleStartCMirrorPrime);
        const lengthArcPrime2Mirror = r * correctRad(innerAngleDMirrorPrimeEnd);
        // #endregion
        const result = [
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
        }
        else
            return result;
    }
    ReedSheepPaths.getRSR = getRSR;
    function getLSL(car1 = _startCar, car2 = _goalCar, r = turningRadius, debug = false) {
        // #region circles and distances
        // the right cirlces of start car and end car
        const A = getLeftCircle(car1, r);
        const B = getLeftCircle(car2, r);
        // distance between point A and B
        const AB = Math.sqrt((A.y - B.y) ** 2 + (A.x - B.x) ** 2);
        const CD = AB; // distance CD is the same as the one from AB
        // #endregion
        // #region get simple (outer) angles
        // the angle the car has to the circle if you trace around the circumference
        const startCarToAAngle = correctRad(Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x));
        const endCarToBAngle = correctRad(Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x));
        const tmpAngle = Math.atan2(B.y - A.y, B.x - A.x);
        // the angle around the circle to C or D
        const cdAngle = correctRad(tmpAngle - halfPi);
        // it's mirror (its simply on the other side) (NOT C/D Prime/' for RSL nor (360deg - cdAngle))
        const cdMirrorAngle = correctRad(tmpAngle + halfPi);
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
        const innerAngleStartC = startCarToAAngle >= cdAngle
            ? twoPi - (startCarToAAngle - cdAngle)
            : cdAngle - startCarToAAngle;
        // same for the other side
        const innerAngleDEnd = endCarToBAngle <= cdAngle
            ? twoPi - (cdAngle - endCarToBAngle)
            : endCarToBAngle - cdAngle;
        // prime: the other way around (reversing the C part)
        const innerAngleStartCPrime = twoPi - innerAngleStartC;
        const innerAngleDPrimeEnd = twoPi - innerAngleDEnd;
        const innerAngleStartCMirror = startCarToAAngle >= cdMirrorAngle
            ? twoPi - (startCarToAAngle - cdMirrorAngle)
            : cdMirrorAngle - startCarToAAngle;
        // same for the other side
        const innerAngleDMirrorEnd = endCarToBAngle <= cdMirrorAngle
            ? twoPi - (cdMirrorAngle - endCarToBAngle)
            : endCarToBAngle - cdMirrorAngle;
        // prime: the other way around (when reversing)
        const innerAngleStartCMirrorPrime = twoPi - innerAngleStartCMirror;
        const innerAngleDMirrorPrimeEnd = twoPi - innerAngleDMirrorEnd;
        // #endregion
        // #region arc lengths
        // arcLength = turningRadius * innerAngle
        // startCar to C
        const lengthArc1 = r * correctRad(innerAngleStartC);
        // D to endCar
        const lengthArc2 = r * correctRad(innerAngleDEnd);
        // same but the other way around (reversing)
        const lengthArcPrime1 = r * correctRad(innerAngleStartCPrime);
        const lengthArcPrime2 = r * correctRad(innerAngleDPrimeEnd);
        // startCar to C mirror
        const lengthArc1Mirror = r * correctRad(innerAngleStartCMirror);
        // D mirror to endCar
        const lengthArc2Mirror = r * correctRad(innerAngleDMirrorEnd);
        // reversing upper paths
        const lengthArcPrime1Mirror = r * correctRad(innerAngleStartCMirrorPrime);
        const lengthArcPrime2Mirror = r * correctRad(innerAngleDMirrorPrimeEnd);
        // #endregion
        const result = [
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
        }
        else
            return result;
    }
    ReedSheepPaths.getLSL = getLSL;
    function getCSCPaths(car1 = _startCar, car2 = _goalCar, r = turningRadius) {
        const rsrPaths = getRSR(car1, car2, r);
        const lslPaths = getLSL(car1, car2, r);
        // sort the paths after their length
        const paths = [...rsrPaths, ...lslPaths].sort((a, b) => a.arc1 + a.arc2 - (b.arc1 + b.arc2));
        return paths;
    }
    ReedSheepPaths.getCSCPaths = getCSCPaths;
    // #endregion
})(ReedSheepPaths || (ReedSheepPaths = {}));
// #region default values for car
// start values of the car
const _startCar = {
    pos: { x: 0, y: 0 },
    heading: ReedSheepPaths.degToRad(0) // 0 is right, 90 is north
};
// end/final values of the car
const _goalCar = {
    pos: { x: 653, y: 135 },
    heading: ReedSheepPaths.degToRad(246)
};
// #endregion
var Drive;
(function (Drive) {
    // constants of the hardware
    const carData = {
        wheelCirc: 5,
        turningRadius: 1,
        pointToUp: 1,
        pointToDown: 0.5,
        pointToSide: 0.5
    };
    // drive direction
    let driveDirec;
    (function (driveDirec) {
        driveDirec[driveDirec["L"] = -1] = "L";
        driveDirec[driveDirec["S"] = 0] = "S";
        driveDirec[driveDirec["R"] = 1] = "R";
    })(driveDirec || (driveDirec = {}));
    function getPath(startCar, endCar, turningRadius) {
        // all CSC paths
        const paths = ReedSheepPaths.getCSCPaths(startCar, endCar, turningRadius);
        console.log(paths[0]);
        // check if path doesnt collide with car and obstacles
        for (const path of paths) {
            const instr = pathToInstr(path); // get the instructions
            if (Sim.drivePath(startCar, instr, []) === true) {
                // path can be driven even with the obstacles!
                //console.log('path, instr:', path, instr);
                return instr;
            }
        }
        throw Error("Coulnd't find a valid path");
    }
    Drive.getPath = getPath;
    function pathToInstr(path) {
        if (path.pathType === 'CSC') {
            let instruction = [];
            let type = path.pathTypeValue;
            // part 1: C
            if (type.toLowerCase().startsWith('r'))
                instruction.push({
                    direction: driveDirec.R,
                    len: type.startsWith('r') ? -path.arc1 : path.arc1 // forward/reversing
                });
            else
                instruction.push({
                    direction: driveDirec.L,
                    len: type.startsWith('l') ? -path.arc1 : path.arc1 // forward/reversing
                });
            // part 2: S
            instruction.push({
                direction: driveDirec.S,
                len: type[1] === 'S' ? path.straight : -path.straight // forward/reversing
            });
            // part 3: C
            if (type.toLowerCase().endsWith('r'))
                instruction.push({
                    direction: driveDirec.R,
                    len: type.endsWith('r') ? -path.arc2 : path.arc2
                });
            else
                instruction.push({
                    direction: driveDirec.L,
                    len: type.endsWith('l') ? -path.arc2 : path.arc2
                });
            return instruction;
        }
        else
            return 'error';
    }
    function drive(instrs) {
        // TODO
        // init motors
        let oldSteerVal = instrs[0].direction;
        for (let i = 0; i < instrs.length; ++i) {
            const instr = instrs[i];
            // #region set the front wheels
            // steering from -1 (left) to 1 (right) is +2 steps...
            // first step is different tho
            const steer = i === 0
                ? instr.direction
                : (oldSteerVal <= instr.direction ? 1 : -1) *
                    Math.abs(oldSteerVal - instr.direction);
            oldSteerVal = instr.direction;
            // rotate front wheels whith this steer*multiplier
            const steerMultiplier = 0; // steer is between -2 and 2...
            // #endregion
            // drive with back wheels
            //console.log(steer * 45, instr.len);
        }
    }
    Drive.drive = drive;
    let Sim;
    (function (Sim) {
        // returns true if the path is drivable
        function drivePath(_car, instrs, obstacles) {
            //console.log('Check if this path is valid: ', _car, instrs, obstacles);
            // TODO
            return true;
            /*
              Vehicle Dynamics:
              X(t+dt) = X(t) + (v * cos orientation) * dt
              Y(t+dt) = Y(t) + (v * sin orientation) * dt
              theta(t+dt) = theta(t) + dt * (v/r)
            */
            for (const instr of instrs) {
                //console.log('simulate driving this instruction: ', instr);
                const deltaT = 0.001; // in s
                const speed = 1; // 1mm per s
                const timeNeeded = instr.len / speed;
                // if newCarValues is at the end, stop
                for (let i = 0; i < timeNeeded; i += deltaT) {
                    _car = updateCar(_car, instrDirToAngle(instr.direction));
                    // if newCarValue hit an obstacle stop
                    if (checkIfHit(_car, obstacles)) {
                        return false; // we hit an obstacle
                    }
                }
                //console.log('new car values after this instruction executed: ', _car);
                function updateCar(car, steering) {
                    // set new position and heading
                    car.heading +=
                        deltaT * (speed / carData.turningRadius) * Math.tan(steering);
                    car.heading %= Math.PI * 2; // wrap around
                    car.pos.x += deltaT * speed * Math.cos(car.heading);
                    car.pos.y += deltaT * speed * Math.sin(car.heading);
                    return car;
                }
                function checkIfHit(car, obstacles) {
                    for (const obs of obstacles) {
                        // right, left, up, down
                        // TODO
                        const carCorners = {
                            lu: [
                                car.pos.x +
                                    Math.cos(car.heading) * carData.pointToSide -
                                    Math.sin(car.heading) * carData.pointToUp,
                                car.pos.y +
                                    Math.sin(car.heading) * carData.pointToSide +
                                    Math.cos(car.heading) * carData.pointToDown
                            ],
                            ld: [-1, -1],
                            ru: [-1, -1],
                            rd: [-1, -1]
                        };
                        // check if one of the cars corners in inside the obstacle
                        if (checkPointHitRect(carCorners.lu, obs) ||
                            checkPointHitRect(carCorners.ru, obs) ||
                            checkPointHitRect(carCorners.ld, obs) ||
                            checkPointHitRect(carCorners.rd, obs)) {
                            return false; // car corner was inside the obstacle
                        }
                        // check if corner to another corner (line) hit an obstacle
                        if (checkLineHitRect(carCorners.lu, carCorners.ru, obs) ||
                            checkLineHitRect(carCorners.rd, carCorners.ld, obs) ||
                            checkLineHitRect(carCorners.lu, carCorners.ld, obs) ||
                            checkLineHitRect(carCorners.ru, carCorners.rd, obs)) {
                            return false; // car hit this obstacle
                        }
                    }
                    // no obstacle returned false
                    return true;
                    function checkPointHitRect(point, // [x, y]
                    obs //[[x1, y1], [x2, y2]]
                    ) {
                        let smallerObsX = obs[0][0] < obs[1][0] ? obs[0][0] : obs[1][0];
                        let biggerObsX = obs[0][0] === smallerObsX ? obs[1][0] : obs[0][0];
                        let smallerObsY = obs[0][1] < obs[1][1] ? obs[0][1] : obs[1][1];
                        let biggerObsY = obs[0][1] === smallerObsX ? obs[1][1] : obs[0][1];
                        const isBetweenX = point[0] >= smallerObsX && point[0] <= biggerObsX;
                        const isBetweenY = point[1] >= smallerObsY && point[1] <= biggerObsY;
                        return isBetweenX && isBetweenY;
                    }
                    function checkLineHitRect(a, b, obs) {
                        // TODO
                        return false;
                    }
                }
                function instrDirToAngle(n) {
                    // TODO
                    return -1;
                }
            }
            return true;
        }
        Sim.drivePath = drivePath;
    })(Sim || (Sim = {}));
})(Drive || (Drive = {}));
console.log(Drive.getPath({ pos: { x: 1000, y: 1000 }, heading: 0 }, { pos: { x: 1200, y: 1200 }, heading: 0 }, 57.2957795131));
