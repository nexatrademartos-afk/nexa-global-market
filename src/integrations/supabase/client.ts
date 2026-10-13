import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://ljweqsofsbmrooxgchch.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqd2Vxc29mc2Jtcm9veGdjaGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMjE4MjcsImV4cCI6MjA5OTc5NzgyN30.J400LzSpA437rEhsYpP28nHajdhQl1cK0DWv3ZEV1BY";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
