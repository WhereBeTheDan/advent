import * as fs from 'fs'
import bunyan from 'bunyan'
import multiply from 'lodash.multiply'
import noop from 'lodash.noop'
import countBy from 'lodash.countby'
import split from 'lodash.split'
import partialRight from 'lodash.partialright'
import maxBy from 'lodash.maxby'
import difference from 'lodash.difference'
import cloneDeep from 'lodash.clonedeep'

const NUM_DAYS = 24;

const logger = bunyan.createLogger({
    name: 'advent',
    level: process.env.DEBUG ? 'debug': 'info'
});

const readDataFromFile = (filename, transform = noop, readByLine = true, writeToFile = false) => {
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
                logger.debug("reached end of execution")
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

const days = {
    day1, day2, day3, day4, day5, day6, day7, day8
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
