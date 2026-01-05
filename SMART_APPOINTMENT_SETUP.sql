-- ============================================================================
-- SMART APPOINTMENT SYSTEM - DATABASE SETUP
-- نظام المواعيد الذكي - إعداد قاعدة البيانات
-- ============================================================================

-- 1. تحديث جدول المواعيد بالحقول الجديدة
-- ============================================================================

-- إضافة حقل الأولوية
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' 
CHECK (priority IN ('normal', 'urgent', 'follow_up'));

-- إضافة حقل التذكير
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- إضافة حقل رقم الموعد (للترتيب في اليوم الواحد)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_number INTEGER;

-- تحديث نوع البيانات للحالة إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status_new') THEN
        CREATE TYPE appointment_status_new AS ENUM (
            'scheduled',
            'waiting',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        );
    END IF;
END $$;

-- 2. إنشاء فهارس للأداء
-- ============================================================================

-- فهرس مركب للتاريخ والوقت
CREATE INDEX IF NOT EXISTS idx_appointments_date_time 
ON appointments(appointment_date, appointment_time);

-- فهرس للحالة
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status);

-- فهرس للأولوية
CREATE INDEX IF NOT EXISTS idx_appointments_priority 
ON appointments(priority);

-- فهرس للمريض والتاريخ
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date 
ON appointments(patient_id, appointment_date);

-- فهرس للطبيب والتاريخ
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
ON appointments(doctor_id, appointment_date);

-- 3. إنشاء View لعرض المواعيد مع التفاصيل
-- ============================================================================

CREATE OR REPLACE VIEW appointments_with_details AS
SELECT 
    a.id,
    a.patient_id,
    a.doctor_id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.visit_type,
    a.notes,
    a.priority,
    a.reminder_sent,
    a.appointment_number,
    a.created_at,
    a.updated_at,
    -- بيانات المريض
    p.name as patient_name,
    p.phone as patient_phone,
    p.age as patient_age,
    p.national_id as patient_national_id,
    -- بيانات الطبيب
    d.name as doctor_name,
    d.email as doctor_email,
    -- معلومات إضافية
    CASE 
        WHEN a.appointment_date = CURRENT_DATE THEN 'today'
        WHEN a.appointment_date = CURRENT_DATE + INTERVAL '1 day' THEN 'tomorrow'
        WHEN a.appointment_date < CURRENT_DATE THEN 'past'
        ELSE 'future'
    END as time_category,
    -- وقت الانتظار (بالدقائق)
    CASE 
        WHEN a.status = 'waiting' THEN 
            EXTRACT(EPOCH FROM (NOW() - a.updated_at)) / 60
        ELSE NULL
    END as waiting_minutes
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id;

-- 4. دالة لحساب رقم الموعد التلقائي
-- ============================================================================

CREATE OR REPLACE FUNCTION set_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_number IS NULL THEN
        SELECT COALESCE(MAX(appointment_number), 0) + 1
        INTO NEW.appointment_number
        FROM appointments
        WHERE doctor_id = NEW.doctor_id
        AND appointment_date = NEW.appointment_date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger
DROP TRIGGER IF EXISTS set_appointment_number_trigger ON appointments;
CREATE TRIGGER set_appointment_number_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointment_number();

-- 5. دالة للتحقق من تعارض المواعيد
-- ============================================================================

CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_doctor_id UUID,
    p_appointment_date TIMESTAMP,
    p_appointment_duration INTEGER DEFAULT 30,
    p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_count INTEGER;
    v_end_time TIMESTAMP;
BEGIN
    v_end_time := p_appointment_date + (p_appointment_duration || ' minutes')::INTERVAL;
    
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM appointments
    WHERE doctor_id = p_doctor_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (id != p_exclude_appointment_id OR p_exclude_appointment_id IS NULL)
    AND (
        -- التحقق من التداخل
        (appointment_date BETWEEN p_appointment_date AND v_end_time)
        OR (appointment_date + INTERVAL '30 minutes' BETWEEN p_appointment_date AND v_end_time)
        OR (p_appointment_date BETWEEN appointment_date AND appointment_date + INTERVAL '30 minutes')
    );
    
    RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- 6. دالة لإحصائيات المواعيد
-- ============================================================================

