import * as fs from 'fs'
import bunyan from 'bunyan'
import multiply from 'lodash.multiply'
import noop from 'lodash.noop'
import countBy from 'lodash.countby'
import split from 'lodash.split'
import partialRight from 'lodash.partialright'
import maxBy from 'lodash.maxby'
import minBy from 'lodash.minby'
import difference from 'lodash.difference'
import cloneDeep from 'lodash.clonedeep'
import zip from 'lodash.zip'
import times from 'lodash.times'
import { lcm } from 'mathjs'

const NUM_DAYS = 24;

const logger = bunyan.createLogger({
    name: 'advent',
    level: process.env.DEBUG ? 'debug': 'info'
});

const readDataFromFile = (filename, transform = noop, readByLine = true, writeToFile = false) => {
    if (process.env.TEST) {
        filename = 'test.txt';
    }
    let dataStream = fs.readFileSync(`data/${filename}`)
        .toString();

    let transformed;
    if (readByLine) {
        transformed = dataStream.split("\n").map(line => transform(line));
    } else {
        transformed = transform(dataStream);
    }

    if (writeToFile) {
        fs.writeFileSync('transformed.json', JSON.stringify(transformed))
    }

    return transformed;
}

const day1 = () => {
    const TARGET = 2020;
    
    const findTargetOperands = (data, target) => {
        let operands = [];
        data.every((num, i) => {
            const tempData = data.filter((_, idx) => idx != i);
            const search = target - num;
            if (tempData.includes(search)) {
                operands = [num, search]
                return false;
            }
            return true;
        });
        return operands;
    }

    const data = readDataFromFile('day1.txt', parseInt);
    let answer = {
        partA: multiply(...findTargetOperands(data, TARGET))
    };
    data.every((num, i) => {
        const target = TARGET - num;
        const tempData = data.filter((_, idx) => idx != i);
        const result = findTargetOperands(tempData, target);
        if (result.length) {
            answer.partB = num * multiply(...result);
            return false;
        }
        return true;
    });
    return answer;
}

const day2 = () => {
    const transform = (line) => {
        let pwTuple = line.replace(':', '').split(' ');
        pwTuple[0] = pwTuple[0].split('-').map(range => parseInt(range))
        return pwTuple;
    };
    const data = readDataFromFile('day2.txt', transform);

    let validPasswordsA = 0;
    let validPasswordsB = 0;
    data.forEach(([range, char, password]) => {
        const chars = password.split('');
        const counts = countBy(chars);
        if (counts[char] >= range[0] && counts[char] <= range[1]) {
            validPasswordsA++;
        }
        
        if (range.reduce((valid, pos) => (!valid && chars[pos - 1] === char) 
                || (valid && chars[pos - 1] !== char), false)) {
            validPasswordsB++;
        }
    });

    return {
        partA: validPasswordsA,
        partB: validPasswordsB
    };
}

const day3 = () => {
    const TREE = '#';
    const data = readDataFromFile('day3.txt', partialRight(split, ''));
    const slopes = [
        { x: 1, y: 1},
        { x: 3, y: 1},
        { x: 5, y: 1},
        { x: 7, y: 1},
        { x: 1, y: 2}
    ]

    const isTreeAtPosition = ({ x, y }) => {
        const row = data[y];
        let realX = x;
        if (row.length <= x) {
            realX = x % row.length;
        }
        return row[realX] === TREE;
    }

    const countTreesForSlope = (slope) => {
        const pos = { x: 0, y: 0 };
        let trees = 0;
        data.forEach(row => {
            pos.x += slope.x;
            pos.y += slope.y;
            if (pos.y < data.length && isTreeAtPosition(pos)) {
                trees++;
            }
        });
        return trees;
    }

    const treeCounts = slopes.reduce((counts, slope) => {
        counts[`${slope.x}-${slope.y}`] = countTreesForSlope(slope);
        return counts;
    }, {});

    return {
        partA: treeCounts['3-1'],
        partB: Object.values(treeCounts).reduce((total, count) => total * count, 1)
    }
}

