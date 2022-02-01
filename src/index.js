require('dotenv').config();

const cmd = process.argv[2];

if (!['online', 'offline'].includes(cmd)) {
    console.log('Usage: node src/index.js [online|offline]');

    process.exit(1);
}

const { CSGOEmpire } = require('csgoempire-wrapper');
const fs = require('fs');

const account = new CSGOEmpire(process.env.API_KEY, {
    connectToSocket: false,
});

if (cmd == 'offline') {
    account.getActiveTrades().then(trades => {
        let state = [];

        trades.deposits.forEach(item => {
            item.cancel();

            state.push({
                id: item.id,
                market_name: item.market_name,
                custom_price_percentage: item.custom_price_percentage,
            });
        });

        fs.writeFileSync('./state.json', JSON.stringify(state));

        console.log('Inventory saved to state.json');
    });
}

if (cmd == 'online') {
    if (fs.existsSync('./state.json')) {
        account.getInventory().then(async inventory => {
            let local_state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

            local_state.forEach(saved_item => {
                let item = inventory.items.find(item => item.id == saved_item.id);

                if (item) {
                    item.deposit(saved_item.custom_price_percentage);
                } else {
                    console.log('Item not found: ', saved_item.market_name);
                }
            })

            fs.writeFileSync('./state.json', JSON.stringify([]));

            console.log('Inventory loaded from state.json');
        });
    } else {
        console.error('No state file found. Please run `node index.js offline` first.');
    }
}