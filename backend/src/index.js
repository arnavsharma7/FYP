import app from './app.js';
import dotenv from 'dotenv';
import { connectPrisma } from './utils/PrismaProvider.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

try {
  await connectPrisma();
  console.log('Database connected');

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}
