require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/api/referral', async (req, res) => {
  try {
    console.log('Request received:', req.body);

    const { referrerName, referrerEmail, refereeName, refereeEmail } = req.body;

    if (!referrerName || !referrerEmail || !refereeName || !refereeEmail) {
      console.error('Validation failed: Missing fields');
      return res.status(400).json({ error: 'All fields are required.' });
    }

    console.log('Saving to database...');
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        refereeName,
        refereeEmail,
        submittedAt: new Date(),
      },
    });
    console.log('Referral saved to database:', referral);

    console.log('Sending email...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: refereeEmail,
      subject: 'Referral Submission',
      text: `Dear ${refereeName}, ${referrerName} has referred you.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json(referral);
  } catch (error) {
    console.error('Error handling referral:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
