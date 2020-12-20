import * as fs from 'fs'
import bunyan from 'bunyan'
import multiply from 'lodash.multiply'
import noop from 'lodash.noop'
import countBy from 'lodash.countby'
import split from 'lodash.split'
import partialRight from 'lodash.partialright'

const NUM_DAYS = 24;

const logger = bunyan.createLogger({ name: 'advent' });

const readDataFromFile = (filename, transform = noop, readByLine = true) => {
    let dataStream = fs.readFileSync(`data/${filename}`)
        .toString();

    if (readByLine) {
        return dataStream.split("\n").map(line => transform(line));
    } else {
        return transform(dataStream);
    }
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
        { key: 'byr', regex: /[0-9]{4}/, range: [1920, 2002] },
        { key: 'iyr', regex: /[0-9]{4}/, range: [2010, 2020] },
        { key: 'eyr', regex: /[0-9]{4}/, range: [2020, 2030] },
        { key: 'hgt', regex: /[0-9]+(in|cm)/, validator: (value) => {
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
        { key: 'hcl', regex: /\#[0-9a-f]{6}/ },
        { key: 'ecl', regex: /(amb|blu|brn|gry|grn|hzl|oth)/ },
        { key: 'pid', regex: /[0-9]{9}/ },
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

const days = {
    day1, day2, day3, day4
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
