import 'dotenv/config';

import { CSGOEmpire } from 'csgoempire-wrapper';

import offline from './offline.js';
import online from './online.js';
import takeSnapshot from './take-snapshot.js';

if (process.argv.includes('offline')) {
    const account = new CSGOEmpire(process.env.API_KEY, {
        connectToSocket: false,
    });

    offline(account);
} else if (process.argv.includes('online')) {
    const account = new CSGOEmpire(process.env.API_KEY);

    online(account);
} else if (process.argv.includes('take-snapshot')) {
    const account = new CSGOEmpire(process.env.API_KEY, {
        connectToSocket: false,
    });

    takeSnapshot(account);
} else {
    console.log('Usage: node src/index.js [online|offline|take-snapshot]');
}