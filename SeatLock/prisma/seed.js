import { seedRealTheaters } from "../seed-real-theaters.js";

async function main() {
    await seedRealTheaters();
}

main().catch((err) => {
    console.error("Cold start seed failed:", err);
    process.exit(1);
});

