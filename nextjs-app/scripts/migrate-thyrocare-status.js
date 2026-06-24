#!/usr/bin/env node
/**
 * One-time migration: normalizes all thyrocare.status values in the
 * Order collection to UPPERCASE + TRIM.
 *
 * Run once on the Hostinger VM:
 *   node scripts/migrate-thyrocare-status.js
 *
 * Safe to re-run (idempotent — already-uppercase values are unchanged).
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Manually parse .env to get MONGODB_URI
let MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            for (const line of lines) {
                const match = line.match(/^\s*MONGODB_URI\s*=\s*(.+)$/);
                if (match) {
                    // Strip quotes if present
                    MONGO_URI = match[1].replace(/['"]/g, '').trim();
                    break;
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ Failed to parse .env file manually:', err.message);
    }
}

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not set in environment or .env file');
    process.exit(1);
}

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('orders');

    // Fetch all orders that have a thyrocare.status value
    const cursor = collection.find(
        { 'thyrocare.status': { $exists: true, $ne: null } },
        { projection: { _id: 1, 'thyrocare.status': 1, 'thyrocare.statusHistory': 1 } }
    );

    let checked = 0;
    let updated = 0;

    for await (const doc of cursor) {
        checked++;
        const raw = doc.thyrocare?.status ?? '';
        const normalized = raw.toUpperCase().trim();

        // Also normalize every entry in statusHistory
        const rawHistory = doc.thyrocare?.statusHistory ?? [];
        const normalizedHistory = rawHistory.map((h) => ({
            ...h,
            status: (h.status ?? '').toUpperCase().trim()
        }));

        // Skip if nothing changed
        const historyChanged = rawHistory.some(
            (h, i) => h.status !== normalizedHistory[i].status
        );
        if (raw === normalized && !historyChanged) continue;

        await collection.updateOne(
            { _id: doc._id },
            {
                $set: {
                    'thyrocare.status':        normalized,
                    'thyrocare.statusHistory': normalizedHistory,
                }
            }
        );
        updated++;

        if (updated % 50 === 0) {
            console.log(`  ... updated ${updated} orders so far`);
        }
    }

    console.log(`\n✅ Done. Checked: ${checked}, Updated: ${updated}`);
    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌  Migration failed:', err);
    process.exit(1);
});
