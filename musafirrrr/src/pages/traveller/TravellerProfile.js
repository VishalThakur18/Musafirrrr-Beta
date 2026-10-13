
"use strict";

/* ============================================================
   PAGE — TRAVELLER PROFILE (#/traveller/profile)
   Supabase-backed profile, travel preferences and photo upload.
   ============================================================ */

function TravellerProfile() {
    const auth = useAuth();
    const me = auth.user;

    const [f, setF] = useState({
        name: "",
        email: "",
        phone: "",
        destinations: [],
        budget: 20000,
        types: [],
        style: "Solo Friendly"
    });

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const fileInputRef = React.useRef(null);

    // Populate the form when authentication finishes loading.
    React.useEffect(() => {
        if (!auth.ready) return;

        if (!me) {
            setLoading(false);
            setLoadError("Please log in to view your profile.");
            return;
        }

        setF({
            name: me.name || "",
            email: me.email || "",
            phone: me.phone || "",
            destinations: me.prefs?.destinations || [],
            budget: me.prefs?.budgetMax ?? 20000,
            types: me.prefs?.types || [],
            style: me.prefs?.style || "Solo Friendly"
        });

        setLoading(false);
        setLoadError("");
    }, [auth.ready, me]);

    const toggleType = (category) => {
        setF(current => ({
            ...current,
            types: (current.types || []).includes(category)
                ? current.types.filter(item => item !== category)
                : [...(current.types || []), category]
        }));
    };

    const toggleDest = (destination) => {
        setF(current => ({
            ...current,
            destinations: (current.destinations || []).includes(destination)
                ? current.destinations.filter(item => item !== destination)
                : [...(current.destinations || []), destination]
        }));
    };

    // Save profile information and travel preferences.
    const save = async (event) => {
        event.preventDefault();

        if (!me?.id) {
            setSaveError("Your session could not be verified. Please log in again.");
            return;
        }

        const budget = Number(f.budget);

        if (!Number.isFinite(budget) || budget < 0) {
            setSaveError("Please enter a valid budget.");
            return;
        }

        setSaving(true);
        setSaveError("");

        try {
            const sb = window.sbClient;

            if (!sb) {
                throw new Error(
                    "Supabase is not initialized. Please refresh and try again."
                );
            }

            const { data: authData, error: authError } =
                await sb.auth.getUser();

            if (authError) throw authError;

            if (!authData.user || authData.user.id !== me.id) {
                throw new Error(
                    "Your login session has changed. Please log in again."
                );
            }

            const { error: profileError } = await sb
                .from("profiles")
                .update({
                    full_name: f.name.trim(),
                    phone: f.phone.trim() || null
                })
                .eq("id", me.id);

            if (profileError) throw profileError;

            const { error: preferencesError } = await sb
                .from("traveller_preferences")
                .upsert({
                    user_id: me.id,
                    preferred_destinations: f.destinations || [],
                    budget_min: 0,
                    budget_max: budget,
                    trip_types: f.types || [],
                    travel_style: f.style || "Solo Friendly"
                }, {
                    onConflict: "user_id"
                });

            if (preferencesError) throw preferencesError;

            const updatedUser = await window.getCurrentUser();
            await window.refreshAuth(updatedUser);

            toast("Profile and preferences saved.");
        } catch (error) {
            console.error("Could not save traveller profile:", error);

            setSaveError(
                error?.message ||
                "We couldn't save your changes. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // Upload a profile photo and save its public URL.
    const changePhoto = async (event) => {
        const file = event.target.files?.[0];

        // Permit selecting the same file again.
        event.target.value = "";

        if (!file) return;

        setPhotoError("");

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            setPhotoError("Choose a JPG, PNG, or WebP image.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setPhotoError("Your photo must be 2 MB or smaller.");
            return;
        }

        if (!me?.id) {
            setPhotoError("Please log in again before changing your photo.");
            return;
        }

        setUploadingPhoto(true);

        let uploadedPath = null;
        let uploadClient = null;

        try {
            const sb = window.sbClient;

            if (!sb) {
                throw new Error(
                    "Supabase is not initialized. Please refresh and try again."
                );
            }

            // Verify the signed-in user.
            const { data: authData, error: authError } =
                await sb.auth.getUser();

            if (authError) throw authError;

            if (!authData.user || authData.user.id !== me.id) {
                throw new Error(
                    "Your login session changed. Please log in again."
                );
            }

            const extensionByType = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            };

            if (!window.crypto?.randomUUID) {
                throw new Error(
                    "Your browser cannot generate a secure filename. Please update your browser."
                );
            }

            // Each upload gets a unique path, avoiding overwrite permission.
            const filePath =
                `${me.id}/${window.crypto.randomUUID()}.` +
                extensionByType[file.type];

            uploadClient = sb;
            uploadedPath = filePath;

            const { error: uploadError } = await sb.storage
                .from("profile-photos")
                .upload(filePath, file, {
                    contentType: file.type,
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = sb.storage
                .from("profile-photos")
                .getPublicUrl(filePath);

            const photoUrl = urlData?.publicUrl;

            if (!photoUrl) {
                throw new Error("Could not generate the photo URL.");
            }

            // Save the photo URL to the user's profile.
            const { error: profileError } = await sb
                .from("profiles")
                .update({
                    avatar_url: photoUrl
                })
                .eq("id", me.id);

            if (profileError) throw profileError;

            // Reload the saved profile and update shared authentication state.
            const updatedUser = await window.getCurrentUser();
            await window.refreshAuth(updatedUser);

            toast("Profile photo updated successfully.");
        } catch (error) {
            console.error("Could not upload profile photo:", error);

            // If saving the profile URL failed, attempt to remove the
            // newly uploaded object to avoid leaving an unused image.
            // This cleanup may fail because the current policy grants
            // INSERT only. That is safe; the error is logged separately.
            if (uploadedPath && uploadClient) {
                try {
                    const { error: cleanupError } = await uploadClient.storage
                        .from("profile-photos")
                        .remove([uploadedPath]);

                    if (cleanupError) {
                        console.warn(
                            "Uploaded photo cleanup was not permitted:",
                            cleanupError.message
                        );
                    }
                } catch (cleanupError) {
                    console.warn(
                        "Could not clean up uploaded photo:",
                        cleanupError
                    );
                }
            }

            setPhotoError(
                error?.message ||
                "Could not upload your photo. Please try again."
            );
        } finally {
            setUploadingPhoto(false);
        }
    };

    // All hooks above run on every render.
    if (loading || !auth.ready) {
        return React.createElement(
            "main",
            { className: "max-w-3xl mx-auto px-5 py-10" },
            "Loading your profile..."
        );
    }

    if (loadError || !me) {
        return React.createElement(
            "main",
            { className: "max-w-3xl mx-auto px-5 py-10" },
            loadError || "Please log in to view your profile."
        );
    }

    return React.createElement(
        "main",
        {
            className:
                "max-w-3xl mx-auto px-5 lg:px-8 py-10 md:py-14 pb-28 md:pb-14"
        },

        React.createElement(SectionHead, {
            title: "Your profile",
            sub: "Used to pre-fill enquiries and shape what we recommend."
        }),

        React.createElement(
            "form",
            {
                onSubmit: save,
                className: "space-y-8"
            },

            // Profile information.
            React.createElement(
                "div",
                { className: "rounded-2xl border border-line p-6" },

                React.createElement(
                    "div",
                    { className: "flex items-center gap-4" },

                    // Display the uploaded photo, or the existing fallback avatar.
                    me.avatarUrl
                        ? React.createElement("img", {
                            key: me.avatarUrl,
                            src: me.avatarUrl,
                            alt: "Profile photo",
                            className:
                                "w-16 h-16 rounded-full object-cover shrink-0",
                            onError: (event) => {
                                event.currentTarget.style.display = "none";
                            }
                        })
                        : React.createElement(Avatar, {
                            kind: me.avatarKind || "valley",
                            seed: me.avatarSeed || 5,
                            size: 64,
                            name: f.name || me.name
                        }),

                    React.createElement(
                        "div",
                        null,

                        React.createElement(
                            "input",
                            {
                                ref: fileInputRef,
                                type: "file",
                                accept: "image/jpeg,image/png,image/webp",
                                onChange: changePhoto,
                                disabled: uploadingPhoto,
                                className: "hidden"
                            }
                        ),

                        React.createElement(
                            "button",
                            {
                                type: "button",
                                disabled: uploadingPhoto,
                                onClick: () => {
                                    fileInputRef.current?.click();
                                },
                                className:
                                    "text-[13.5px] font-semibold underline " +
                                    "underline-offset-4 disabled:opacity-50 " +
                                    "disabled:cursor-not-allowed"
                            },
                            uploadingPhoto
                                ? "Uploading photo..."
                                : "Change photo"
                        ),

                        React.createElement(
                            "p",
                            {
                                className: "text-[12.5px] text-muted mt-1"
                            },
                            "JPG, PNG, or WebP · Maximum 2 MB"
                        ),

                        photoError && React.createElement(
                            "p",
                            {
                                role: "alert",
                                className: "text-sm text-red-600 mt-2"
                            },
                            photoError
                        )
                    )
                ),

                React.createElement(
                    "div",
                    {
                        className: "mt-6 grid sm:grid-cols-2 gap-4"
                    },

                    React.createElement(
                        Field,
                        { label: "Full name" },

                        React.createElement(Input, {
                            value: f.name,
                            onChange: event => setF(current => ({
                                ...current,
                                name: event.target.value
                            }))
                        })
                    ),

                    React.createElement(
                        Field,
                        { label: "Phone" },

                        React.createElement(Input, {
                            value: f.phone,
                            onChange: event => setF(current => ({
                                ...current,
                                phone: event.target.value
                            }))
                        })
                    ),

                    React.createElement(
                        Field,
                        {
                            label: "Email",
                            className: "sm:col-span-2"
                        },

                        React.createElement(Input, {
                            type: "email",
                            value: f.email,
                            disabled: true,
                            onChange: () => {}
                        })
                    )
                ),

                React.createElement(
                    "p",
                    {
                        className: "text-[12.5px] text-muted mt-3"
                    },
                    "Email changes are handled separately through account verification."
                )
            ),

            // Travel preferences.
            React.createElement(
                "div",
                { className: "rounded-2xl border border-line p-6" },

                React.createElement(
                    "h2",
                    {
                        className: "font-bold text-[17px] tracking-tight"
                    },
                    "Travel preferences"
                ),

                React.createElement(
                    "div",
                    { className: "mt-5 space-y-6" },

                    // Preferred destinations.
                    React.createElement(
                        "div",
                        null,

                        React.createElement(
                            "h3",
                            {
                                className:
                                    "text-[13px] font-bold tracking-[.1em] " +
                                    "text-muted mb-3"
                            },
                            "PREFERRED DESTINATIONS"
                        ),

                        React.createElement(
                            "div",
                            { className: "flex flex-wrap gap-2" },

                            DESTS.slice(0, 10).map(destination =>
                                React.createElement(
                                    Chip,
                                    {
                                        key: destination,
                                        active: (f.destinations || [])
                                            .includes(destination),
                                        onClick: () => toggleDest(destination)
                                    },
                                    destination
                                )
                            )
                        )
                    ),

                    // Trip types.
                    React.createElement(
                        "div",
                        null,

                        React.createElement(
                            "h3",
                            {
                                className:
                                    "text-[13px] font-bold tracking-[.1em] " +
                                    "text-muted mb-3"
                            },
                            "TRIP TYPES"
                        ),

                        React.createElement(
                            "div",
                            { className: "flex flex-wrap gap-2" },

                            CATEGORIES.map(category =>
                                React.createElement(
                                    Chip,
                                    {
                                        key: category,
                                        active: (f.types || [])
                                            .includes(category),
                                        onClick: () => toggleType(category)
                                    },
                                    category
                                )
                            )
                        )
                    ),

                    React.createElement(
                        "div",
                        { className: "grid sm:grid-cols-2 gap-4" },

                        React.createElement(
                            Field,
                            { label: "Usual budget per trip" },

                            React.createElement(Input, {
                                type: "number",
                                min: "0",
                                step: "500",
                                value: f.budget,
                                onChange: event => setF(current => ({
                                    ...current,
                                    budget: event.target.value
                                }))
                            })
                        ),

                        React.createElement(
                            Field,
                            { label: "Travel style" },

                            React.createElement(
                                Select,
                                {
                                    value: f.style || "Solo Friendly",
                                    onChange: event => setF(current => ({
                                        ...current,
                                        style: event.target.value
                                    }))
                                },

                                GROUPS.map(group =>
                                    React.createElement(
                                        "option",
                                        {
                                            key: group,
                                            value: group
                                        },
                                        group
                                    )
                                )
                            )
                        )
                    )
                )
            ),

            // Save errors.
            saveError && React.createElement(
                "p",
                {
                    role: "alert",
                    className: "text-sm text-red-600"
                },
                saveError
            ),

            // Form actions.
            React.createElement(
                "div",
                { className: "flex flex-wrap gap-3" },

                React.createElement(
                    Btn,
                    {
                        type: "submit",
                        size: "lg",
                        loading: saving,
                        disabled: saving || uploadingPhoto
                    },
                    saving ? "Saving..." : "Save changes"
                ),

                React.createElement(
                    Btn,
                    {
                        type: "button",
                        variant: "outline",
                        size: "lg",
                        icon: "logout",
                        onClick: async () => {
                            try {
                                await authService.logout();
                                go("/");
                                toast("Logged out");
                            } catch (error) {
                                console.error("Logout failed:", error);
                                setSaveError(
                                    "Could not log out. Please try again."
                                );
                            }
                        }
                    },
                    "Log out"
                )
            )
        )
    );
}
