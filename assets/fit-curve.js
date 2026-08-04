/*
 *  JavaScript implementation of
 *  Algorithm for Automatically Fitting Digitized Curves
 *  by Philip J. Schneider
 *  "Graphics Gems", Academic Press, 1990
 *
 *  The MIT License (MIT)
 *  https://github.com/soswow/fit-curves
 *
 *  Vendored for the McCANN Creative Suite (Glyph-trace) so tracing works offline.
 */
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["module"], factory);
    } else if (typeof exports !== "undefined") {
        factory(module);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod);
        global.fitCurve = mod.exports;
    }
})(this, function (module) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    /**
     * Fit one or more Bezier curves to a set of points.
     *
     * @param {Array<Array<Number>>} points - Array of digitized points, e.g. [[5,5],[5,50],[110,140],[210,160],[320,110]]
     * @param {Number} maxError - Tolerance, squared error between points and fitted curve
     * @returns {Array<Array<Array<Number>>>} Array of Bezier curves, where each element is [first-point, control-point-1, control-point-2, second-point] and points are [x, y]
     */
    function fitCurve(points, maxError, progressCallback) {
        if (!Array.isArray(points)) {
            throw new TypeError("First argument should be an array");
        }
        points.forEach(function (point) {
            if (!Array.isArray(point) || point.some(function (item) {
                return typeof item !== 'number';
            }) || point.length !== points[0].length) {
                throw Error("Each point should be an array of numbers. Each point should have the same amount of numbers.");
            }
        });

        // Remove duplicate points
        points = points.filter(function (point, i) {
            return i === 0 || !point.every(function (val, j) {
                return val === points[i - 1][j];
            });
        });

        if (points.length < 2) {
            return [];
        }

        var len = points.length;
        var leftTangent = createTangent(points[1], points[0]);
        var rightTangent = createTangent(points[len - 2], points[len - 1]);

        return fitCubic(points, leftTangent, rightTangent, maxError, progressCallback);
    }

    /**
     * Fit a Bezier curve to a (sub)set of digitized points.
     * Your code should not call this function directly. Use {@link fitCurve} instead.
     *
     * @param {Array<Array<Number>>} points - Array of digitized points
     * @param {Array<Number>} leftTangent - Unit tangent vector at start point
     * @param {Array<Number>} rightTangent - Unit tangent vector at end point
     * @param {Number} error - Tolerance, squared error between points and fitted curve
     * @returns {Array<Array<Array<Number>>>} Array of Bezier curves
     */
    function fitCubic(points, leftTangent, rightTangent, error, progressCallback) {
        var MaxIterations = 20; //Max times to try iterating (to find an acceptable curve)

        var bezCurve, //Control points of fitted Bezier curve
        u, //Parameter values for point
        uPrime, //Improved parameter values
        maxError, prevErr, //Maximum fitting error
        splitPoint, prevSplit, //Point to split point set at if we need more than one curve
        centerVector, toCenterTangent, fromCenterTangent, //Unit tangent vector(s) at splitPoint
        beziers, //Array of fitted Bezier curves if we need more than one curve
        dist, i;

        //Use heuristic if region only has two points in it
        if (points.length === 2) {
            dist = maths.vectorLen(maths.subtract(points[0], points[1])) / 3.0;
            bezCurve = [points[0], maths.addArrays(points[0], maths.mulItems(leftTangent, dist)), maths.addArrays(points[1], maths.mulItems(rightTangent, dist)), points[1]];
            return [bezCurve];
        }

        //Parameterize points, and attempt to fit curve
        u = chordLengthParameterize(points);

        var _generateAndReport = generateAndReport(points, u, u, leftTangent, rightTangent, progressCallback);

        bezCurve = _generateAndReport[0];
        maxError = _generateAndReport[1];
        splitPoint = _generateAndReport[2];

        if (maxError === 0 || maxError < error) {
            return [bezCurve];
        }
        //If error not too large, try some reparameterization and iteration
        if (maxError < error * error) {

            uPrime = u;
            prevErr = maxError;
            prevSplit = splitPoint;

            for (i = 0; i < MaxIterations; i++) {

                uPrime = reparameterize(bezCurve, points, uPrime);

                var _generateAndReport2 = generateAndReport(points, u, uPrime, leftTangent, rightTangent, progressCallback);

                bezCurve = _generateAndReport2[0];
                maxError = _generateAndReport2[1];
                splitPoint = _generateAndReport2[2];

                if (maxError < error) {
                    return [bezCurve];
                }
                //If the development of the fitted curve grinds to a halt,
                //we abort this attempt (and try a shorter curve):
                else if (splitPoint === prevSplit) {
                        var errChange = maxError / prevErr;
                        if (errChange > .9999 && errChange < 1.0001) {
                            break;
                        }
                    }

                prevErr = maxError;
                prevSplit = splitPoint;
            }
        }

        //Fitting failed -- split at max error point and fit recursively
        beziers = [];

        //To create a smooth transition from one curve segment to the next, we
        //calculate the line between the points directly before and after the
        //center, and use that as the tangent both to and from the center point.
        centerVector = maths.subtract(points[splitPoint - 1], points[splitPoint + 1]);
        //However, this won't work if they're the same point, because the line we
        //want to use as a tangent would be 0. Instead, we calculate the line from
        //that "double-point" to the center point, and use its tangent.
        if (centerVector.every(function (val) {
            return val === 0;
        })) {
            //[x,y] -> [-y,x]: http://stackoverflow.com/a/4780141/1869660
            centerVector = maths.subtract(points[splitPoint - 1], points[splitPoint]);
            var _ref = [-centerVector[1], centerVector[0]];
            centerVector[0] = _ref[0];
            centerVector[1] = _ref[1];
        }
        toCenterTangent = maths.normalize(centerVector);
        //To and from need to point in opposite directions:
        fromCenterTangent = maths.mulItems(toCenterTangent, -1);

        beziers = beziers.concat(fitCubic(points.slice(0, splitPoint + 1), leftTangent, toCenterTangent, error, progressCallback));
        beziers = beziers.concat(fitCubic(points.slice(splitPoint), fromCenterTangent, rightTangent, error, progressCallback));
        return beziers;
    };

    function generateAndReport(points, paramsOrig, paramsPrime, leftTangent, rightTangent, progressCallback) {
        var bezCurve, maxError, splitPoint;

        bezCurve = generateBezier(points, paramsPrime, leftTangent, rightTangent, progressCallback);
        //Find max deviation of points to fitted curve.
        //Here we always use the original parameters (from chordLengthParameterize()),
        //because we need to compare the current curve to the actual source polyline,
        //and not the currently iterated parameters which reparameterize() & generateBezier() use,
        //as those have probably drifted far away and may no longer be in ascending order.

        var _computeMaxError = computeMaxError(points, bezCurve, paramsOrig);

        maxError = _computeMaxError[0];
        splitPoint = _computeMaxError[1];

        if (progressCallback) {
            progressCallback({
                bez: bezCurve,
                points: points,
                params: paramsOrig,
                maxErr: maxError,
                maxPoint: splitPoint
            });
        }

        return [bezCurve, maxError, splitPoint];
    }

    /**
     * Use least-squares method to find Bezier control points for region.
     *
     * @param {Array<Array<Number>>} points - Array of digitized points
     * @param {Array<Number>} parameters - Parameter values for region
     * @param {Array<Number>} leftTangent - Unit tangent vector at start point
     * @param {Array<Number>} rightTangent - Unit tangent vector at end point
     * @returns {Array<Array<Number>>} Approximated Bezier curve
     */
    function generateBezier(points, parameters, leftTangent, rightTangent) {
        var bezCurve,
            //Bezier curve ctl pts
        A,
            a,
            //Precomputed rhs for eqn
        C,
            X,
            //Matrices C & X
        det_C0_C1,
            det_C0_X,
            det_X_C1,
            //Determinants of matrices
        alpha_l,
            alpha_r,
            //Alpha values, left and right

        epsilon,
            segLength,
            i,
            len,
            tmp,
            u,
            ux,
            firstPoint = points[0],
            lastPoint = points[points.length - 1];

        bezCurve = [firstPoint, null, null, lastPoint];

        //Compute the A's
        A = maths.zeros_Xx2x2(parameters.length);
        for (i = 0, len = parameters.length; i < len; i++) {
            u = parameters[i];
            ux = 1 - u;
            a = A[i];

            a[0] = maths.mulItems(leftTangent, 3 * u * (ux * ux));
            a[1] = maths.mulItems(rightTangent, 3 * ux * (u * u));
        }

        //Create the C and X matrices
        C = [[0, 0], [0, 0]];
        X = [0, 0];
        for (i = 0, len = points.length; i < len; i++) {
            u = parameters[i];
            a = A[i];

            C[0][0] += maths.dot(a[0], a[0]);
            C[0][1] += maths.dot(a[0], a[1]);
            C[1][0] += maths.dot(a[0], a[1]);
            C[1][1] += maths.dot(a[1], a[1]);

            tmp = maths.subtract(points[i], bezier.q([firstPoint, firstPoint, lastPoint, lastPoint], u));

            X[0] += maths.dot(a[0], tmp);
            X[1] += maths.dot(a[1], tmp);
        }

        //Compute the determinants of C and X
        det_C0_C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1];
        det_C0_X = C[0][0] * X[1] - C[1][0] * X[0];
        det_X_C1 = X[0] * C[1][1] - X[1] * C[0][1];

        //Finally, derive alpha values
        alpha_l = det_C0_C1 === 0 ? 0 : det_X_C1 / det_C0_C1;
        alpha_r = det_C0_C1 === 0 ? 0 : det_C0_X / det_C0_C1;

        //If alpha negative, use the Wu/Barsky heuristic (see text).
        //If alpha is 0, you get coincident control points that lead to
        //divide by zero in any subsequent NewtonRaphsonRootFind() call.
        segLength = maths.vectorLen(maths.subtract(firstPoint, lastPoint));
        epsilon = 1.0e-6 * segLength;
        if (alpha_l < epsilon || alpha_r < epsilon) {
            //Fall back on standard (probably inaccurate) formula, and subdivide further if needed.
            bezCurve[1] = maths.addArrays(firstPoint, maths.mulItems(leftTangent, segLength / 3.0));
            bezCurve[2] = maths.addArrays(lastPoint, maths.mulItems(rightTangent, segLength / 3.0));
        } else {
            //First and last control points of the Bezier curve are
            //positioned exactly at the first and last data points
            //Control points 1 and 2 are positioned an alpha distance out
            //on the tangent vectors, left and right, respectively
            bezCurve[1] = maths.addArrays(firstPoint, maths.mulItems(leftTangent, alpha_l));
            bezCurve[2] = maths.addArrays(lastPoint, maths.mulItems(rightTangent, alpha_r));
        }

        return bezCurve;
    };

    /**
     * Given set of points and their parameterization, try to find a better parameterization.
     */
    function reparameterize(bezier, points, parameters) {
        return parameters.map(function (p, i) {
            return newtonRaphsonRootFind(bezier, points[i], p);
        });
    };

    /**
     * Use Newton-Raphson iteration to find better root.
     */
    function newtonRaphsonRootFind(bez, point, u) {
        /*
            Newton's root finding algorithm calculates f(x)=0 by reiterating
            x_n+1 = x_n - f(x_n)/f'(x_n)
            We are trying to find curve parameter u for some point p that minimizes
            the distance from that point to the curve. Distance point to curve is d=q(u)-p.
            At minimum distance the point is perpendicular to the curve.
        */

        var d = maths.subtract(bezier.q(bez, u), point),
            qprime = bezier.qprime(bez, u),
            numerator = maths.mulMatrix(d, qprime),
            denominator = maths.sum(maths.squareItems(qprime)) + 2 * maths.mulMatrix(d, bezier.qprimeprime(bez, u));

        if (denominator === 0) {
            return u;
        } else {
            return u - numerator / denominator;
        }
    };

    /**
     * Assign parameter values to digitized points using relative distances between points.
     */
    function chordLengthParameterize(points) {
        var u = [],
            currU,
            prevU,
            prevP;

        points.forEach(function (p, i) {
            currU = i ? prevU + maths.vectorLen(maths.subtract(p, prevP)) : 0;
            u.push(currU);

            prevU = currU;
            prevP = p;
        });
        u = u.map(function (x) {
            return x / prevU;
        });

        return u;
    };

    /**
     * Find the maximum squared distance of digitized points to fitted curve.
     */
    function computeMaxError(points, bez, parameters) {
        var dist, //Current error
        maxDist, //Maximum error
        splitPoint, //Point of maximum error
        v, //Vector from point to curve
        i, count, point, t;

        maxDist = 0;
        splitPoint = Math.floor(points.length / 2);

        var t_distMap = mapTtoRelativeDistances(bez, 10);

        for (i = 0, count = points.length; i < count; i++) {
            point = points[i];
            //Find 't' for a point on the bez curve that's as close to 'point' as possible:
            t = find_t(bez, parameters[i], t_distMap, 10);

            v = maths.subtract(bezier.q(bez, t), point);
            dist = v[0] * v[0] + v[1] * v[1];

            if (dist > maxDist) {
                maxDist = dist;
                splitPoint = i;
            }
        }

        return [maxDist, splitPoint];
    };

    //Sample 't's and map them to relative distances along the curve:
    var mapTtoRelativeDistances = function mapTtoRelativeDistances(bez, B_parts) {
        var B_t_curr;
        var B_t_dist = [0];
        var B_t_prev = bez[0];
        var sumLen = 0;

        for (var i = 1; i <= B_parts; i++) {
            B_t_curr = bezier.q(bez, i / B_parts);

            sumLen += maths.vectorLen(maths.subtract(B_t_curr, B_t_prev));

            B_t_dist.push(sumLen);
            B_t_prev = B_t_curr;
        }

        //Normalize B_length to the same interval as the parameter distances; 0 to 1:
        B_t_dist = B_t_dist.map(function (x) {
            return x / sumLen;
        });
        return B_t_dist;
    };

    function find_t(bez, param, t_distMap, B_parts) {
        if (param < 0) {
            return 0;
        }
        if (param > 1) {
            return 1;
        }

        /*
            'param' is a value between 0 and 1 telling us the relative position
            of a point on the source polyline. B(t) isn't linear by length, so we
            sample the curve, measure the sampled lengths, then interpolate to get
            a good-enough 't' for the requested relative distance.
        */
        var lenMax, lenMin, tMax, tMin, t;

        for (var i = 1; i <= B_parts; i++) {

            if (param <= t_distMap[i]) {
                tMin = (i - 1) / B_parts;
                tMax = i / B_parts;
                lenMin = t_distMap[i - 1];
                lenMax = t_distMap[i];

                t = (param - lenMin) / (lenMax - lenMin) * (tMax - tMin) + tMin;
                break;
            }
        }
        return t;
    }

    /**
     * Creates a vector of length 1 which shows the direction from B to A
     */
    function createTangent(pointA, pointB) {
        return maths.normalize(maths.subtract(pointA, pointB));
    }

    /*
        Simplified versions of what we need from math.js
        Optimized for our input, which is only numbers and 1x2 arrays (i.e. [x, y] coordinates).
    */

    var maths = function () {
        function maths() {
            _classCallCheck(this, maths);
        }

        maths.zeros_Xx2x2 = function zeros_Xx2x2(x) {
            var zs = [];
            while (x--) {
                zs.push([0, 0]);
            }
            return zs;
        };

        maths.mulItems = function mulItems(items, multiplier) {
            return items.map(function (x) {
                return x * multiplier;
            });
        };

        maths.mulMatrix = function mulMatrix(m1, m2) {
            //Simplified to only handle 1-dimensional matrices (i.e. arrays) of equal length:
            return m1.reduce(function (sum, x1, i) {
                return sum + x1 * m2[i];
            }, 0);
        };

        maths.subtract = function subtract(arr1, arr2) {
            return arr1.map(function (x1, i) {
                return x1 - arr2[i];
            });
        };

        maths.addArrays = function addArrays(arr1, arr2) {
            return arr1.map(function (x1, i) {
                return x1 + arr2[i];
            });
        };

        maths.addItems = function addItems(items, addition) {
            return items.map(function (x) {
                return x + addition;
            });
        };

        maths.sum = function sum(items) {
            return items.reduce(function (sum, x) {
                return sum + x;
            });
        };

        maths.dot = function dot(m1, m2) {
            return maths.mulMatrix(m1, m2);
        };

        maths.vectorLen = function vectorLen(v) {
            return Math.hypot.apply(Math, v);
        };

        maths.divItems = function divItems(items, divisor) {
            return items.map(function (x) {
                return x / divisor;
            });
        };

        maths.squareItems = function squareItems(items) {
            return items.map(function (x) {
                return x * x;
            });
        };

        maths.normalize = function normalize(v) {
            return this.divItems(v, this.vectorLen(v));
        };

        return maths;
    }();

    var bezier = function () {
        function bezier() {
            _classCallCheck(this, bezier);
        }

        bezier.q = function q(ctrlPoly, t) {
            var tx = 1.0 - t;
            var pA = maths.mulItems(ctrlPoly[0], tx * tx * tx),
                pB = maths.mulItems(ctrlPoly[1], 3 * tx * tx * t),
                pC = maths.mulItems(ctrlPoly[2], 3 * tx * t * t),
                pD = maths.mulItems(ctrlPoly[3], t * t * t);
            return maths.addArrays(maths.addArrays(pA, pB), maths.addArrays(pC, pD));
        };

        bezier.qprime = function qprime(ctrlPoly, t) {
            var tx = 1.0 - t;
            var pA = maths.mulItems(maths.subtract(ctrlPoly[1], ctrlPoly[0]), 3 * tx * tx),
                pB = maths.mulItems(maths.subtract(ctrlPoly[2], ctrlPoly[1]), 6 * tx * t),
                pC = maths.mulItems(maths.subtract(ctrlPoly[3], ctrlPoly[2]), 3 * t * t);
            return maths.addArrays(maths.addArrays(pA, pB), pC);
        };

        bezier.qprimeprime = function qprimeprime(ctrlPoly, t) {
            return maths.addArrays(maths.mulItems(maths.addArrays(maths.subtract(ctrlPoly[2], maths.mulItems(ctrlPoly[1], 2)), ctrlPoly[0]), 6 * (1.0 - t)), maths.mulItems(maths.addArrays(maths.subtract(ctrlPoly[3], maths.mulItems(ctrlPoly[2], 2)), ctrlPoly[1]), 6 * t));
        };

        return bezier;
    }();

    module.exports = fitCurve;
    module.exports.fitCubic = fitCubic;
    module.exports.createTangent = createTangent;
});
