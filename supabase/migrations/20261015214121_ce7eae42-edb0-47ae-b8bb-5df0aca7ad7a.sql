CREATE TABLE public.clinics (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.clinics TO authenticated; GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clinic_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(clinic_id,user_id));
GRANT SELECT ON public.clinic_members TO authenticated; GRANT ALL ON public.clinic_members TO service_role;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_clinic_member(_clinic uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM clinic_members WHERE clinic_id=_clinic AND user_id=auth.uid()) $$;
CREATE OR REPLACE FUNCTION public.current_clinic_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT clinic_id FROM clinic_members WHERE user_id=auth.uid() ORDER BY created_at LIMIT 1 $$;

CREATE POLICY "Members view own clinic" ON public.clinics FOR SELECT TO authenticated USING (public.is_clinic_member(id));
CREATE POLICY "Users view own memberships" ON public.clinic_members FOR SELECT TO authenticated USING (user_id=auth.uid());

INSERT INTO public.clinics(name) VALUES ('Main Clinic');

ALTER TABLE public.patients ADD COLUMN clinic_id uuid NOT NULL DEFAULT public.current_clinic_id() REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.patients ALTER COLUMN date_of_birth DROP NOT NULL, ALTER COLUMN phone DROP NOT NULL;
CREATE INDEX patients_clinic_idx ON public.patients(clinic_id, created_at DESC);
ALTER TABLE public.visits ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.visits DROP CONSTRAINT visits_patient_id_fkey, ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.set_visit_clinic() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN SELECT clinic_id INTO NEW.clinic_id FROM patients WHERE id=NEW.patient_id; RETURN NEW; END $$;
CREATE TRIGGER visits_set_clinic BEFORE INSERT OR UPDATE OF patient_id ON public.visits FOR EACH ROW EXECUTE FUNCTION public.set_visit_clinic();
ALTER TABLE public.visits ALTER COLUMN clinic_id SET NOT NULL;

DROP POLICY "Staff can add patients" ON public.patients; DROP POLICY "Staff can delete patients" ON public.patients; DROP POLICY "Staff can edit patients" ON public.patients; DROP POLICY "Staff can view patients" ON public.patients;
DROP POLICY "Staff can add visits" ON public.visits; DROP POLICY "Staff can delete visits" ON public.visits; DROP POLICY "Staff can edit visits" ON public.visits; DROP POLICY "Staff can view visits" ON public.visits;
CREATE POLICY "Clinic staff view patients" ON public.patients FOR SELECT TO authenticated USING (public.is_clinic_member(clinic_id));
CREATE POLICY "Clinic staff add patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (public.is_clinic_member(clinic_id));
CREATE POLICY "Clinic staff edit patients" ON public.patients FOR UPDATE TO authenticated USING (public.is_clinic_member(clinic_id)) WITH CHECK (public.is_clinic_member(clinic_id));
CREATE POLICY "Clinic staff delete patients" ON public.patients FOR DELETE TO authenticated USING (public.is_clinic_member(clinic_id));
CREATE POLICY "Clinic staff view visits" ON public.visits FOR SELECT TO authenticated USING (public.is_clinic_member(clinic_id));
CREATE POLICY "Clinic staff add visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (public.is_clinic_member(clinic_id));
CREATE POLICY "Clinic staff edit visits" ON public.visits FOR UPDATE TO authenticated USING (public.is_clinic_member(clinic_id)) WITH CHECK (public.is_clinic_member(clinic_id));
CREATE POLICY "Clinic staff delete visits" ON public.visits FOR DELETE TO authenticated USING (public.is_clinic_member(clinic_id));
ALTER SEQUENCE public.patient_ref_seq RESTART WITH 1001;