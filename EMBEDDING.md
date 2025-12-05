# KinetiQ Chat Widget - Embedding Guide

The KinetiQ chat widget can be embedded on any website. The chat opens directly without requiring upfront verification - all verification happens inside the chat conversation.

## Quick Start

### Method 1: Iframe Embed (Easiest)

Add this iframe to your HTML page:

```html
<iframe 
    src="http://your-frontend-url:3012?embedded=true" 
    width="380" 
    height="600" 
    frameborder="0"
    style="position: fixed; bottom: 20px; right: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"
></iframe>
```

### Method 2: Script Tag (For Custom Integration)

1. Add the configuration script before the widget script:

```html
<script>
  window.kinetiqChatConfig = {
    apiUrl: 'http://your-backend-url:3001',  // Your backend API URL
    embedded: true
  };
</script>
```

2. Add the widget script:

```html
<script src="http://your-frontend-url:3012/kinetiq-chat.js"></script>
```

## Features

- **Direct Chat Access**: No upfront verification required
- **In-Chat Verification**: Verification happens naturally during conversation
- **Floating Widget**: Appears as a floating button that expands into a chat window
- **Responsive**: Works on desktop and mobile devices
- **Customizable**: Can be styled to match your website

## Configuration Options

```javascript
window.kinetiqChatConfig = {
  apiUrl: 'http://localhost:3001',  // Backend API URL (required)
  embedded: true,                     // Enable embedded mode (default: true)
};
```

## Chat Flow

1. User clicks the chat button
2. Chat opens with greeting: "Hi, this is KinetiQ from Secure Bank..."
3. User can ask general questions without verification
4. When user asks about their account, the bot requests verification:
   - Email
   - Date of Birth (YYYY-MM-DD)
   - Last 4 digits of account number
5. After verification, user can access account information

## API Endpoints

The widget communicates with these backend endpoints:

- `POST /api/chat/message` - Send chat messages
- `POST /api/auth/verify` - Verify customer (called internally by AI)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Widget not appearing
- Check browser console for errors
- Verify the API URL is correct and accessible
- Ensure CORS is properly configured on the backend

### Verification not working
- Check that the backend database has test customer data
- Verify the email, DOB, and account number format matches database records

### Styling conflicts
- The widget uses scoped CSS to avoid conflicts
- If needed, you can override styles using CSS specificity

## Development

To run in development mode:

```bash
cd frontend
npm install
npm run dev
```

The widget will be available at `http://localhost:3012`

## Production Build

```bash
cd frontend
npm run build
```

The built files will be in the `dist` directory. Serve these files and update the iframe/src URLs accordingly.

