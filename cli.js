#!node

const Version = require('./lib'),
    path = require('path'),
    fs = require('fs'),
    readline = require('readline'),
    Time = require('3h-time'),
    CLI = require('3h-cli');

const { check, increase } = Version;

const defaultTimeFormat = 'YYYY-MM-DD',
    defaultTabSize = '4',
    defaultFile = 'package.json',
    defaultEncoding = 'utf8',
    defaultLogFile = 'CHANGELOG.md',
    defaultHeadingGap = ' - ';

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
    fs.writeFileSync(file, JSON.stringify(object, undefined, tabSize), encoding);
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
        cli.help();
    }

    const file = path.join(process.cwd(), pick(args.get('f'), defaultFile));
    if (!fs.existsSync(file)) {
        logErrorAndExit(`File not found: "${file}"!`);
    }

    const encoding = pick(args.get('e'), defaultEncoding),
        content = fs.readFileSync(file, encoding),
        object = JSON.parse(content);
    if (!('version' in object)) {
        logErrorAndExit('Version property not found!');
    }

    let curVer = object.version;

    if (args.has('g')) {
        console.log(`Current version is: "${curVer}".`);
    }

    const valid = check(curVer),
        validationMsg = createValidationMsg('Current', curVer, valid);
    if (args.has('c')) {
        console.log(validationMsg);
    }

    const rawTabSize = pick(args.get('t'), defaultTabSize),
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
        logVersionChange(curVer, targetVer);
        curVer = object.version;

    }

    if (!valid) {
        logErrorAndExit(validationMsg);
    }

    const level = pick(args.get('i'), 'patch'),
        headingLevel = Version.getHeadingLevel(level);

    if (args.has('i')) {

        if (headingLevel === -1) {
            logErrorAndExit(`Invalid level: "${level}"!`);
        }

        let targetVer = increase(curVer, level) + tag;
        object.version = targetVer;
        writeJson(file, encoding, object, tabSize);
        logVersionChange(curVer, targetVer);
        curVer = object.version;

    }

    if (args.has('l')) {

        const logs = args.get('l'),
            logFile = pick(args.get('-log-file'), defaultLogFile),
            timeFormat = pick(args.get('-time-format'), defaultTimeFormat),
            headingGap = pick(args.get('-heading-gap'), defaultHeadingGap),
            logFileExists = fs.existsSync(logFile),
            originalContent = logFileExists ? fs.readFileSync(logFile, encoding) : '';

        if (logs.length > 0) {
            log();
        } else {
            console.log(
                'Please input the changelogs:\n' +
                '( End with an empty line. )\n'
            );
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.setPrompt('- ');
            rl.prompt();
            rl.on('line', line => {
                if (line.length > 0) {
                    logs.push(line);
                    rl.prompt();
                } else {
                    readline.moveCursor(process.stdout, 2, -1);
                    console.log('(end)\n');
                    log();
                    rl.close();
                }
            });
        }

        function log() {
            let newContent = '';
            logs.forEach(log => {
                newContent = '- ' + log + '\n' + newContent;
            });
            newContent = '#'.repeat(headingLevel) + ' ' +
                curVer + headingGap + Time.get(timeFormat) +
                '\n\n' + newContent;

            fs.writeFileSync(logFile, newContent + (logFileExists ? '\n' : '') + originalContent, encoding);
            console.log(`Changelogs are written into "${logFile}":\n` + newContent);
        }

    }

};

const cli = CLI.create({
    name: '3h-version',
    title: 'A package version manager.',
    tabSize: 2,
    nameSize: 16,
    gapSize: 12,
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
        'Default: ' + defaultFile
}).arg({
    name: 'e',
    alias: ['-enc'],
    val: 'encoding',
    help: 'The encoding of the file.\n' +
        'Default: ' + defaultEncoding
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
    alias: ['-tab-size'],
    val: 'size',
    help: `The tab size. (Default: ${defaultTabSize})`
}).arg({
    name: 'l',
    alias: ['-log'],
    val: 'logs',
    help: 'Changelogs. (e.g. -l "..." "...")\n' +
        'If this arg is followed by nothing,\n' +
        'then changelogs will be read from\n' +
        'the command line.'
}).arg({
    name: '-log-file',
    val: 'file',
    help: 'The changelog file.\n' +
        'Default: ' + defaultLogFile
}).arg({
    name: '-time-format',
    val: 'format',
    help: 'Time format passed to `3h-time`.\n' +
        'Default: ' + defaultTimeFormat
}).arg({
    name: '-heading-gap',
    val: 'gap',
    help: `Heading gap. (Default: "${defaultHeadingGap}")`
}).on('extra', key => {
    console.error(`Unknown arg "${key}"!`);
    process.exit(1);
}).on('exec', executor).exec(process.argv);
