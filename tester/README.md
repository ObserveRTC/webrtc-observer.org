Pupeteer Tester for webrtc-observer.org
---

## Install

`npm i` or `yarn`

## Build

```shell
yarn build
```

## Run

```shell
yarn dev
```

**Arguments**:

 * `--doScreenshots` - take screenshots during the test in `SCREENSHOTS_DIR` folder (default `./screenshots`)
 * `--joiningPeers` - number of peers to join in the same room

**ENV vars**

| name | description |
| --- | --- |
| `SCREENSHOTS_DIR`| directory to save screenshots |
| `DEBUG_MODE` | enable verbose logging |
| `MEASUREMENT_LENGTH_IN_SECONDS` | length of traffic generation in seconds (default: 10) |
