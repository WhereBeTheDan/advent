import * as fs from 'fs'
import bunyan from 'bunyan'
import multiply from 'lodash.multiply'
import noop from 'lodash.noop'
import countBy from 'lodash.countby'
import split from 'lodash.split'
import partialRight from 'lodash.partialright'

const NUM_DAYS = 24;

const logger = bunyan.createLogger({ name: 'advent' });

const readDataFromFile = (filename, transform = noop) => {
    return fs.readFileSync(`data/${filename}`)
        .toString()
        .split("\n")
        .map(line => transform(line));
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
        twoSum: multiply(...findTargetOperands(data, TARGET))
    };
    data.every((num, i) => {
        const target = TARGET - num;
        const tempData = data.filter((_, idx) => idx != i);
        const result = findTargetOperands(tempData, target);
        if (result.length) {
            answer.threeSum = num * multiply(...result);
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

const days = {
    day1, day2, day3
};

const run = () => {
    for (let day = 1; day <= NUM_DAYS; ++day) {
        const fnName = `day${day}`;
        if (days.hasOwnProperty(fnName)) {
            logger.info(`Day ${day} ==========`);
            let output = days[fnName]();
            logger.info(`  result: ${JSON.stringify(output)}`);
        }
    }
}
run();
