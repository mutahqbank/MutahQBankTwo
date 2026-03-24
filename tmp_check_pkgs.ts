
import { query } from './lib/database.ts';

async function checkPackages() {
    try {
        const res = await query('SELECT id, custom_name, price, active FROM packages WHERE custom_name IS NOT NULL OR price > 0');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPackages();
