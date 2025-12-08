# Nile IVF Center - Offline-First PWA Setup

## Overview
The Nile IVF Center app has been upgraded to a fully functional **Offline-First Progressive Web App (PWA)** that works seamlessly without internet connectivity and automatically syncs data when online.

## 🚀 Features Implemented

### 1. **PWA Configuration**
- **Service Worker**: Caches all static assets and implements network-first strategy for API calls
- **Web App Manifest**: Defines app metadata, icons, and installation behavior
- **Offline Support**: App loads and functions completely offline
- **Auto-Updates**: Automatically updates when new versions are available

### 2. **Local Database (Dexie)**
- **IndexedDB Wrapper**: Fast, reliable local storage using Dexie
- **Schema Mirroring**: Local database structure matches Supabase tables
- **Sync Status Tracking**: Each record tracks sync status (pending/synced/error)

### 3. **Sync Engine**
- **Offline-First**: Data saved locally first, then synced to server
- **Background Sync**: Automatically syncs pending data when back online
- **Conflict Resolution**: Handles data conflicts gracefully
- **Retry Logic**: Failed syncs are retried with exponential backoff

### 4. **User Experience**
- **Instant Loading**: Data loads instantly from local cache
- **Offline Indicator**: Visual indicators for online/offline status
- **Sync Status**: Shows pending syncs and sync progress
- **Error Handling**: Graceful fallbacks when sync fails

## 📁 File Structure

```
src/
├── lib/
│   ├── localDb.ts          # Dexie database configuration
│   ├── pwa.ts             # PWA registration and utilities
│   └── syncService.ts     # Sync manager implementation
├── services/
│   ├── syncService.ts     # Sync manager singleton
│   └── [existing services] # Modified to use sync manager
public/
├── manifest.json          # PWA manifest
├── sw.js                 # Service worker
└── pwa-*.png            # App icons (see below)
```

## 🖼️ Required App Icons

Place these icon files in the `public/` directory:

- `pwa-192x192.png` - 192x192px (required)
- `pwa-512x512.png` - 512x512px (required)
- `apple-touch-icon.png` - 180x180px (optional, for iOS)

**Icon Generation**: Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) or [RealFaviconGenerator](https://realfavicongenerator.net/) to generate these from your app logo.

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
npm install dexie vite-plugin-pwa
```

### 2. Build for Production
```bash
npm run build
```

### 3. Deploy
The PWA will be automatically configured during the build process.

## 📱 Installation Instructions

### For Users:
1. **Chrome/Edge**: Click the install icon in the address bar or use the "Install" menu
2. **Firefox**: Use the "Install This Site as an App" option in the page menu
3. **Safari (iOS)**: Use "Add to Home Screen" from the share menu
4. **Android**: Use "Add to Home Screen" from the browser menu

## 🔄 How Offline Sync Works

### Data Flow:
1. **User Action**: User enters data (e.g., saves a patient)
2. **Local Save**: Data saved to IndexedDB immediately
3. **UI Update**: App shows data instantly (no loading)
4. **Background Sync**: When online, data synced to Supabase
5. **Status Update**: Local record marked as "synced"

### Conflict Resolution:
- **Server Wins**: If server data is newer, it overwrites local
- **Manual Merge**: Conflicts shown to user for resolution
- **Retry Failed**: Failed syncs automatically retried

## 🛠️ Development Notes

### Testing Offline Mode:
1. Open DevTools → Network tab
2. Check "Offline" to simulate no internet
3. Test all app functionality
4. Uncheck "Offline" to test sync

### Database Inspection:
- Chrome DevTools → Application → IndexedDB → ClinicDB
- View local data and sync status

### Service Worker Debugging:
- Chrome DevTools → Application → Service Workers
- Check registration, updates, and cache status

## 🚨 Important Considerations

### Data Security:
- **Local Encryption**: Sensitive data should be encrypted locally
- **Sync Security**: Ensure sync happens over HTTPS only
- **Auth Tokens**: Handle authentication token refresh offline

### Performance:
- **Database Size**: Monitor IndexedDB size limits (~50MB-1GB)
- **Sync Frequency**: Balance between real-time and battery usage
- **Cleanup**: Implement data cleanup for old records

### Error Handling:
- **Network Errors**: Graceful degradation when offline
- **Sync Failures**: Clear user communication about sync status
- **Data Loss**: Backup strategies for critical data

## 🔮 Future Enhancements

- **Push Notifications**: Real-time alerts for critical updates
- **Background Sync**: Periodic data synchronization
- **Conflict UI**: Visual conflict resolution interface
- **Data Export**: Offline data export capabilities
- **Multi-device Sync**: Sync across multiple devices

## 🐛 Troubleshooting

### Common Issues:
1. **Service Worker Not Registering**: Check browser support and HTTPS
2. **Sync Not Working**: Verify network permissions and API endpoints
3. **Database Errors**: Clear IndexedDB and reinstall app
4. **Icons Not Showing**: Ensure correct file paths and formats

### Debug Commands:
```javascript
// Check PWA status
console.log('PWA Installed:', window.matchMedia('(display-mode: standalone)').matches);

// Check online status
console.log('Online:', navigator.onLine);

// Force sync
// syncManager.forceSync(); // When implemented
```

---

## 📞 Support

For technical support or questions about the PWA implementation, contact the development team.

**Last Updated**: December 2025
**Version**: 1.0.0