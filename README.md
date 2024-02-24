# Pop'n Randomizer

![Screenshot of Pop'n Randomizer](/randomizer.png?raw=true)

Web app for drawing random songs from **pop'n music**, with options to filter by level, version, and much more. Song titles and genres are fully romanized, and details such as bpm, note count, etc. are included when available.

The app is currently available at https://chinatsu.surge.sh.

## Dev

```sh
# As needed
yarn upgrade popn-db-js --latest

yarn dev
```

## Deploy

```sh
yarn build
yarn export
yarn deploy:dev
yarn deploy
```
