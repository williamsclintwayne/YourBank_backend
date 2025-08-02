import transporter from '../src/config/mailer.js';
import axios from 'axios';
import Notification from '../models/Notification.js';

class NotificationService {
  constructor() {
    // Free SMS service providers
    this.smsProviders = {
      textbelt: {
        url: 'https://textbelt.com/text',
        free: true,
        dailyLimit: 1 // Textbelt free tier allows 1 SMS per day per IP
      },
      emailToSMS: {
        // Email-to-SMS gateways (completely free)
        carriers: {
          'verizon': '@vtext.com',
          'att': '@txt.att.net',
          'tmobile': '@tmomail.net',
          'sprint': '@messaging.sprintpcs.com',
          'boost': '@smsmyboostmobile.com',
          'cricket': '@sms.cricketwireless.net',
          'uscellular': '@email.uscc.net'
        }
      }
    };
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      const mailOptions = {
        from: `"YourBank" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS using Textbelt (free tier - 1 SMS per day)
   */
  async sendSMSViaTextbelt(phoneNumber, message) {
    try {
      const response = await axios.post(this.smsProviders.textbelt.url, {
        phone: phoneNumber,
        message,
        key: 'textbelt' // Free tier key
      });

      if (response.data.success) {
        console.log('SMS sent successfully via Textbelt');
        return { success: true, provider: 'textbelt', quotaRemaining: response.data.quotaRemaining };
      } else {
        console.error('Textbelt SMS failed:', response.data.error);
        return { success: false, error: response.data.error, provider: 'textbelt' };
      }
    } catch (error) {
      console.error('Error sending SMS via Textbelt:', error.message);
      return { success: false, error: error.message, provider: 'textbelt' };
    }
  }

  /**
   * Send SMS via Email-to-SMS gateway (completely free)
   */
  async sendSMSViaEmail(phoneNumber, message, carrier = 'verizon') {
    try {
      const gateway = this.smsProviders.emailToSMS.carriers[carrier.toLowerCase()];
      if (!gateway) {
        throw new Error(`Unsupported carrier: ${carrier}`);
      }

      const smsEmail = `${phoneNumber}${gateway}`;
      const result = await this.sendEmail(
        smsEmail,
        '', // No subject for SMS
        message,
        message
      );

      if (result.success) {
        console.log(`SMS sent successfully via ${carrier} email gateway`);
        return { success: true, provider: `email-to-sms-${carrier}` };
      } else {
        return { success: false, error: result.error, provider: `email-to-sms-${carrier}` };
      }
    } catch (error) {
      console.error('Error sending SMS via email gateway:', error.message);
      return { success: false, error: error.message, provider: 'email-to-sms' };
    }
  }

  /**
   * Smart SMS sending - tries multiple free methods
   */
  async sendSMS(phoneNumber, message, carrier = null) {
    // Clean phone number (remove non-digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Try email-to-SMS first if carrier is provided
    if (carrier) {
      const emailResult = await this.sendSMSViaEmail(cleanPhone, message, carrier);
      if (emailResult.success) {
        return emailResult;
      }
    }

    // Try Textbelt as fallback
    const textbeltResult = await this.sendSMSViaTextbelt(cleanPhone, message);
    if (textbeltResult.success) {
      return textbeltResult;
    }

    // If carrier not provided, try common carriers via email
    if (!carrier) {
      const commonCarriers = ['verizon', 'att', 'tmobile'];
      for (const testCarrier of commonCarriers) {
        const emailResult = await this.sendSMSViaEmail(cleanPhone, message, testCarrier);
        if (emailResult.success) {
          return emailResult;
        }
      }
    }

    return { success: false, error: 'All SMS methods failed' };
  }

  /**
   * Create and send notification
   */
  async createNotification(userId, type, title, message, data = null, sendEmail = true, sendSMS = false, phoneNumber = null, carrier = null) {
    try {
      // Create notification in database
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        sentViaEmail: false,
        sentViaSMS: false
      });

      // Get user details
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      let emailResult = { success: false };
      let smsResult = { success: false };

      // Send email notification if enabled
      if (sendEmail && user.notificationPreferences.email) {
        const emailContent = this.generateEmailTemplate(type, title, message, data);
        emailResult = await this.sendEmail(user.email, title, emailContent);
        
        if (emailResult.success) {
          notification.sentViaEmail = true;
        }
      }

      // Send SMS notification if enabled
      if (sendSMS && user.notificationPreferences.sms && (phoneNumber || user.phoneNumber)) {
        const phone = phoneNumber || user.phoneNumber;
        const smsMessage = this.generateSMSMessage(type, title, message, data);
        smsResult = await this.sendSMS(phone, smsMessage, carrier);
        
        if (smsResult.success) {
          notification.sentViaSMS = true;
        }
      }

      // Update notification with delivery status
      await notification.save();

      return {
        notification,
        emailResult,
        smsResult
      };

    } catch (error) {
      console.error('Error creating notification:', error.message);
      throw error;
    }
  }

  /**
   * Generate email template
   */
  generateEmailTemplate(type, title, message, data) {
    const baseStyle = `
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; }
        .details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    `;

    let content = `
      ${baseStyle}
      <div class="header">
        <h2>YourBank Notification</h2>
      </div>
      <div class="content">
        <h3>${title}</h3>
        <p>${message}</p>
    `;

    if (data) {
      content += `<div class="details">`;
      
      if (data.amount) {
        content += `<p><strong>Amount:</strong> <span class="amount">R ${parseFloat(data.amount).toFixed(2)}</span></p>`;
      }
      
      if (data.reference) {
        content += `<p><strong>Reference:</strong> ${data.reference}</p>`;
      }
      
      if (data.fromAccount) {
        content += `<p><strong>From Account:</strong> ${data.fromAccount}</p>`;
      }
      
      if (data.toAccount) {
        content += `<p><strong>To Account:</strong> ${data.toAccount}</p>`;
      }
      
      if (data.balance) {
        content += `<p><strong>Current Balance:</strong> R ${parseFloat(data.balance).toFixed(2)}</p>`;
      }
      
      content += `</div>`;
    }

    content += `
      </div>
      <div class="footer">
        <p>This is an automated message from YourBank. Please do not reply to this email.</p>
        <p>For support, contact us at support@yourbank.com</p>
      </div>
    `;

    return content;
  }

  /**
   * Generate SMS message (keep it short)
   */
  generateSMSMessage(type, title, message, data) {
    let smsMessage = `YourBank: ${title}`;
    
    if (data && data.amount) {
      smsMessage += ` - R${parseFloat(data.amount).toFixed(2)}`;
    }
    
    if (data && data.reference) {
      smsMessage += ` (Ref: ${data.reference})`;
    }
    
    // Keep SMS under 160 characters
    if (smsMessage.length > 160) {
      smsMessage = smsMessage.substring(0, 157) + '...';
    }
    
    return smsMessage;
  }

  /**
   * Send payment notifications
   */
  async sendPaymentNotifications(senderAccount, beneficiaryAccount, amount, reference) {
    try {
      // Notification to sender
      await this.createNotification(
        senderAccount.userId._id,
        'payment_sent',
        'Payment Sent Successfully',
        `You have successfully sent R${amount.toFixed(2)} to account ${beneficiaryAccount.accountNumber}`,
        {
          amount,
          reference,
          toAccount: beneficiaryAccount.accountNumber,
          balance: senderAccount.balance
        },
        true, // Send email
        true  // Send SMS
      );

      // Notification to recipient
      await this.createNotification(
        beneficiaryAccount.userId._id,
        'payment_received',
        'Payment Received',
        `You have received R${amount.toFixed(2)} from account ${senderAccount.accountNumber}`,
        {
          amount,
          reference: `Received from ${senderAccount.accountNumber}`,
          fromAccount: senderAccount.accountNumber,
          balance: beneficiaryAccount.balance
        },
        true, // Send email
        true  // Send SMS
      );

    } catch (error) {
      console.error('Error sending payment notifications:', error.message);
    }
  }
}

export default new NotificationService();
