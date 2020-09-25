const fs = require("fs");

const mapFileName = "map.osu";

// read in map.osu as a string
var ogMap;
try {
    var ogMapBuffer = fs.readFileSync(mapFileName);
    ogMap = ogMapBuffer.toString();
}
catch(error) {
    console.log("Error: " + mapFileName + " not found!");
    console.log("Please put a copy of your map in the same directory as this script.");
    console.log("Ensure your map's file name is \"" + mapFileName + "\".");
    return;
}

// convert map's objects into array of coordinates [x, y, time, circleBoolean]
var lines = ogMap.split('\r\n');
lines.splice(0, lines.indexOf("[HitObjects]") + 1);

var coordinates = [];

lines.forEach(line => {
    var isCircle = true;
    if (line.indexOf("|") >= 0) {
        isCircle = false;
    }
    const lineSplit = line.split(",")
    const coordinate = [parseInt(lineSplit[0]), parseInt(lineSplit[1]), parseInt(lineSplit[2]), isCircle];
    coordinates.push(coordinate);
});

// add relative distance/time to coordinates [0,1,2,3, distanceToNextObject, timeToNextObject]
// determine all circle-->obj gaps
var gaps = [];

for (let i = 0; i < coordinates.length-2; i++) {
    const firstObject = coordinates[i];
    const secondObject = coordinates[i+1];

    const distanceToNextObject = Math.round(
        Math.sqrt(
            Math.pow((secondObject[0]-firstObject[0]), 2) +
            Math.pow((secondObject[1]-firstObject[1]), 2)
        )
    );

    const timeToNextObject = secondObject[2] - firstObject[2];
    
    coordinates[i].push(distanceToNextObject, timeToNextObject);
    
    if (!gaps.includes(timeToNextObject) && firstObject[3]) {
        gaps.push(timeToNextObject);
    }
}

// determine "1/4" gap time
gaps = gaps.sort((a, b) => a - b);
var oneFourthGap = 0;

// cycle through gaps
for (let i = 0; i < gaps.length && !oneFourthGap; i++) {
    const gap = gaps[i];
    var count = 0;

    coordinates.forEach(obj => {
        if (obj[5] == gap) count++; // count how many times the gap appears
    });

    if (count > 10) { // arbitrary guess that a map has at least 10 1/4 gaps. this could easily false positive depending on the map
        oneFourthGap = gap;
        console.log(`The 1/4 gap is probably ${gap}ms (appears ${count} times)\n---`);
        break;
    } else {
        console.log("Calculation may not work correctly because of unexpectedly small and infrequent active rhythm gap (probably 1/6 or 1/8)");
    }
}


// find all objects with "1/4" gaps and print the 3 with highest spacing
var stupidestJumpIndex = 0; // position in [coordinates]
var stupidestJumpDistance = 0; // highest distanceToNextObject

for (let i = 0; i < coordinates.length - 2; i++) {
    const obj = coordinates[i];

    var inRange = false;
    if ( // if distanceToNextObject is within range of 1/4 gap, it'll be checked
        obj[5] == oneFourthGap || 
        obj[5] == oneFourthGap - 1 || 
        obj[5] == oneFourthGap + 1
    ) {
        inRange = true;
    }

    if (inRange && obj[4] > stupidestJumpDistance) {
        console.log(`Object at ${obj[2]} has a big${stupidestJumpDistance == 0 ? '' : 'ger'} 1/4 jump (${obj[4]})`);
        stupidestJumpDistance = obj[4];
        stupidestJumpIndex = i;
    }
}

console.log(`---\nObject at ${coordinates[stupidestJumpIndex][2]} has the biggest 1/4 jump (${coordinates[stupidestJumpIndex][4]})`);