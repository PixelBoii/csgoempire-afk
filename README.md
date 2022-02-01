# CSGOEmpire AFK System with NodeJS
Easily delist all your items whenever you go AFK, and easily relist them whenever you're back.

## Prerequisites
1. You need to have [NodeJS](https://nodejs.org/en/) installed.

## Installation
1. Clone the repository. This can be done in many ways, but the easiest way is to download [the zip file](https://github.com/PixelBoii/csgoempire-afk/archive/refs/heads/main.zip) and extract it.
2. Execute the following command in the extracted folder in order to install the necessary dependencies: `npm install`
3. Rename the `.env.example` file to `.env` and replace `YOUR_API_KEY` with your CSGOEmpire API key, which can be found [here](https://csgoempire.com/trading/apikey).

## Usage

### Going offline
Execute `npm run offline` or `node index.js offline` in the root folder.

### Going online
Execute `npm run online` or `node index.js online` in the root folder.
