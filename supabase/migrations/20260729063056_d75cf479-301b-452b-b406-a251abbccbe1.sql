INSERT INTO public.user_roles (user_id, role)
VALUES ('22512f2c-2c0a-4ece-9ae1-28dae8bd43aa', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

ALTER TABLE public.profiles DISABLE TRIGGER USER;

UPDATE public.profiles SET role = 'seller', approved = true, updated_at = now() WHERE id = '22512f2c-2c0a-4ece-9ae1-28dae8bd43aa';

INSERT INTO public.profiles (id, role, approved)
SELECT '22512f2c-2c0a-4ece-9ae1-28dae8bd43aa', 'seller', true
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '22512f2c-2c0a-4ece-9ae1-28dae8bd43aa');

ALTER TABLE public.profiles ENABLE TRIGGER USER;