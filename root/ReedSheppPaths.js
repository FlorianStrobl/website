// Florian Strobl and Vladimir, April 2022
// Implementation of Reed and Shepps Curves/Paths
var ReedSheepPaths;
(function (ReedSheepPaths) {
    // conventions:
    // #endregion
    // #region car data
    // the turning radius r for the given car
    var turningRadius = 10; // some arbitrary number for now
    // TODO, not sure about that haha
    // if start car = (0, 0, 0) and end car = (x, 0, PI)
    // then the RSR path has the length = turningRadius * PI + (|A-B|)
    // start values of the car
    var startCar = {
        pos: { x: 0, y: 0 },
        heading: degToRad(0) // 0 is right, 90 is north
    };
    // end/final values of the car
    var goalCar = {
        pos: { x: 1, y: 1 },
        heading: degToRad(45)
    };
    // #endregion
    // #region helper functions
    function radToDeg(val) {
        return ((val * 180) / Math.PI) % 360;
    }
    ReedSheepPaths.radToDeg = radToDeg;
    function degToRad(val) {
        return ((val * Math.PI) / 180) % (2 * Math.PI);
    }
    ReedSheepPaths.degToRad = degToRad;
    function correctRad(val) {
        if (val < 0)
            return Math.abs((Math.PI * 2 + val) % (Math.PI * 2));
        else
            return Math.abs(val % (Math.PI * 2));
    }
    // #endregion
    // #region get turning circles middle points from car values
    // get the left/right middle point of the current car
    // (if the car steers to the left, it turns around this point with the distance r)
    function getLeftCircle(car, r) {
        if (r === void 0) { r = turningRadius; }
        return {
            x: car.pos.x + r * Math.cos(car.heading + Math.PI / 2),
            y: car.pos.y + r * Math.sin(car.heading + Math.PI / 2)
        };
    }
    function getRightCircle(car, r) {
        if (r === void 0) { r = turningRadius; }
        return {
            x: car.pos.x - r * Math.cos(car.heading + Math.PI / 2),
            y: car.pos.y - r * Math.sin(car.heading + Math.PI / 2)
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
        if (car1 === void 0) { car1 = startCar; }
        if (car2 === void 0) { car2 = goalCar; }
        if (r === void 0) { r = turningRadius; }
        // #region circles
        // the right cirlces of start car and end car
        var A = getRightCircle(car1, r);
        var B = getRightCircle(car2, r);
        // #endregion
        // #region get linear distances
        // distance between point A and B
        var AB = Math.sqrt(Math.pow((A.y - B.y), 2) + Math.pow((A.x - B.x), 2));
        var CD = AB; // distance CD is the same as the one from AB
        // #endregion
        // #region get simple (outer) angles
        // the angle the car has to the circle if you trace around the circumference
        var startCarToAAngle = correctRad(Math.atan2(car1.pos.y - A.y, car1.pos.x - A.x));
        var endCarToBAngle = correctRad(Math.atan2(car2.pos.y - B.y, car2.pos.x - B.x));
        // the angle around the circle to C or D
        var cOrDAngle = correctRad(Math.atan2(B.y - A.y, B.x - A.x) + Math.PI / 2);
        // its mirror (NOT C/D Prime' for RSL)
        var cOrDAngle2 = correctRad(Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2);
        // #endregion
        // #region get inner angles
        // difference of the two angles, or 360deg - itself
        var innerAngleStartC = startCarToAAngle >= cOrDAngle
            ? startCarToAAngle - cOrDAngle
            : Math.PI * 2 - (cOrDAngle - startCarToAAngle);
        var innerAngleStartCPrime = Math.PI * 2 - innerAngleStartC;
        // same for the other side
        var innerAngleDEnd = endCarToBAngle <= cOrDAngle
            ? cOrDAngle - endCarToBAngle
            : Math.PI * 2 - (endCarToBAngle - cOrDAngle);
        var innerAngleDPrimeEnd = Math.PI * 2 - innerAngleDEnd;
        // #endregion
        // #region arc lengths
        // arcLength = turningRadius * innerAngle
        // startCar to C
        var lengthArc1 = r * correctRad(innerAngleStartC);
        // D to endCar
        var lengthArc2 = r * correctRad(innerAngleDEnd);
        // same but the other way around (forward gets to backwards and vice versa)
        var lengthArcPrime1 = r * correctRad(innerAngleStartCPrime);
        var lengthArcPrime2 = r * correctRad(innerAngleDPrimeEnd);
        // #endregion
        // #region C and D
        // get the position of C
        var C = {
            x: A.x + Math.cos(cOrDAngle) * r,
            y: A.y + Math.sin(cOrDAngle) * r
        };
        var D = {
            x: B.x + Math.cos(cOrDAngle) * r,
            y: B.y + Math.sin(cOrDAngle) * r
        };
        // #endregion
        return {
            startCarToAAngle: startCarToAAngle,
            endCarToBAngle: endCarToBAngle,
            cOrDAngle: cOrDAngle,
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
            cOrDAngle2: cOrDAngle2,
            A: A,
            B: B,
            C: C,
            D: D
        };
        //return lengthArc1 + CD + lengthArc2;
    }
    ReedSheepPaths.getRSR = getRSR;
    // #endregion
})(ReedSheepPaths || (ReedSheepPaths = {}));
