Pupeteer Tester for webrtc-observer.org
---

## Install

1. Install software

`npm i` or `yarn`

2. Create test video

```shell
wget https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_stereo.avi
ffmpeg -i big_buck_bunny_720p_stereo.avi -t 30 -pix_fmt yuv420p bbb.y4m
```

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
 * `--numRooms` - number of rooms (each room will have the same `joiningPeers` number of peer)

**ENV vars**

| name | description |
| --- | --- |
| `SCREENSHOTS_DIR`| directory to save screenshots |
| `DEBUG_MODE` | enable verbose logging |
| `MEASUREMENT_LENGTH_IN_SECONDS` | length of traffic generation in seconds (default: 10) |
| `VIDEO_PATH` | video input file path (required format: y4m) |
