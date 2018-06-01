#! node

const Version = require('./lib'),
    path = require('path'),
    fs = require('fs'),
    CLI = require('3h-cli');

const { parse, check, increase } = Version;

/**
 * Pick the value from v1 if v1 isn't undefined, otherwise, return v2.
 * @param {string[] | undefined} v1
 * @param {string} v2
 * @returns {string}
 */
function pick(v1, v2) {
    return v1 && v1.length ? v1[0] : v2;
}

/**
 * Print the error message and exit 1.
 * @param {string} msg
 * @returns {never}
 */
function logErrorAndExit(msg) {
    console.error(msg);
    process.exit(1);
}

/**
 * Create the validation message.
 * @param {string} prefix
 * @param {string} curVer
 * @param {boolean} valid
 * @returns {string}
 */
function createValidationMsg(prefix, curVer, valid) {
    return `${prefix} version("${curVer}") is ${valid ? 'valid' : 'invalid'}.`;
}

/**
 * Stringify the object and write it to the file.
 * @param {string} file
 * @param {string} encoding
 * @param {{ version: string }} object
 * @param {number} tabSize
 */
function writeJson(file, encoding, object, tabSize) {
    fs.writeFileSync(file, JSON.stringify(object, undefined, tabSize), { encoding });
}

/**
 * Log version change.
 * @param {string} from
 * @param {string} to
 */
function logVersionChange(from, to) {
    console.log(`Update version: "${from}"->"${to}".`);
}

/**
 * Executor
 * @param {Map<string,string[]>} args
 */
const executor = args => {

    if (args.has('h') || args.size === 0) {
        return cli.help();
    }

    const file = path.join(process.cwd(), pick(args.get('f'), 'package.json'));
    if (!fs.existsSync(file)) {
        logErrorAndExit(`File not found: "${file}"!`);
    }

    const encoding = pick(args.get('e'), 'utf8'),
        content = fs.readFileSync(file, { encoding }),
        object = JSON.parse(content);
    if (!('version' in object)) {
        logErrorAndExit('Version property not found!');
    }

    const curVer = object.version;

    if (args.has('g')) {
        return console.log(`Current version is: "${curVer}".`);
    }

    const valid = check(curVer),
        validationMsg = createValidationMsg('Current', curVer, valid);
    if (args.has('c')) {
        return console.log(validationMsg);
    }

    const rawTabSize = pick(args.get('t'), '4'),
        tabSize = Number(rawTabSize);
    if (Number.isNaN(tabSize)) {
        logErrorAndExit(`Invalid tab size: "${rawTabSize}"!`);
    }

    let tag = '';
    if (args.has('p')) {
        tag = pick(args.get('p'), 'beta');
        if (!['alpha', 'beta', 'gamma'].includes(tag)) {
            logErrorAndExit(`Invalid tag: "${tag}"!`);
        }
        tag = '-' + tag;
    }

    if (args.has('s')) {

        const target = args.get('s');
        if (!target || target.length === 0) {
            logErrorAndExit('Target version missed!');
        }

        const targetVer = target[0] + tag;
        if (!check(targetVer)) {
            logErrorAndExit(createValidationMsg('Target', targetVer, false));
        }

        object.version = targetVer;
        writeJson(file, encoding, object, tabSize);
        return logVersionChange(curVer, targetVer);

    }

    if (!valid) {
        logErrorAndExit(validationMsg);
    }

    if (args.has('i')) {

        const level = args.get('i')[0] || 'patch';
        if (!['major', 'minor', 'patch'].includes(level)) {
            logErrorAndExit(`Invalid level: "${level}"!`);
        }

        let targetVer = increase(curVer, level) + tag;
        object.version = targetVer;
        writeJson(file, encoding, object, tabSize);
        return logVersionChange(curVer, targetVer);

    }

};

const cli = CLI.create({
    name: '3h-version',
    title: 'A package version manager.',
    tabSize: 2,
    nameSize: 11,
    gapSize: 11,
    lineGapSize: 1
}).arg({
    name: 'h',
    alias: ['-help'],
    help: 'Show this help info.'
}).arg({
    name: 'f',
    alias: ['-file'],
    val: 'file',
    help: 'The file to operate on.\n' +
        'Default: package.json'
}).arg({
    name: 'e',
    alias: ['-enc'],
    val: 'encoding',
    help: 'The encoding of the file.\n' +
        'Default: utf8'
}).arg({
    name: 'g',
    alias: ['-get'],
    help: 'Get current version.'
}).arg({
    name: 's',
    alias: ['-set'],
    val: 'version',
    help: 'Set the version.'
}).arg({
    name: 'c',
    alias: ['-chk'],
    help: 'Check current version.'
}).arg({
    name: 'i',
    alias: ['-inc'],
    val: 'level',
    help: 'Increase the version by <level>,\n' +
        'where <level> is "major",\n' +
        '"minor" or "patch"(default).'
}).arg({
    name: 'p',
    alias: ['-pre'],
    val: 'tag',
    help: 'Pre-release tag. (If this arg\n' +
        'appears, but the <tag> is not\n' +
        'specified, then the <tag> will\n' +
        'be "beta".)'
}).arg({
    name: 't',
    alias: ['-tab'],
    val: 'size',
    help: 'The tab size. (Default: 4)'
}).on('extra', key => {
    console.error(`Unknown arg "${key}"!`);
    process.exit(1);
}).on('exec', executor).exec(process.argv);
