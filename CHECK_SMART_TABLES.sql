SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('smart_ivf_cycles', 'smart_monitoring_visits');