CREATE OR REPLACE FUNCTION get_appointment_stats(
    p_doctor_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_appointments INTEGER,
    scheduled_count INTEGER,
    waiting_count INTEGER,
    in_progress_count INTEGER,
    completed_count INTEGER,
    cancelled_count INTEGER,
    no_show_count INTEGER,
    urgent_count INTEGER,
    avg_waiting_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_appointments,
        COUNT(*) FILTER (WHERE status = 'scheduled')::INTEGER as scheduled_count,
        COUNT(*) FILTER (WHERE status = 'waiting')::INTEGER as waiting_count,
        COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER as cancelled_count,
        COUNT(*) FILTER (WHERE status = 'no_show')::INTEGER as no_show_count,
        COUNT(*) FILTER (WHERE priority = 'urgent')::INTEGER as urgent_count,
        AVG(
            CASE 
                WHEN status IN ('completed', 'in_progress') THEN 
                    EXTRACT(EPOCH FROM (updated_at - created_at)) / 60
                ELSE NULL
            END
        )::NUMERIC(10,2) as avg_waiting_time
    FROM appointments
    WHERE doctor_id = p_doctor_id
    AND appointment_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- 7. تحديث سياسات RLS
-- ============================================================================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "smart_appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "smart_appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "smart_appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "smart_appointments_delete_policy" ON appointments;

-- سياسة القراءة
CREATE POLICY "smart_appointments_select_policy" ON appointments
    FOR SELECT
    USING (
        -- الأطباء يرون مواعيدهم
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        OR
        -- السكرتيرات يرون مواعيد الطبيب المرتبط بهم
        doctor_id IN (
            SELECT secretary_doctor_id 
            FROM doctors 
            WHERE user_id = auth.uid()
            AND secretary_doctor_id IS NOT NULL
        )
    );

-- سياسة الإضافة
CREATE POLICY "smart_appointments_insert_policy" ON appointments
    FOR INSERT
    WITH CHECK (
        -- الأطباء يضيفون مواعيد لأنفسهم
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        OR
        -- السكرتيرات يضيفون مواعيد للطبيب المرتبط بهم
        doctor_id IN (
            SELECT secretary_doctor_id 
            FROM doctors 
            WHERE user_id = auth.uid()
        )
    );

-- سياسة التحديث
CREATE POLICY "smart_appointments_update_policy" ON appointments
    FOR UPDATE
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        OR
        doctor_id IN (
            SELECT secretary_doctor_id 
            FROM doctors 
            WHERE user_id = auth.uid()
        )
    );

-- سياسة الحذف
CREATE POLICY "smart_appointments_delete_policy" ON appointments
    FOR DELETE
    USING (
        doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
        OR
        doctor_id IN (
            SELECT secretary_doctor_id 
            FROM doctors 
            WHERE user_id = auth.uid()
        )
    );

-- 8. إنشاء جدول لسجل التغييرات (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'status_changed')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_reason TEXT
);

-- فهرس لسجل التغييرات
CREATE INDEX IF NOT EXISTS idx_audit_log_appointment 
ON appointment_audit_log(appointment_id, changed_at DESC);

-- دالة لتسجيل التغييرات
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO appointment_audit_log (
            appointment_id,
            action,
            old_data,
            changed_by
        ) VALUES (
            OLD.id,
            'deleted',
            row_to_json(OLD),
            auth.uid()
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO appointment_audit_log (
            appointment_id,
            action,
            old_data,
            new_data,
            changed_by
        ) VALUES (
            NEW.id,
            CASE 
                WHEN OLD.status != NEW.status THEN 'status_changed'
                ELSE 'updated'
            END,
            row_to_json(OLD),
            row_to_json(NEW),
            auth.uid()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO appointment_audit_log (
            appointment_id,
            action,
            new_data,
            changed_by
        ) VALUES (
            NEW.id,
            'created',
            row_to_json(NEW),
            auth.uid()
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لتسجيل التغييرات
DROP TRIGGER IF EXISTS appointment_audit_trigger ON appointments;
CREATE TRIGGER appointment_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_changes();

-- 9. دوال مساعدة للاستعلامات الشائعة
-- ============================================================================

-- دالة للحصول على المواعيد القادمة
CREATE OR REPLACE FUNCTION get_upcoming_appointments(
    p_doctor_id UUID,
    p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE(
    id UUID,
    patient_name TEXT,
    appointment_date TIMESTAMP,
    appointment_time TIME,
    status TEXT,
    priority TEXT,
    visit_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        p.name as patient_name,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.priority,
        a.visit_type
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = p_doctor_id
    AND a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
    AND a.status NOT IN ('cancelled', 'completed')
    ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على قائمة الانتظار
CREATE OR REPLACE FUNCTION get_waiting_queue(
    p_doctor_id UUID
)
RETURNS TABLE(
    id UUID,
    patient_name TEXT,
    patient_phone TEXT,
    appointment_time TIME,
    waiting_minutes NUMERIC,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        p.name as patient_name,
        p.phone as patient_phone,
        a.appointment_time,
        EXTRACT(EPOCH FROM (NOW() - a.updated_at)) / 60 as waiting_minutes,
        a.priority
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = p_doctor_id
    AND a.appointment_date = CURRENT_DATE
    AND a.status = 'waiting'
    ORDER BY 
        CASE a.priority 
            WHEN 'urgent' THEN 1
            WHEN 'follow_up' THEN 2
            ELSE 3
        END,
        a.appointment_time;
END;
$$ LANGUAGE plpgsql;

-- 10. بيانات تجريبية (اختياري)
-- ============================================================================

-- إضافة أولويات للمواعيد الموجودة
UPDATE appointments 
SET priority = 'normal' 
WHERE priority IS NULL;

-- ============================================================================
-- انتهى الإعداد
-- ============================================================================

-- عرض ملخص
SELECT 
    'Appointments System Updated!' as message,
    COUNT(*) as total_appointments,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_appointments,
    COUNT(*) FILTER (WHERE status = 'waiting') as waiting_now
FROM appointments;
