import NotificationService from './services/notificationService.js';
import dotenv from 'dotenv';

dotenv.config();

// Test the notification service
async function testNotifications() {
  console.log('🚀 Testing YourBank Notification Service...\n');

  // Test email notification
  console.log('📧 Testing email notification...');
  const emailResult = await NotificationService.sendEmail(
    'test@example.com', // Replace with your email
    'YourBank Test Notification',
    NotificationService.generateEmailTemplate(
      'test',
      'Test Notification',
      'This is a test email from YourBank notification service.',
      { amount: 100, reference: 'TEST123' }
    )
  );
  console.log('Email Result:', emailResult);

  // Test SMS via email gateway
  console.log('\n📱 Testing SMS via email gateway...');
  const smsResult = await NotificationService.sendSMSViaEmail(
    '1234567890', // Replace with test phone number
    'YourBank: Test SMS via email gateway',
    'verizon' // Replace with actual carrier
  );
  console.log('SMS via Email Result:', smsResult);

  // Test SMS via Textbelt
  console.log('\n📱 Testing SMS via Textbelt...');
  const textbeltResult = await NotificationService.sendSMSViaTextbelt(
    '1234567890', // Replace with test phone number
    'YourBank: Test SMS via Textbelt'
  );
  console.log('SMS via Textbelt Result:', textbeltResult);

  console.log('\n✅ Notification service testing completed!');
}

// Run the test
testNotifications().catch(console.error);
