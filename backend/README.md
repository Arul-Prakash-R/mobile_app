# Email Backend Proxy

This backend server allows mobile apps to send emails through EmailJS (which doesn't support direct mobile app calls).

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Server will run on:** `http://localhost:3000`

## Endpoints

### Health Check
```
GET http://localhost:3000/health
```

### Send Location Email
```
POST http://localhost:3000/api/send-location-email
Content-Type: application/json

{
  "to_email": "user@example.com",
  "latitude": "11.050297",
  "longitude": "77.037087",
  "device_name": "Android Device",
  "timestamp": "Sunday, November 9, 2025, 10:18:53 AM GMT+5:30",
  "accuracy": "14.39m",
  "google_maps_link": "https://www.google.com/maps?q=11.0502967,77.0370866",
  "apple_maps_link": "http://maps.apple.com/?ll=11.0502967,77.0370866",
  "coordinates": "11.050297, 77.037087"
}
```

## Configuration

Update these values in `backend-email-proxy.js`:
- `EMAILJS_SERVICE_ID`: Your EmailJS service ID
- `EMAILJS_TEMPLATE_ID`: Your EmailJS template ID
- `EMAILJS_PUBLIC_KEY`: Your EmailJS public key

## Mobile App Configuration

The mobile app automatically uses `http://localhost:3000` for local development.

For production, set the environment variable:
```env
EXPO_PUBLIC_EMAIL_PROXY_URL=https://your-backend-domain.com
```

Or update `BACKEND_URL` in `providers/SecurityProvider.tsx`.

## Deploy

You can deploy this to:
- **Railway**: Free tier, easy deployment
- **Render**: Free tier
- **Heroku**: Free tier (limited)
- **Vercel**: Serverless functions
- **AWS Lambda**: Serverless
- **DigitalOcean**: App Platform

