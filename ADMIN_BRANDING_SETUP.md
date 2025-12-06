# Admin Dashboard & Dynamic Branding - Setup Guide

## 📋 Overview

The admin dashboard enables real-time customization of:
- **Clinic name & contact info** (address, phone)
- **Clinic logo** (upload & display)
- **Brand colors** (primary, secondary, accent)
- **Prescription settings** (default templates)
- **Record management** (view & delete clinical records)

Changes are instantly reflected across the entire application (Sidebar, Dashboard, Prescriptions).

---

## 🔧 Setup Steps

### Step 1: Create Database Table

Execute this SQL in your **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  clinic_name TEXT NOT NULL DEFAULT 'نظام د محمد صلاح جبر',
  logo_url TEXT,
  clinic_address TEXT,
  clinic_phone TEXT,
  primary_color TEXT DEFAULT '#2d5a6b',
  secondary_color TEXT DEFAULT '#00838f',
  accent_color TEXT DEFAULT '#00bcd4',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  CONSTRAINT single_row CHECK (id = 1),
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read app_settings" ON app_settings;
CREATE POLICY "Users can read app_settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update app_settings" ON app_settings;
CREATE POLICY "Authenticated users can update app_settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO app_settings (id, clinic_name, logo_url)
VALUES (1, 'نظام د محمد صلاح جبر', NULL)
ON CONFLICT (id) DO NOTHING;
```

✅ **Verify**: Go to Supabase → SQL Editor → Run the query above

---

### Step 2: Create Storage Bucket for Logo Upload

1. **Go to Supabase Dashboard** → **Storage** tab
2. Click **"Create a new bucket"**
3. **Bucket name**: `branding` (exactly as shown)
4. **Privacy**: Select **"Public bucket"**
5. Click **"Create bucket"**

---

### Step 3: Set Storage Policies

Execute this SQL in **Supabase SQL Editor**:

```sql
-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Allow authenticated users to upload branding" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding');

-- Allow authenticated users to delete their files
DROP POLICY IF EXISTS "Allow authenticated users to delete branding" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete branding"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'branding');

-- Allow public read access (so logos display)
DROP POLICY IF EXISTS "Allow public read access to branding" ON storage.objects;
CREATE POLICY "Allow public read access to branding"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'branding');
```

✅ **Verify**: In Storage tab, you should see "branding" bucket with policies set

---

## 🚀 Using the Admin Dashboard

### Access Admin Panel

1. Login to the application
2. **Desktop**: Click **"لوحة التحكم"** (Admin) in the Sidebar
3. **Mobile**: Scroll bottom navigation → tap **"Admin"** button

### Customize Branding

**Tab 1: تخصيص التصميم (Design Customization)**

- **اسم المركز**: Update clinic name (appears in Sidebar & Dashboard)
- **رقم الهاتف**: Clinic phone number
- **العنوان**: Clinic address
- **شعار العيادة**: Upload clinic logo
  - Drag & drop or click to select image
  - Supported formats: PNG, JPG, GIF
  - Max size: 5 MB
- **Colors**: Adjust primary, secondary, accent colors using color picker
- Click **"حفظ التغييرات"** to save

---

### Configure Prescriptions

**Tab 2: إعدادات الروشتة (Prescription Settings)**

- **Default drug category**: Select which category appears first
- **Default instructions**: Add standard prescription notes
- Available drugs database shown with categories

---

### Manage Records

**Tab 3: إدارة السجلات (Records Management)**

- View last 50 clinical visits
- **Delete**: Remove records from system
- **Refresh**: Click ← to reload latest records

---

## ✨ Features Enabled After Setup

### 1. **Dynamic Sidebar**
- Clinic logo displays in Sidebar header (if uploaded)
- Clinic name from settings (instead of hardcoded "Nile IVF Center")

### 2. **Dynamic Dashboard**
- Header shows clinic name from settings

### 3. **Dynamic Prescriptions**
- Prescription print headers use:
  - Clinic name from settings
  - Clinic address & phone from settings
  - Clinic logo (if uploaded) or default symbol

### 4. **Real-time Updates**
- All changes apply immediately without app restart
- Changes persist to Supabase database

---

## 🐛 Troubleshooting

### Error: "فشل رفع الشعار" (Logo upload failed)

**Solution**: 
- Make sure "branding" bucket exists in Supabase Storage
- Verify it's set as "Public bucket"
- Run storage policies from Step 3 above

### Error: "فشل حفظ الإعدادات" (Settings save failed)

**Check**:
1. Is `app_settings` table created? (Run SQL from Step 1)
2. Are RLS policies enabled?
3. Is the table queryable? (`SELECT * FROM app_settings` should return 1 row)

### Clinic name not updating in Sidebar

**Solution**:
- Hard refresh browser: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
- Close & reopen the app

---

## 📝 Database Schema Reference

```typescript
app_settings {
  id: 1 (fixed, single row)
  clinic_name: string          // "نظام د محمد صلاح جبر"
  logo_url: string | null       // URL from branding bucket
  clinic_address: string | null
  clinic_phone: string | null
  primary_color: string         // "#2d5a6b"
  secondary_color: string       // "#00838f"
  accent_color: string          // "#00bcd4"
  updated_at: timestamp
  updated_by: uuid (user id)
}
```

---

## 🔐 Security

- ✅ RLS policies restrict access to authenticated users
- ✅ Settings table has single-row constraint (immutable singleton)
- ✅ Storage bucket marked as public (for logo display)
- ✅ Upload policies verify user authentication

---

## 📦 Files Modified

- `context/BrandingContext.tsx` - Global branding state & API
- `pages/AdminDashboard.tsx` - Admin control panel UI
- `components/Sidebar.tsx` - Dynamic branding display
- `pages/Dashboard.tsx` - Dynamic clinic name
- `components/PrescriptionPrinter.tsx` - Dynamic prescription headers
- `types.ts` - Added ADMIN page enum
- `App.tsx` - BrandingProvider wrapper
- `BRANDING_SETUP.sql` - Database setup script

---

## ✅ Verification Checklist

- [ ] Executed SQL from Step 1 (app_settings table)
- [ ] Created "branding" storage bucket (Step 2)
- [ ] Executed SQL from Step 3 (storage policies)
- [ ] Can access Admin Dashboard from app
- [ ] Can update clinic name without logo (settings save)
- [ ] Can upload logo successfully
- [ ] Changes appear in Sidebar, Dashboard, Prescriptions
- [ ] Hardcoded text replaced with dynamic values

---

## 🎯 Next Steps

1. Test all admin features
2. Verify changes persist after browser refresh
3. Test prescription printing with new branding
4. (Optional) Customize color scheme to match your clinic identity

