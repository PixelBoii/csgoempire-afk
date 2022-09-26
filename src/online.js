import fs from 'fs';

const ITEMS_PER_CHUNK = 20;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function(account) {
    if (! fs.existsSync('./state.json')) {
        console.error('No state file found. Please run `node index.js offline` first.');
        return;
    }

    // Wait for connectionm to trading socket to be established
    await new Promise((resolve, reject) => {
        account.tradingSocket.on('init', resolve);
    });

    const inventory = await account.getInventory();
    const local_state = JSON.parse(fs.readFileSync('./state.json', 'utf8'));

    let deposited_item_ids = [];
    let itemsPendingRelist = {};

    const inventoryItems = local_state.map(saved_item => {
        let inventoryItem = inventory.items.find(item => item.id == saved_item.id);

        if (!inventoryItem) {
            console.log('Item not found: ', saved_item.market_name);
            return null;
        }

        inventoryItem.setDepositValue(saved_item.market_value);

        return inventoryItem;
    }).filter(item => item !== null);

    function finish() {
        let new_state = local_state.filter(item => !deposited_item_ids.includes(item.id));

        fs.writeFileSync('./state.json', JSON.stringify(new_state));
    
        console.log('Inventory loaded from state.json. Exiting.');

        process.exit(0);
    }

    function finishIfDone() {
        if (Object.keys(itemsPendingRelist).length === 0) {
            finish();
        }
    }

    account.tradingSocket.on('trade_status', async (event) => {
        // The trade status can sometimes appear before the deposit response is received,
        // meaning the asset id isn't registered in the itemsPendingRelist. Therefore,
        // we wait 2.5 seconds before checking the trade status to make sure the deposit
        // response has been received.
        await sleep(2500);
    
        // Ensure it's a deposit, has a status of 2 (Processing) and it was waiting on being relisted
        if (event.type == 'deposit' && event.data.status == 2 && itemsPendingRelist[event.data.items[0].asset_id]) {
            delete itemsPendingRelist[event.data.items[0].asset_id];
            deposited_item_ids.push(event.data.items[0].id);

            console.log(`Item ${event.data.items[0].market_name} was successfully relisted. (${Object.keys(itemsPendingRelist).length} remaining)`);
        }

        finishIfDone();
    });

    for (let i = 0; i < inventoryItems.length; i += ITEMS_PER_CHUNK) {
        const itemChunk = inventoryItems.slice(i, i + ITEMS_PER_CHUNK);

        try {
            await account.makeDeposits(itemChunk);

            console.log(`Deposited ${itemChunk.length} items. (${i + itemChunk.length} of ${inventoryItems.length} total)`);

            for (let item of itemChunk) {
                itemsPendingRelist[item.asset_id] = item;
            }
        } catch(e) {
            console.error(`There was an error depositing ${itemChunk.length} items. Only the successful deposits were removed from your local state, meaning you can attempt to go online again to deposit the rest.`);
            console.error('Please try again in a few minutes from now. If the error persists, please open an issue on our GitHub page. When doing so, please include the following error message:');
            console.error(e);
        }
    }

    console.log('Finished depositing items. We\'re now waiting for all deposits to be confirmed as listed, which can take up to a few minutes. Once this is done, we\'ll save the new state to state.json and automatically exit.');

    // Check if it's already done just in case, like if all deposit requests failed. If so, close the process and save the progress.
    finishIfDone();

    setTimeout(() => {
        if (Object.keys(itemsPendingRelist).length > 0) {
            console.log('It\'s been a few minutes and some items are still pending relist, so we\'ll assume they\'ve failed to be listed for some reason. They were not removed from the local state, so you can attempt to go online again to deposit them.');
            finish();
        }
    }, 1000 * 60 * 2);
}