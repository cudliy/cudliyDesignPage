# 🎁 Digital Gift Feature - Quick Start Guide

## What Is It?
A feature that lets users send personalized 3D design gifts to friends via unique shareable links. Recipients see an engaging 5-slide presentation before downloading the design.

## How It Works (30 seconds)

1. **Sender**: Creates design → Download page → "Send Digital Gift" button
2. **Form**: Fills in recipient name, email, and personal message
3. **Link**: Gets unique shareable link (e.g., `cudliy.com/gift/abc123`)
4. **Share**: Copies link or sends via email
5. **Recipient**: Clicks link → Sees 5 personalized slides → Downloads design

## Key Files

### Backend
```
backend/src/
├── models/Gift.js              # Database model
├── controllers/giftController.js # Business logic
└── routes/giftRoutes.js        # API endpoints
```

### Frontend
```
src/
├── pages/SendGiftPage.tsx      # Gift creation form
├── pages/GiftViewPage.tsx      # Recipient view
└── services/api.ts            # API methods (updated)
```

## Routes

### User Routes
- `/send-gift/:designId` - Create gift form
- `/gift/:giftId` - Recipient view

### API Routes
- `POST /api/gifts/create` - Create gift
- `GET /api/gifts/:giftId` - Get gift
- `POST /api/gifts/:giftId/download` - Track download
- `GET /api/gifts/:giftId/analytics` - Get stats
- `POST /api/gifts/:giftId/send-email` - Send email
- `GET /api/gifts/user/:userId/gifts` - List gifts

## The 5 Slides

1. **Intro** 🎁 - Sender's name + message
2. **Design** 🎨 - Design image + description
3. **Details** ⚙️ - Style, material, size
4. **Download** 📥 - Download button
5. **Thanks** ✨ - Thank you message

## Testing

### Quick Test
1. Create a design
2. Go to download page
3. Click "Send Digital Gift"
4. Fill form with test data
5. Copy generated link
6. Open link in incognito window
7. View slides and download

### Test Link
After creating a gift, you'll get a link like:
```
https://cudliy.com/gift/abc123-def456-ghi789
```

## API Examples

### Create Gift
```typescript
const response = await apiService.createGift(
  'design-123',           // designId
  'John Doe',            // senderName
  'Jane Smith',          // recipientName
  'jane@example.com',    // recipientEmail
  'Check this out!',     // message
  'user-456'             // senderId (optional)
);

console.log(response.data.shareLink);
// https://cudliy.com/gift/abc123...
```

### Get Gift
```typescript
const response = await apiService.getGift('abc123-def456-ghi789');
const { gift, design } = response.data;

console.log(gift.senderName);    // "John Doe"
console.log(gift.recipientName); // "Jane Smith"
console.log(design.originalText); // Design description
```

### Track Download
```typescript
await apiService.trackGiftDownload('abc123-def456-ghi789');
```

## Features

✅ Personalized slides with sender's name
✅ Unique link per gift
✅ Copy to clipboard
✅ Send via email
✅ Social media sharing
✅ View tracking
✅ Download tracking
✅ 30-day expiration
✅ Mobile responsive
✅ No sign-up required for recipients

## Database Schema

```javascript
{
  id: UUID,                    // Unique gift ID
  designId: string,            // Design being gifted
  senderId: string,            // Who sent it
  senderName: string,          // Sender's display name
  recipientName: string,       // Recipient's name
  recipientEmail: string,      // Recipient's email
  message: string,             // Personal message
  shareLink: string,           // Unique URL
  status: string,              // created|sent|viewed|downloaded
  viewCount: number,           // How many times viewed
  viewedAt: Date,              // When first viewed
  downloadedAt: Date,          // When downloaded
  expiresAt: Date,             // 30 days from creation
  metadata: {                  // Tracking info
    userAgent: string,
    ipAddress: string,
    viewedFrom: string
  }
}
```

## Common Tasks

### Copy Link to Clipboard
```typescript
await navigator.clipboard.writeText(giftLink);
```

### Send Email
```typescript
await apiService.sendGiftEmail(giftId);
```

### Get Analytics
```typescript
const analytics = await apiService.getGiftAnalytics(giftId, senderId);
console.log(analytics.data.viewCount);
```

### List User's Gifts
```typescript
const gifts = await apiService.getUserGifts(userId, page, limit);
```

## Troubleshooting

### Link not working?
- Check if 30 days have passed (gifts expire)
- Verify giftId is correct
- Check browser console for errors

### Email not sending?
- Verify email service is configured
- Check recipient email is valid
- Check backend logs

### Slides not showing?
- Verify design exists
- Check network tab for API errors
- Clear browser cache

### Download not tracking?
- Check if giftId is correct
- Verify API endpoint is accessible
- Check backend logs

## Performance Tips

- Slides load on demand
- Images are optimized
- Lazy loading for design images
- Caching for repeated views

## Security

- Unique UUID for each gift
- No authentication required (but tracked)
- Email validation
- 30-day expiration
- IP/user agent logging

## Next Steps

1. **Test**: Follow the quick test above
2. **Deploy**: Push to production
3. **Monitor**: Watch error logs
4. **Enhance**: Add email service, analytics dashboard, etc.

## Support

For issues or questions:
1. Check error logs
2. Review documentation files
3. Check API responses
4. Test in development first

---

**Status**: ✅ Ready to use

The feature is fully implemented and ready for testing and deployment!