// Supabase client for Musafirrrr Beta

const SUPABASE_URL = "https://ovcjebdtehnobbcsmync.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_4bnqpqpCRzVDHGyb_2JcZg_KtzUjVhN";

window.sbClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("Supabase initialized:", !!window.sbClient);