// Simple Express.js backend proxy for EmailJS
// This allows mobile apps to send emails through EmailJS
// 
// To use:
// 1. Install: npm install express cors
// 2. Run: node backend-email-proxy.js
// 3. Update the BACKEND_URL in SecurityProvider.tsx to point to this server

const express = require('express');
const cors = require('cors');
// Use EmailJS REST API directly with built-in fetch (Node.js 18+)
// No need to install node-fetch - fetch is built-in

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// EmailJS Configuration (prefer environment variables)
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'service_muid74x';
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_siyoad7';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '8HDuCD7IjRceaYMQ9';
const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email proxy server is running' });
});

// Send location email endpoint
app.post('/api/send-location-email', async (req, res) => {
  try {
    const {
      to_email,
      device_name,
      latitude,
      longitude,
      accuracy,
      timestamp,
      google_maps_link,
      apple_maps_link,
      coordinates,
    } = req.body;

    // Validate required fields
    if (!to_email || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to_email, latitude, longitude',
      });
    }

    // Prepare template parameters
    const templateParams = {
      to_email: to_email.trim(),
      device_name: device_name || 'Mobile Device',
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      accuracy: accuracy || 'Unknown',
      timestamp: timestamp || new Date().toLocaleString(),
      google_maps_link: google_maps_link || `https://www.google.com/maps?q=${latitude},${longitude}`,
      apple_maps_link: apple_maps_link || `http://maps.apple.com/?ll=${latitude},${longitude}`,
      coordinates: coordinates || `${latitude}, ${longitude}`,
    };

    console.log('📤 Sending email via EmailJS (backend proxy)...');
    console.log('📋 Template params:', templateParams);

    // Send email using EmailJS REST API
    const emailjsResponse = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    const responseText = await emailjsResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { text: responseText };
    }

    console.log('✅ EmailJS API Response:', {
      status: emailjsResponse.status,
      statusText: emailjsResponse.statusText,
      data: responseData,
    });
    
    if (emailjsResponse.ok) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        response: {
          status: emailjsResponse.status,
          text: responseText,
        },
      });
    } else {
      throw new Error(`EmailJS API error: ${emailjsResponse.status} - ${responseText}`);
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
      details: error.toString(),
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email proxy server running on port ${PORT}`);
  console.log(`📧 Ready to send emails via EmailJS`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📬 Send email: POST http://localhost:${PORT}/api/send-location-email`);
});