const day4 = () => {
    const transform = data => data.split('\n\n')
        .map(line => line
            .replace(/\n/g, ' ')
            .split(' ')
            .reduce((pp, prop) => {
                let [key, val] = prop.split(':');
                pp[key] = val;
                return pp;
            }, {})
        )
    const data = readDataFromFile('day4.txt', transform, false);
    const required = [
        { key: 'byr', regex: /^[0-9]{4}$/, range: [1920, 2002] },
        { key: 'iyr', regex: /^[0-9]{4}$/, range: [2010, 2020] },
        { key: 'eyr', regex: /^[0-9]{4}$/, range: [2020, 2030] },
        { key: 'hgt', regex: /^[0-9]+(in|cm)$/, validator: (value) => {
            const val = parseInt(value.substring(0, value.length - 2));
            const unit = value.substring(value.length - 2, value.length);
            let valid = false;
            if (unit === 'cm') {
                valid = val >= 150 && val <= 193;
            } else if (unit === 'in') {
                valid = val >= 59 && val <= 76;
            }
            return valid;
        } },
        { key: 'hcl', regex: /^\#[0-9a-f]{6}$/ },
        { key: 'ecl', regex: /^(amb|blu|brn|gry|grn|hzl|oth)$/ },
        { key: 'pid', regex: /^[0-9]{9}$/ },
    ];

    const filtered = data.filter(pp => required.every(({ key, regex, range, validator }) => {
        let valid = pp.hasOwnProperty(key) && regex.test(pp[key]);
        if (!valid) return valid;
        if (range) {
            valid = valid && parseInt(pp[key]) >= range[0] && parseInt(pp[key]) <= range[1];
        }
        if (validator) {
            valid = valid && validator(pp[key]);
        }
        return valid;
    }));

    return {
        partA: data.filter(pp => required.every(({ key }) => pp.hasOwnProperty(key))).length,
        partB: filtered.length
    };
}

const day5 = () => {
    const NUM_ROWS = 128;
    const NUM_COLS = 8;
    const getValueFromDirectives = (directives, startingMax, lowerSymbol) => {
        let min = 0, max = startingMax - 1;
        directives.forEach(d => {
            const curr = max - min + 1;
            if (d === lowerSymbol) {
                max = max - curr / 2;
            } else {
                min = min + curr / 2;
            }
        });
        return min;
    }
    const getRowNumber = (line) => {
        const directives = line.slice(0, 7);
        return getValueFromDirectives(directives, NUM_ROWS, 'F');
    }
    const getColumnNumber = (line) => {
        const directives = line.slice(7);
        return getValueFromDirectives(directives, NUM_COLS, 'L');
    }
    const data = readDataFromFile('day5.txt', partialRight(split, ''));
    const possibleIds = Array(NUM_ROWS * NUM_COLS).fill().map((_, i) => i);
    const seats = data.map(line => {
        const row = getRowNumber(line);
        const column = getColumnNumber(line);
        return row * 8 + column;
    });
    const notFound = difference(possibleIds, seats);
    const mySeat = notFound.find(id => seats.includes(id - 1) && seats.includes(id + 1));
    return {
        partA: maxBy(seats),
        partB: mySeat
    }
}

const day6 = () => {
    const transform = data => data.split('\n\n').map(group => group.split('\n').map(person => person.split('')));
    const data = readDataFromFile('day6.txt', transform, false);
    const transformed = data.map(group => {
        const anyValues = new Set();
        group.flat().map(answer => anyValues.add(answer));
        const allValues = new Set(anyValues);
        anyValues.forEach(val => {
            if (!group.every(person => person.includes(val))) {
                allValues.delete(val);
            }
        });
        return { anyValues, allValues };
    });
    return {
        partA: transformed.reduce((total, { anyValues }) => total + anyValues.size, 0),
        partB: transformed.reduce((total, { allValues }) => total + allValues.size, 0)
    }
}

const day7 = () => {
    const MY_BAG = 'shiny gold'
    const transform = line => {
        const [color, inner] = line.replace('.', '').split(' bags contain ');
        let contains = [];
        if (inner != 'no other bags') {
            contains = inner.split(',')
                .map(bag => bag.replace(/bag(s)?/, '').trim())
                .map(bag => { 
                    const [count, ...remaining] = bag.split(' ');
                    return { count: parseInt(count), color: remaining.join(' ') }
                });
        }
        return { color, contains }
    };
    const data = readDataFromFile('day7.txt', transform, true, true);
    const getBagWithChildren = (bag) => {
        const found = data.find(b => b.color === bag.color);
        return {
            color: bag.color,
            count: bag.count || 1,
            contains: found.contains.length ? found.contains.map(inner => getBagWithChildren(inner)) : null
        }
    };
    const getColorSet = (set, bag) => {
        if (!bag.contains) {
            return;
        }
        bag.contains.forEach(inner => {
            set.add(inner.color);
            getColorSet(set, inner);
        });
    }
    const withNested = data.map(bag => {
        const bagWithChildren = getBagWithChildren(bag);
        const colorSet = new Set();
        getColorSet(colorSet, bagWithChildren);
        return { color: bag.color, contains: colorSet }
    });
    const getTotalBags = (bag) => {
        if (bag.contains) {
            return bag.count + bag.count * bag.contains.reduce((total, inner) => {
                return total + getTotalBags(inner);
            }, 0);
        }
        return parseInt(bag.count);
    }
    const goldBag = data.find(b => b.color === MY_BAG);
    const goldChildren = goldBag.contains.map(inner => getBagWithChildren(inner));

    return {
        partA: withNested.filter(bag => bag.contains.has(MY_BAG)).length,
        partB: goldChildren.reduce((total, inner) => total += getTotalBags(inner), 0)
    }
}

const day8 = () => {
    const transform = line => {
        const [cmd, val] = line.split(' ');
        return { cmd, val: parseInt(val) };
    };
    const data = readDataFromFile('day8.txt', transform, true, true);

    const testProgram = (program) => {
        let accumulator = 0,
            currentLine = 0,
            run = true,
            isLoop = false;
        while (run) {
            const { cmd, val, hasRun } = program[currentLine];
            if (hasRun) {
                run = false;
                isLoop = true;
                continue;
            }
            program[currentLine].hasRun = true;
            if (cmd === 'acc') {
                accumulator += val;
            }
            currentLine += (cmd === 'jmp' ? val : 1);
            if (currentLine >= program.length) {
                logger.debug('reached end of execution')
                run = false;
            }
        }
        return { accumulator, isLoop }
    }

    const repairProgram = (program) => {
        let goodAcc = false;
        let currentLine = 0;
        while (!goodAcc) {
            const { cmd } = program[currentLine];
            if (cmd !== 'acc') {
                const newProgram = cloneDeep(program);
                newProgram[currentLine].cmd = cmd === 'nop' ? 'jmp' : 'nop';

                const { accumulator, isLoop } = testProgram(newProgram);
                if (!isLoop) {
                    goodAcc = accumulator;
                    continue;
                }
            }
            if (++currentLine >= program.length) {
                throw new Error('wtf, no solution found', currentLine);
            }
        }
        return goodAcc;
    }

    return {
        partA: testProgram(cloneDeep(data)).accumulator,
        partB: repairProgram(cloneDeep(data))
    }
}

const day9 = () => {
    const PREAMBLE_LENGTH = 25;
    const data = readDataFromFile('day9.txt', parseInt, true, true);
    const filtered = data.slice(PREAMBLE_LENGTH);

    let target;
    filtered.every((value, index) => {
        const subset = data.slice(index, index + PREAMBLE_LENGTH);
        const crossproducts = subset.reduce((cps, v1) => cps.concat(subset.flatMap(v2 => v1 + v2)), []);
        if (!crossproducts.includes(value)) {
            target = value;
            return false;
        }
        return true;
    });

    let validOperands;
    data.every((value, index) => {
        let total = value,
            currentIndex = index,
            operands = [value]
        while (total < target) {
            let nextVal = data[++currentIndex];
            total += nextVal;
            operands.push(nextVal)
            if (total === target) {
                validOperands = operands;
            }
        }
        return !validOperands;
    })
    return {
        partA: target,
        partB: Math.max(...validOperands) + Math.min(...validOperands)
    }
}

const day10 = () => {
    let data = readDataFromFile('day10.txt', parseInt, true, true);
    data.sort((a, b) => a - b);
    const maxVal = Math.max(...data);
    data = [0, ...data, maxVal + 3];

    let diffs = { 1: 0, 2: 0, 3: 0 };
    let counts = { 0: 1 };
    zip(data.slice(1), data).map(([a, b]) => {
        diffs[a - b]++;
        counts[a] = (counts[a - 3] || 0) + (counts[a - 2] || 0) + (counts[a - 1] || 0)
    });

    return {
        partA: diffs[1] * diffs[3],
        partB: counts[maxVal]
    }
}

const day11 = () => {
    const data = readDataFromFile('day11.txt', partialRight(split, ''));
    const numRows = data.length;
    const numCols = data[0].length;
    const deltas = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    const OCC = '#';
    const FREE = 'L';
    const FLOOR = '.';

    const checkLineOfSight = (data, x, y) => {
        const checks = deltas.map(([dx, dy]) => {
            let hasOcc = false, run = true;
            let currX = x + dx, currY = y + dy;

            while (run && currX >= 0 && currX < numCols && currY >= 0 && currY < numRows) {
                if (data[currY][currX] !== FLOOR) {
                    run = false;
                    hasOcc = data[currY][currX] === OCC;
                }
                currX += dx;
                currY += dy;
            }
            return !hasOcc;
        });

        return checks.filter(s => s).length;
    };

    const checkAdjacent = (data, x, y) => {
        return deltas.map(([dx, dy]) => {
            if (y + dy < 0 || y + dy >= numRows || x + dx < 0 || x + dx >= numCols) {
                return true;
            }
            return data[y + dy][x + dx] !== OCC;
        }).filter(s => s).length;
    };

    const debugChart = (chart, debug) => {
        debug && logger.debug(chart.map(r => r.join('')).join('\n'))
    }

    const runSeating = (threshold, checkFn, debug = false) => {
        let working = cloneDeep(data),
        numChanges;
        while (numChanges != 0) {
            numChanges = 0;
            debugChart(working, debug)
            working = working.map((row, r) => {
                return row.map((seat, c) => {
                    const numFree = checkFn(working, c, r);
                    if (seat === OCC && numFree <= 8 - threshold) {
                        numChanges++;
                        return FREE;
                    } else if (seat === FREE && numFree === 8) {
                        numChanges++;
                        return OCC;
                    } else {
                        return seat;
                    }
                });
            });
        }
        debugChart(working, debug)
        return working.flat().filter(seat => seat === OCC).length;
    }

    return {
        partA: runSeating(4, checkAdjacent),
        partB: runSeating(5, checkLineOfSight),
    }
}

const day12 = () => {
    const transform = (line) => {
        const [cmd, ...val] = line.split('');
        return { cmd, val: parseInt(val.join('')) }
    }
    const data = readDataFromFile('day12.txt', transform);
    const BEARINGS = {
        0: 'N',
        90: 'E',
        180: 'S',
        270: 'W'
    };
    const RADS = 360;

    const resolveMultiplier = (cmd, bearing) => {
        if (cmd === 'F') {
            cmd = BEARINGS[bearing];
        }
        const sign = cmd === 'S' || cmd === 'W' ? -1 : 1;
        if (cmd === 'N' || cmd === 'S' ) {
            return [ 0, sign ];
        } else {
            return [ sign, 0 ]
        }
    }

    const method1 = () => {
        let bearing = 90,
            deltaX = 0,
            deltaY = 0;

        data.forEach(({ cmd, val }) => {
            if (cmd === 'L' || cmd === 'R') {
                const sign = cmd === 'L' ? -1 : 1;
                bearing = (bearing + (val * sign));
                if (bearing >= RADS) {
                    bearing = bearing % RADS;
                }
                if (bearing < 0) {
                    bearing = bearing + RADS;
                }
            } else {
                const [ multX, multY ] = resolveMultiplier(cmd, bearing);
                deltaX += multX * val;
                deltaY += multY * val;
            }
        });

        return { deltaX, deltaY };
    }

    const method2 = () => {
        let waypoint = { x: 10, y: 1 },
            deltaX = 0,
            deltaY = 0;

        const resolveTurn = (cmd, val) => {
            let working = cloneDeep(waypoint);
            for (let i = 0; i < val / 90; i++) {
                if (cmd === 'L') {
                    working = { x: -working.y, y: working.x };
                } else {
                    working = { x: working.y, y: -working.x };
                }
            }
            waypoint = working;
        }

        data.forEach(({ cmd, val }, i) => {
            if (cmd === 'L' || cmd === 'R') {
                resolveTurn(cmd, val);
            } else if (cmd === 'F') {
                times(val, () => {
                    deltaX += waypoint.x;
                    deltaY += waypoint.y;
                });
            } else {
                const [ multX, multY ] = resolveMultiplier(cmd);
                waypoint.x += multX * val;
                waypoint.y += multY * val;
            }
        });

        return { deltaX, deltaY };
    }

    const method1Coords = method1();
    const method2Coords = method2();

    return {
        partA: Math.abs(method1Coords.deltaX) + Math.abs(method1Coords.deltaY),
        partB: Math.abs(method2Coords.deltaX) + Math.abs(method2Coords.deltaY)
    }
}

const day13 = () => {
    const transform = (data) => {
        const [earliest, buses] = data.split('\n');
        return { earliest, buses: buses.split(',').map((bus) => bus !== 'x' ? parseInt(bus) : bus) }
    }
    const { earliest, buses } = readDataFromFile('day13.txt', transform, false);
    
    const buildTimetable = (buses, max) => {
        return buses.reduce((all, bus, i) => {
            bus !== 'x' && all.push({
                departure: i,
                id: bus,
                timetable: Array(Math.ceil(max / bus) + 1).fill(0).map((_, i) => i * bus)
            });
            return all;
        }, []);
    }

    const timetable = buildTimetable(buses, earliest);
    const closests = timetable.map(({ timetable, id }) => {
        return { bus: id, time: Math.min(timetable.filter(time => time >= earliest)) };
    });
    const { bus, time } = minBy(closests, 'time');

    const [firstBus, ...remaining] = timetable;
    let firstDeparture = 0;
    let currentCheck = firstBus.id;

    remaining.forEach(({ departure, id }) => {
        while ((firstDeparture + departure) % id !== 0) {
            firstDeparture += currentCheck;
        }
      
        currentCheck = lcm(currentCheck, id);
    });

    return {
        partA: (time - earliest) * bus,
        partB: firstDeparture
    }
}

const days = {
    day1, day2, day3, day4, day5, day6, day7, day8, day9, day10, day11, day12, day13
};

const run = () => {
    const runDay = (day) => {
        const fnName = `day${day}`;
        if (days.hasOwnProperty(fnName)) {
            logger.info(`Day ${day} ==========`);
            try {
                const output = days[fnName]();
                output && Object.entries(output).forEach(([key, value]) => {
                    logger.info(`  * ${key}: ${value}`);
                });
            } catch (e) {
                logger.error(e);
            }
        }
    }
    if (process.env.DAY) {
        runDay(process.env.DAY);
    } else {
        for (let day = 1; day <= NUM_DAYS; ++day) {
            runDay(day);
        }
    }
}
run();
