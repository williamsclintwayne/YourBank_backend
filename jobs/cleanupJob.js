import cron from 'node-cron';
import ProofOfPaymentService from '../services/proofOfPaymentService.js';

// Schedule cleanup job to run daily at 2 AM
// This will delete receipt files older than 30 days
const startCleanupJob = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting scheduled cleanup of old receipt files...');
    try {
      await ProofOfPaymentService.cleanupOldReceipts();
      console.log('Receipt cleanup completed successfully');
    } catch (error) {
      console.error('Error during receipt cleanup:', error);
    }
  });

  console.log('Receipt cleanup job scheduled to run daily at 2 AM');
};

export default startCleanupJob;
