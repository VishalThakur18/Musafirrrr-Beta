
"use strict";

/**
 * Fetch the currently authenticated user and their profile
 * from Supabase.
 */
async function getCurrentUser() {
  const sb = window.sbClient;

  if (!sb) {
    throw new Error("Supabase client is not initialized.");
  }

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select("id, role, full_name, phone, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  const currentUser = {
    id: profile.id,
    role: profile.role.toUpperCase(),
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