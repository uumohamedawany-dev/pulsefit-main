# PulseFit Capacitor permissions

Android permissions are declared in `android/app/src/main/AndroidManifest.xml` for camera capture, Android 13+ photo access, legacy gallery access, notifications, and native file export.

For an iOS Capacitor target, add these keys to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>PulseFit يستخدم الكاميرا لتحليل الوجبات وتصوير إيصال التحويل.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>PulseFit يحتاج الصور لاختيار إيصال التحويل وبيانات الوجبات.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>PulseFit يحتاج حفظ تقرير التقدم في الصور عند طلبك.</string>
```

Runtime behavior:

- `Camera.getPhoto()` requests camera or photo-picker access when the AI scanner starts.
- Native PDF export calls `Filesystem.requestPermissions()` before writing to `Directory.Documents`; web export uses the browser download fallback.
- Local notifications request their own permission before scheduling hydration reminders.
- Payment receipt selection uses an image-only file picker and rejects files above 7 MB.

On Android 13+, `READ_MEDIA_IMAGES` is used instead of legacy external storage access. On Android 12 and lower, `READ_EXTERNAL_STORAGE` is capped with `maxSdkVersion=32` and write access is capped at API 28.
