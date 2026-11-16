ALTER TABLE public.perfiles_candidatos
    ADD COLUMN IF NOT EXISTS expectativa_salarial_maxima numeric;

NOTIFY pgrst, 'reload schema';
