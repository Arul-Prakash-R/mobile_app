# Email Backend Proxy Setup

EmailJS doesn't support direct API calls from mobile apps (returns 403 error). This backend proxy solves that issue.

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

Or if you're in the root directory:

```bash
npm install --prefix backend express cors @emailjs/nodejs
```

### 2. Update Template ID

Edit `backend-email-proxy.js` and update the `EMAILJS_TEMPLATE_ID` to match your EmailJS template ID (currently `template_siyoad7`).

### 3. Run the Backend Server

```bash
node backend-email-proxy.js
```

Or with nodemon for auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Update Mobile App Configuration

#### Option A: Local Development (Mobile Device)

**IMPORTANT:** On mobile devices, `localhost` refers to the device itself, not your computer!

1. **Find your computer's local IP address:**
   - Windows: `ipconfig | findstr IPv4`
   - Mac/Linux: `ifconfig | grep inet`
   - Look for an IP like `192.168.1.x` or `192.168.0.x`

2. **Create a `.env` file** in your mobile app root directory:

```env
EXPO_PUBLIC_EMAIL_PROXY_URL=http://192.168.1.3:3000
```

Replace `192.168.1.3` with your computer's actual IP address.

3. **Make sure your computer and mobile device are on the same WiFi network**

4. **Restart the Expo server** after creating the `.env` file:
   ```bash
   npm start
   ```

#### Option B: Production/Remote Backend

Create a `.env` file in your mobile app root:

```env
EXPO_PUBLIC_EMAIL_PROXY_URL=https://your-backend-domain.com
```

Or update the `BACKEND_URL` in `providers/SecurityProvider.tsx`:

```typescript
const BACKEND_URL = 'https://your-backend-domain.com';
```

### 5. Deploy Backend (Optional)

You can deploy this backend to:
- **Heroku**: Free tier available
- **Railway**: Free tier available
- **Render**: Free tier available
- **Vercel**: Serverless functions
- **AWS Lambda**: Serverless
- **DigitalOcean**: App Platform

#### Example: Deploy to Railway

1. Create account at https://railway.app
2. Create new project
3. Connect your GitHub repo
4. Add the backend files
5. Set environment variables if needed
6. Deploy!

## Testing

1. Start the backend server
2. Test the health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

3. Test sending an email:
   ```bash
   curl -X POST http://localhost:3000/api/send-location-email \
     -H "Content-Type: application/json" \
     -d '{
       "to_email": "test@example.com",
       "latitude": "11.050297",
       "longitude": "77.037087",
       "device_name": "Test Device",
       "timestamp": "Test Time"
     }'
   ```

## Troubleshooting

### Backend not running
- Error: "Backend proxy server is not running"
- Solution: Start the backend server with `node backend-email-proxy.js`

### Connection refused
- Error: "ECONNREFUSED" or "Failed to fetch"
- Solution: Check the BACKEND_URL is correct and server is accessible

### EmailJS errors
- Check EmailJS service ID, template ID, and public key are correct
- Verify EmailJS template has all required variables
- Check EmailJS account limits

## Files

- `backend-email-proxy.js` - Express.js server that proxies EmailJS requests
- `backend-package.json` - Dependencies for the backend
- `README-BACKEND-SETUP.md` - This file

