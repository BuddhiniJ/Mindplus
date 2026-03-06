# Soundscape Tracks

Add your custom audio tracks in this folder and map them in:

- `src/config/soundscapeTracks.js`

## Recommended filenames

- `rain.mp3`
- `forest.mp3`
- `ocean.mp3`
- `fire.mp3`
- `white.mp3`

## How to use local files

Replace URL sources in `soundscapeTracks.js` with local `require` values.

Example:

```js
export const SOUNDSCAPE_TRACKS = {
  rain: require("../../assets/soundscapes/rain.mp3"),
  forest: require("../../assets/soundscapes/forest.mp3"),
  ocean: require("../../assets/soundscapes/ocean.mp3"),
  fire: require("../../assets/soundscapes/fire.mp3"),
  white: require("../../assets/soundscapes/white.mp3"),
};
```

After adding files, restart Expo for the asset changes to load.
