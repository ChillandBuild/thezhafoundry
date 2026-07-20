// PLANTED FLAW (fixture): fake service-role-shaped JWT on the client.
// @ts-nocheck — fixture file, not part of the site build.
import { createClient } from '@supabase/supabase-js';
export const db = createClient(
  'https://xyz.supabase.co',
  'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.fake-fixture-signature',
);
