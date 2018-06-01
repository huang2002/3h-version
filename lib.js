const Version = {

    /**
     * @description Check whether the version string is valid.
     * @param {string} str
     * @returns {boolean}
     */
    check(str) {
        return /^\d+(?:\.\w+){0,2}(?:-(?:alpha|beta|gamma))?$/.test(str);
    },

    /**
     * @description Parse the version string.
     * @param {string} str
     * @returns {[number, number, number, string] | null}
     */
    parse(str) {
        if (Version.check(str)) {
            const [digitals, tag = ''] = str.split('-');
            return digitals.split('.').map(n => (n - 0) > 0 ? (n - 0) : 0).concat(tag);
        } else {
            return null;
        }
    },

    /**
     * @description Increase the version by the specified level.
     * @param {string} ver
     * @param {"patch" | "minor" | "major"} level
     */
    increase(ver, level) {
        const ans = Version.parse(ver).slice(0, 3);
        switch (level) {
            case 'patch':
                ans[2]++;
                break;
            case 'minor':
                ans[1]++;
                ans[2] = 0;
                break;
            case 'major':
                ans[0]++;
                ans[1] = ans[2] = 0;
                break;
        }
        return ans.join('.');
    }

};

module.exports = Version;
