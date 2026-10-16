import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { db } from './db/index.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

async function start() {
  try {
    // Connect to PostgreSQL database
    await db.init();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🏛️  MUNICIPAL TICKET BACKEND & DATABASE (Member 5)`);
      console.log(`🐘  PostgreSQL 14:     CONNECTED`);
      console.log(`🚀  Server running at: http://localhost:${PORT}`);
      console.log(`📡  Citizen Gateway:   POST http://localhost:${PORT}/api/municipal-ticket`);
      console.log(`📋  Tickets API:       GET  http://localhost:${PORT}/api/tickets`);
      console.log(`🔒  Review Queue:      GET  http://localhost:${PORT}/api/reviews (Auth Required)`);
      console.log(`📊  Operations Stats:  GET  http://localhost:${PORT}/api/stats`);
      console.log(`=======================================================`);
    });
  } catch (err: any) {
    console.error('Fatal database startup failure:', err.message);
    process.exit(1);
  }
}

start();
