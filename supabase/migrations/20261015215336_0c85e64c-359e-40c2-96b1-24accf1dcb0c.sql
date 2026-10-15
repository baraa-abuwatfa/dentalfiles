CREATE OR REPLACE FUNCTION public.handle_new_user_clinic() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cid uuid; nm text;
BEGIN
  nm := NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), '');
  INSERT INTO clinics(name) VALUES (COALESCE(nm || '''s Clinic', 'My Clinic')) RETURNING id INTO cid;
  INSERT INTO clinic_members(clinic_id, user_id) VALUES (cid, NEW.id);
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_clinic() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_clinic AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_clinic();