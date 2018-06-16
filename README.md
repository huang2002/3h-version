# 3h-version

A package version manager.

# Install

Install it as a cli tool.

```
> npm i 3h-version -g
```

# Usage

```
> 3h-version -h
A package version manager.

3h-version  [options]

  -h, --help                  Show this help info.

  -f, --file      <file>      The file to operate on.
                              Default: package.json

  -e, --enc       <encoding>  The encoding of the file.
                              Default: utf8

  -g, --get                   Get current version.

  -s, --set       <version>   Set the version.

  -c, --chk                   Check current version.

  -i, --inc       <level>     Increase the version by <level>,
                              where <level> is "major",
                              "minor" or "patch"(default).

  -p, --pre       <tag>       Pre-release tag. (If this arg
                              appears, but the <tag> is not
                              specified, then the <tag> will
                              be "beta".)

  -t, --tab-size  <size>      The tab size. (Default: 4)

  -l, --log       <logs>      Changelogs. (e.g. -l "..." "...")
                              If this arg is followed by nothing,
                              then changelogs will be read from
                              the command line.

  --log-file      <file>      The changelog file.
                              Default: CHANGELOG.md

  --time-format   <format>    Time format passed to `3h-time`.
                              Default: YYYY-MM-DD

  --heading-gap   <gap>       Heading gap. (Default: " - ")

```
