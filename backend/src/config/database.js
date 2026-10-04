// Database configuration - switches between SQLite and PostgreSQL based on DB_TYPE
import { getDatabase, getDatabaseType } from './database-adapter.js';

// Export the database pool/connection
const pool = await getDatabase();

console.log(`✓ Using ${getDatabaseType()} database`);

export default pool;
