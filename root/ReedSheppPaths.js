// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths
var ReedSheepPaths;
(function (ReedSheepPaths) {
    // conventions:
    // L: left-forward, R: right-forward, S: straight-forward,
    // l: left-backwards, r: right-backwards, s: straight-backwards
    // 0 radiants/0 degree means in generell east/right, no negative values (0 to 360)
    // position (0, 0) is the middle of the field like coordinate system in mathematics
    // if we look from (0, 0): (1, 0)=0deg; (0, 1)=90deg; (-1, 0)=180deg; (0, -1)=270deg
    // #region types and constants
    var twoPi = Math.PI * 2;
    var halfPi = Math.PI / 2;
    var CSC;
    (function (CSC) {
        CSC[CSC["RSR"] = 0] = "RSR";
        CSC[CSC["rSR"] = 1] = "rSR";
        CSC[CSC["RSr"] = 2] = "RSr";
        CSC[CSC["rSr"] = 3] = "rSr";
        CSC[CSC["RsR"] = 4] = "RsR";
        CSC[CSC["rsR"] = 5] = "rsR";
        CSC[CSC["Rsr"] = 6] = "Rsr";
        CSC[CSC["rsr"] = 7] = "rsr";
        CSC[CSC["LSL"] = 8] = "LSL";
        CSC[CSC["LSl"] = 9] = "LSl";
        CSC[CSC["lSL"] = 10] = "lSL";
        CSC[CSC["lSl"] = 11] = "lSl";
        CSC[CSC["LsL"] = 12] = "LsL";
        CSC[CSC["Lsl"] = 13] = "Lsl";
        CSC[CSC["lsL"] = 14] = "lsL";
        CSC[CSC["lsl"] = 15] = "lsl";
    })(CSC || (CSC = {}));
    // #endregion
    // #region car data
    // the turning radius r for the given car
    var turningRadius = 10; // some arbitrary number for now
    // TODO, not sure about that haha
    // if start car = (0, 0, 0) and end car = (x, 0, PI)
    // then the RSR path has the length = turningRadius * PI + (|A-B|)
    // start values of the car
    ReedSheepPaths.startCar = {
        pos: { x: 0, y: 0 },
        heading: degToRad(0) // 0 is right, 90 is north
    };
    // end/final values of the car
    ReedSheepPaths.goalCar = {
        pos: { x: 10, y: 0 },
        heading: degToRad(45)
    };
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
    function getLeftCircle(car, r) {
        if (r === void 0) { r = turningRadius; }
        return {
            x: car.pos.x + r * Math.cos(car.heading + halfPi),
            y: car.pos.y + r * Math.sin(car.heading + halfPi)
        };
    }
    function getRightCircle(car, r) {
        if (r === void 0) { r = turningRadius; }
        return {
            x: car.pos.x - r * Math.cos(car.heading + halfPi),
            y: car.pos.y - r * Math.sin(car.heading + halfPi)
        };
    }
    ReedSheepPaths.getRightCircle = getRightCircle;
    // #endregion
    // #region CSC
    // RSR, (rsr) paths
    function getRSR(car1, car2, r) {
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
        if (car1 === void 0) { car1 = ReedSheepPaths.startCar; }
        if (car2 === void 0) { car2 = ReedSheepPaths.goalCar; }
        if (r === void 0) { r = turningRadius; }
        // #region circles and distances
        // the right cirlces of start car and end car
        var A = getRightCircle(car1, r);
        var B = getRightCircle(car2, r);
        // distance between point A and B
        var AB = Math.sqrt(Math.pow((A.y - B.y), 2) + Math.pow((A.x - B.x), 2));
        var CD = AB; // distance CD is the same as the one from AB
        // #endregion
        // #region get simple (outer) angles
        // the angle the car has to the circle if you trace around the circumference
        var startCarToAAngle = correctRad(Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x));
        var endCarToBAngle = correctRad(Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x));
        var tmpAngle = Math.atan2(B.y - A.y, B.x - A.x);
        // the angle around the circle to C or D
        var cdAngle = correctRad(tmpAngle + halfPi);
        // it's mirror (its simply on the other side) (NOT C/D Prime/' for RSL nor (360deg - cdAngle))
        var cdMirrorAngle = correctRad(tmpAngle - halfPi);
        // #endregion
        // #region C and D
        // get the position of C
        var C = {
            x: A.x + Math.cos(cdAngle) * r,
            y: A.y + Math.sin(cdAngle) * r
        };
        var D = {
            x: B.x + Math.cos(cdAngle) * r,
            y: B.y + Math.sin(cdAngle) * r
        };
        var CMirror = {
            x: A.x + Math.cos(cdMirrorAngle) * r,
            y: A.y + Math.sin(cdMirrorAngle) * r
        };
        var DMirror = {
            x: B.x + Math.cos(cdMirrorAngle) * r,
            y: B.y + Math.sin(cdMirrorAngle) * r
        };
        // #endregion
        // #region get inner angles
        // difference of the two angles, (or 360deg - itself for the primes)
        var innerAngleStartC = startCarToAAngle >= cdAngle
            ? startCarToAAngle - cdAngle
            : twoPi - (cdAngle - startCarToAAngle);
        // same for the other side
        var innerAngleDEnd = endCarToBAngle <= cdAngle
            ? cdAngle - endCarToBAngle
            : twoPi - (endCarToBAngle - cdAngle);
        // prime: the other way around (reversing the C part)
        var innerAngleStartCPrime = twoPi - innerAngleStartC;
        var innerAngleDPrimeEnd = twoPi - innerAngleDEnd;
        var innerAngleStartCMirror = startCarToAAngle >= cdMirrorAngle
            ? startCarToAAngle - cdMirrorAngle
            : twoPi - (cdMirrorAngle - startCarToAAngle);
        // same for the other side
        var innerAngleDMirrorEnd = endCarToBAngle <= cdMirrorAngle
            ? cdMirrorAngle - endCarToBAngle
            : twoPi - (endCarToBAngle - cdMirrorAngle);
        // prime: the other way around (when reversing)
        var innerAngleStartCMirrorPrime = twoPi - innerAngleStartCMirror;
        var innerAngleDMirrorPrimeEnd = twoPi - innerAngleDMirrorEnd;
        // #endregion
        // #region arc lengths
        // arcLength = turningRadius * innerAngle
        // startCar to C
        var lengthArc1 = r * correctRad(innerAngleStartC);
        // D to endCar
        var lengthArc2 = r * correctRad(innerAngleDEnd);
        // same but the other way around (reversing)
        var lengthArcPrime1 = r * correctRad(innerAngleStartCPrime);
        var lengthArcPrime2 = r * correctRad(innerAngleDPrimeEnd);
        // startCar to C mirror
        var lengthArc1Mirror = r * correctRad(innerAngleStartCMirror);
        // D mirror to endCar
        var lengthArc2Mirror = r * correctRad(innerAngleDMirrorEnd);
        // reversing upper paths
        var lengthArcPrime1Mirror = r * correctRad(innerAngleStartCMirrorPrime);
        var lengthArcPrime2Mirror = r * correctRad(innerAngleDMirrorPrimeEnd);
        // #endregion
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
            D: D,
            CMirror: CMirror,
            DMirror: DMirror
        };
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
        ];
    }
    ReedSheepPaths.getRSR = getRSR;
    function getLSL(car1, car2, r) {
        if (car1 === void 0) { car1 = ReedSheepPaths.startCar; }
        if (car2 === void 0) { car2 = ReedSheepPaths.goalCar; }
        if (r === void 0) { r = turningRadius; }
        // #region circles and distances
        // the right cirlces of start car and end car
        var A = getLeftCircle(car1, r);
        var B = getLeftCircle(car2, r);
        // distance between point A and B
        var AB = Math.sqrt(Math.pow((A.y - B.y), 2) + Math.pow((A.x - B.x), 2));
        var CD = AB; // distance CD is the same as the one from AB
        // #endregion
        // #region get simple (outer) angles
        // the angle the car has to the circle if you trace around the circumference
        var startCarToAAngle = correctRad(Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x));
        var endCarToBAngle = correctRad(Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x));
        var tmpAngle = Math.atan2(B.y - A.y, B.x - A.x);
        // the angle around the circle to C or D
        var cdAngle = correctRad(tmpAngle - halfPi);
        // it's mirror (its simply on the other side) (NOT C/D Prime/' for RSL nor (360deg - cdAngle))
        var cdMirrorAngle = correctRad(tmpAngle + halfPi);
        // #endregion
        // #region C and D
        // get the position of C
        var C = {
            x: A.x + Math.cos(cdAngle) * r,
            y: A.y + Math.sin(cdAngle) * r
        };
        var D = {
            x: B.x + Math.cos(cdAngle) * r,
            y: B.y + Math.sin(cdAngle) * r
        };
        var CMirror = {
            x: A.x + Math.cos(cdMirrorAngle) * r,
            y: A.y + Math.sin(cdMirrorAngle) * r
        };
        var DMirror = {
            x: B.x + Math.cos(cdMirrorAngle) * r,
            y: B.y + Math.sin(cdMirrorAngle) * r
        };
        // #endregion
        // #region get inner angles
        // difference of the two angles, (or 360deg - itself for the primes)
        var innerAngleStartC = startCarToAAngle >= cdAngle
            ? twoPi - (startCarToAAngle - cdAngle)
            : cdAngle - startCarToAAngle;
        // same for the other side
        var innerAngleDEnd = endCarToBAngle <= cdAngle
            ? twoPi - (cdAngle - endCarToBAngle)
            : endCarToBAngle - cdAngle;
        // prime: the other way around (reversing the C part)
        var innerAngleStartCPrime = twoPi - innerAngleStartC;
        var innerAngleDPrimeEnd = twoPi - innerAngleDEnd;
        var innerAngleStartCMirror = startCarToAAngle >= cdMirrorAngle
            ? twoPi - (startCarToAAngle - cdMirrorAngle)
            : cdMirrorAngle - startCarToAAngle;
        // same for the other side
        var innerAngleDMirrorEnd = endCarToBAngle <= cdMirrorAngle
            ? twoPi - (cdMirrorAngle - endCarToBAngle)
            : endCarToBAngle - cdMirrorAngle;
        // prime: the other way around (when reversing)
        var innerAngleStartCMirrorPrime = twoPi - innerAngleStartCMirror;
        var innerAngleDMirrorPrimeEnd = twoPi - innerAngleDMirrorEnd;
        // #endregion
        // #region arc lengths
        // arcLength = turningRadius * innerAngle
        // startCar to C
        var lengthArc1 = r * correctRad(innerAngleStartC);
        // D to endCar
        var lengthArc2 = r * correctRad(innerAngleDEnd);
        // same but the other way around (reversing)
        var lengthArcPrime1 = r * correctRad(innerAngleStartCPrime);
        var lengthArcPrime2 = r * correctRad(innerAngleDPrimeEnd);
        // startCar to C mirror
        var lengthArc1Mirror = r * correctRad(innerAngleStartCMirror);
        // D mirror to endCar
        var lengthArc2Mirror = r * correctRad(innerAngleDMirrorEnd);
        // reversing upper paths
        var lengthArcPrime1Mirror = r * correctRad(innerAngleStartCMirrorPrime);
        var lengthArcPrime2Mirror = r * correctRad(innerAngleDMirrorPrimeEnd);
        // #endregion
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
            D: D,
            CMirror: CMirror,
            DMirror: DMirror
        };
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
        ];
    }
    ReedSheepPaths.getLSL = getLSL;
    // #endregion
})(ReedSheepPaths || (ReedSheepPaths = {}));
// console.log(
//   ReedSheepPaths.getRSR(ReedSheepPaths.startCar, ReedSheepPaths.goalCar, 10)
// );
