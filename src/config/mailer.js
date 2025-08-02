import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, // Should load williamsclintwayne@gmail.com
    pass: process.env.EMAIL_PASS, // Should load the 16-character App Password
  },
});

export default transporter;
