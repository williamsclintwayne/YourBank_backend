# YourBank Backend - Notification Service Setup

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password

# Optional: SMS Configuration
# For Textbelt Pro (if you want more than 1 SMS per day)
# TEXTBELT_API_KEY=your-textbelt-api-key

# Optional: Twilio (alternative SMS provider)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## Free SMS Options Implemented

### 1. Email-to-SMS Gateways (100% Free)
- Uses your existing email service to send SMS
- Supported carriers:
  - Verizon: `phonenumber@vtext.com`
  - AT&T: `phonenumber@txt.att.net`
  - T-Mobile: `phonenumber@tmomail.net`
  - Sprint: `phonenumber@messaging.sprintpcs.com`
  - And more...

### 2. Textbelt Free Tier
- 1 free SMS per day per IP address
- No registration required
- Automatic fallback option

## API Endpoints

### Notification Management
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Notification Preferences
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences

### Test Notification (Development)
- `POST /api/notifications/test` - Send test notification

## Usage Examples

### Update User Profile with Phone Number
```javascript
// In your user registration/update endpoint
const user = await User.findByIdAndUpdate(userId, {
  phoneNumber: "1234567890",
  "notificationPreferences.email": true,
  "notificationPreferences.sms": true
});
```

### Send Custom Notification
```javascript
import NotificationService from './services/notificationService.js';

await NotificationService.createNotification(
  userId,
  'payment_sent',
  'Payment Sent',
  'Your payment was successful',
  { amount: 100, reference: 'REF123' },
  true, // Send email
  true  // Send SMS
);
```

## Carrier Detection for SMS

To improve SMS delivery, users can specify their carrier:

```javascript
// Update notification preferences with carrier
PUT /api/notifications/preferences
{
  "sms": true,
  "phoneNumber": "1234567890",
  "carrier": "verizon"
}
```

## Free SMS Limits

1. **Email-to-SMS**: Unlimited (uses your email quota)
2. **Textbelt Free**: 1 SMS per day per IP
3. **Combined**: Smart fallback system tries multiple methods

## Cost Analysis

- **Email notifications**: Free (using Gmail)
- **SMS via Email Gateway**: Free (unlimited)
- **SMS via Textbelt**: Free (1/day) or $0.015/SMS for more
- **Total monthly cost for 1000 users**: $0 (if using email-to-SMS)

## Security Notes

- All notifications are stored in database for audit trail
- Email templates include anti-phishing measures
- SMS messages are kept under 160 characters
- Phone numbers are sanitized before sending
