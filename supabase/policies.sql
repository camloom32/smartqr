-- Public read access for QR code redirects (no auth required)
CREATE POLICY "Public read for redirects"
  ON public.dynamic_codes FOR SELECT
  USING (TRUE);
