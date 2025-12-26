-- قاعدة بيانات الأدمن المستقل
CREATE TABLE IF NOT EXISTS admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    is_super_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    last_login timestamptz
);

-- جدول صلاحيات الأدمن
CREATE TABLE IF NOT EXISTS admin_roles (
    id serial PRIMARY KEY,
    admin_id uuid REFERENCES admins(id) ON DELETE CASCADE,
    role text NOT NULL -- مثال: 'manage_users', 'manage_subscriptions', 'view_reports'
);

-- سجل نشاطات الأدمن
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id serial PRIMARY KEY,
    admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- أدمن افتراضي (غير مشفر، للتجربة فقط)
INSERT INTO admins (email, name, password_hash, is_super_admin)
VALUES ('admin@yourdomain.com', 'Super Admin', '$2b$10$testhash', true)
ON CONFLICT (email) DO NOTHING;

-- ملاحظة: يجب استبدال password_hash بقيمة مشفرة حقيقية عند الإنتاج
