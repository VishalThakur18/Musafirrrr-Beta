"use strict";

/* ============================================================
   BACKEND SERVICE — AUTH
   Supabase authentication and user profiles.
   ============================================================ */

/**
 * Load the signed-in user and their profile.
 * The profiles row is created by the database trigger.
 */
async function getCurrentUser() {
  const sb = window.sbClient;

  if (!sb) {
    throw new Error("Supabase client is not initialized.");
  }

  const {
  data: { session },
  error: sessionError,
} = await sb.auth.getSession();

if (sessionError) throw sessionError;
if (!session) return null;

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();

  if (authError) throw authError;
  if (!user) return null;

    const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select("id, role, full_name, phone, avatar_url, created_at")
    .eq("id", user.id)
    .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw new Error("Your profile was not found. Please contact support.");

  const currentUser = {
    id: profile.id,
    role: String(profile.role).toUpperCase(),
    name: profile.full_name,
    email: user.email,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
  };

  if (currentUser.role === "ORGANIZER") {
    const { data: organizer, error } = await sb
      .from("organizers")
      .select(
        "id, slug, name, contact_person, based_in, bio, logo_url, phone, whatsapp_number, instagram_handle, verified, years_active"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    currentUser.organizerId = organizer?.id ?? null;
    currentUser.organizer = organizer ?? null;
  }

  if (currentUser.role === "TRAVELLER") {
    const { data: prefs, error } = await sb
      .from("traveller_preferences")
      .select(
        "preferred_destinations, budget_min, budget_max, trip_types, travel_style"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    currentUser.prefs = prefs
      ? {
          destinations: prefs.preferred_destinations ?? [],
          budgetMin: prefs.budget_min,
          budgetMax: prefs.budget_max,
          types: prefs.trip_types ?? [],
          style: prefs.travel_style,
        }
      : null;
  }

  return currentUser;
}

window.getCurrentUser = getCurrentUser;


/**
 * Create role-specific records after the user has a session.
 * This is useful when email confirmation delays the session.
 */
async function ensureRoleRecords(user) {
  const sb = window.sbClient;
  const metadata = user.user_metadata || {};
  const role = String(metadata.role || "").toLowerCase();

  if (role === "traveller") {
    const { data: existing, error: readError } = await sb
      .from("traveller_preferences")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;

    if (!existing) {
      const { error } = await sb
        .from("traveller_preferences")
        .insert({
          user_id: user.id,
          preferred_destinations: [],
          budget_min: 0,
          budget_max: 20000,
          trip_types: [],
          travel_style: "Solo Friendly",
        });

      if (error) throw error;
    }
  }

  if (role === "organizer") {
    const { data: existing, error: readError } = await sb
      .from("organizers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;

    if (!existing) {
      const orgName = metadata.org_name;

      if (!orgName) {
        throw new Error(
          "Organizer details are missing. Please contact support."
        );
      }

      const { error } = await sb
        .from("organizers")
        .insert({
          user_id: user.id,
          slug: slugify(orgName) + "-" + Math.random().toString(36).slice(2, 6),
          name: orgName,
          contact_person: metadata.full_name || "",
          based_in: metadata.city || "India",
          bio: metadata.bio || null,
          phone: metadata.phone || "",
          whatsapp_number: metadata.whatsapp || "",
          instagram_handle: metadata.instagram || null,
          verified: false,
          years_active: 0,
        });

      if (error) throw error;
    }
  }
}

/** Where the confirmation link sends the user back to. */
function emailRedirectUrl() {
  // No hash here: Supabase appends ?code=... and we handle it in init().
  return window.location.origin + window.location.pathname;
}

/**
 * With "Confirm email" on, signing up an already-registered email does NOT
 * return an error. It returns a fake user with an empty identities array.
 */
function assertNewUser(user) {
  if (user && Array.isArray(user.identities) && user.identities.length === 0) {
    throw new Error("This email is already registered. Please log in instead.");
  }
}

/**
 * Authentication service used by the existing pages.
 */
const authService = {
  async current() {
    return await window.getCurrentUser();
  },

  async login(email, password) {
    const sb = window.sbClient;

    const { data, error } = await sb.auth.signInWithPassword({
        email: String(email).trim(),
        password,
    });

    if (error) {
        if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) {
        const e = new Error("Please confirm your email first. Check your inbox for the link.");
        e.code = "email_not_confirmed";
        throw e;
        }
        throw error;
    }

    if (!data.user) throw new Error("Unable to load your account.");

    const user = await window.getCurrentUser();
    if (!user) throw new Error("Your profile could not be loaded.");
    await window.refreshAuth(user);
    return user;
    },

  async signupTraveller(d) {
    const sb = window.sbClient;

    const { data, error } = await sb.auth.signUp({
      email: String(d.email).trim(),
      password: d.password,
      options: {
        emailRedirectTo: emailRedirectUrl(),
        data: {
          role: "traveller",
          full_name: d.name.trim(),
          phone: d.phone.trim(),
        },
      },
    });

    if (error) throw error;
    

    if (!data.user) {
      throw new Error("Supabase did not return a user account.");
    }

    assertNewUser(data.user); 

    if (!data.session) {
      return {
        confirmationRequired: true,
        email: data.user.email,
      };
    }

    await ensureRoleRecords(data.user);
const user = await window.getCurrentUser();
await window.refreshAuth(user);
return user;
  },

  async signupOrganizer(d) {
    const sb = window.sbClient;

    const { data, error } = await sb.auth.signUp({
      email: String(d.email).trim(),
      password: d.password,
      options: {
        emailRedirectTo: emailRedirectUrl(),
        data: {
          role: "organizer",
          full_name: d.name.trim(),
          phone: d.phone.trim(),
          org_name: d.orgName.trim(),
          city: d.city.trim(),
          whatsapp: d.whatsapp.trim(),
          instagram: d.instagram.trim(),
          bio: d.bio.trim(),
        },
      },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error("Supabase did not return a user account.");
    }

    assertNewUser(data.user);

    if (!data.session) {
      return {
        confirmationRequired: true,
        email: data.user.email,
      };
    }

    await ensureRoleRecords(data.user);
    const user = await window.getCurrentUser();
    await window.refreshAuth(user);
    return user;
  },

  async resendConfirmation(email) {
  const { error } = await window.sbClient.auth.resend({
    type: "signup",
    email: String(email).trim(),
    options: { emailRedirectTo: emailRedirectUrl() },
  });
  if (error) throw error;
},

/** Call once after the app has rendered. Handles the email-link return. */
async init() {
  const sb = window.sbClient;
  const qs = new URLSearchParams(window.location.search);
  const hashQs = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
  const cameFromEmail = qs.has("code");
  const linkFailed = hashQs.has("error_code") || qs.has("error_description");

  // Waits for supabase-js to finish exchanging ?code= for a session.
  const { data: { session } } = await sb.auth.getSession();

  if (cameFromEmail || linkFailed) {
    // Clean the URL so a refresh doesn't retry the exchange
    window.history.replaceState(null, "", window.location.pathname + "#/login");
  }

  if (linkFailed) {
    toast("That confirmation link is invalid or expired. Log in to request a new one.");
    go("/login");
  } else if (cameFromEmail) {
    if (session) {
    try { await ensureRoleRecords(session.user); } catch (e) { console.error(e); }
    const user = await window.getCurrentUser();
    await window.refreshAuth(user);
    } else {
      // Link opened in a different browser/device than the one that signed up
      toast("Email confirmed. Please log in.");
      go("/login");
    }
  }
},

  async logout() {
    const sb = window.sbClient;

    const { error } = await sb.auth.signOut();
    if (error) throw error;
    await window.refreshAuth(null);
  },
};

window.authService = authService;