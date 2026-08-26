// Initialize Supabase Client
const SUPABASE_URL = "https://axctnkrxhbcnxdgqcgye.supabase.co";
const SUPABASE_KEY = "sb_publishable_oII-gJgviZaaZFK6zMaGBA_bPTmtwGo";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Production Login via Database
async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email, // use user@yourdomain.com
    password: password
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  // Fetch Assigned Company Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role, companies(*)')
    .eq('id', data.user.id)
    .single();

  window.currentUserProfile = profile;
  showToast(`Logged in as ${profile.username}`);
  loadJobsFromDatabase();
}

// 2. Fetch Jobs from Database (Filtered by User's Company)
async function loadJobsFromDatabase() {
  const companyId = window.currentUserProfile.companies.id;
  const { data: jobs, error } = await supabase
    .from('egm_lines')
    .select('*')
    .eq('company_id', companyId)
    .order('job_no', { ascending: true })
    .order('si_no', { ascending: true });

  if (!error) {
    masterJobList = jobs;
    filteredJobList = [...jobs];
    renderMasterList();
  }
}

// 3. Save Record to Cloud Database
async function saveRecordToDatabase(recordData) {
  const companyId = window.currentUserProfile.companies.id;

  const { data, error } = await supabase
    .from('egm_lines')
    .upsert({
      ...recordData,
      company_id: companyId,
      created_by: window.currentUserProfile.id
    }, { onConflict: 'company_id, job_no, si_no' });

  if (error) {
    showToast("Error saving to database: " + error.message);
  } else {
    showToast(`Job #${recordData.job_no} Line ${recordData.si_no} saved to cloud.`);
    loadJobsFromDatabase();
  }
}
