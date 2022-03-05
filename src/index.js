require('dotenv').config();

const { CSGOEmpire } = require('csgoempire-wrapper');
const fs = require('fs');

const account = new CSGOEmpire(process.env.API_KEY, {
    connectToSocket: false,
});

if (process.argv.includes('offline')) {
    account.getActiveTrades().then(async trades => {
        let state = [];

        for (let item of trades.deposits) {
            try {
                await item.cancel();
            } catch(e) {
                console.error(`There was an error canceling your ${item.market_name} deposit. The state was partially saved, meaning it can be restored by going online again.`);
                console.error('Please try again in a few minutes from now. If the error persists, please open an issue on our GitHub page. When doing so, please include the following error message:');
                console.error(e);

                break;
            }

            state.push({
                id: item.id,
                market_name: item.market_name,
                custom_price_percentage: item.custom_price_percentage,
                market_value: item.market_value,
            });
        }

        fs.writeFileSync('./state.json', JSON.stringify(state));

        console.log('Inventory saved to state.json');
    });
} else if (process.argv.includes('online')) {
    if (fs.existsSync('./state.json')) {
        if (process.argv.includes('--same-price')) {
            console.log('Depositing items for the same price as they were taken offline with. Note: This might be slightly off, as it will be rounded to the nearest percentage.');
        }

        account.getInventory().then(async inventory => {
            let local_state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

            local_state.forEach(saved_item => {
                let item = inventory.items.find(item => item.id == saved_item.id);

                if (item) {
                    if (process.argv.includes('--same-price')) {
                        item.depositForValue(saved_item.market_value);
                    } else {
                        item.deposit(saved_item.custom_price_percentage);
                    }
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
} else {
    console.log('Usage: node src/index.js [online|offline] [-- --same-price]');
}