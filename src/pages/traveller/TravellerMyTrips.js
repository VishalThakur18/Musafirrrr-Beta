"use strict";
/* ============================================================
   PAGE — TRAVELLER MY TRIPS (#/traveller/my-trips)
   ============================================================ */

/** Traveller's enquiries loaded from Supabase. */
function TravellerMyTrips() {
    const s = useStore();
    const { user: me, ready } = useAuth();

    const [tab, setTab] = useState('open');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadEnquiries() {
            if (!ready) return;

            if (!me || me.role !== 'TRAVELLER') {
                if (!cancelled) {
                    setRows([]);
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            setLoadError('');

            try {
                const enquiries =
                    await enquiryService.forTravellerFromDb(me.id);

                if (!cancelled) {
                    setRows(
                        enquiries.map(e => ({
                            e,
                            t: e.trip
                        })).filter(x => x.t)
                    );
                }
            } catch (error) {
                console.error(
                    'Failed to load traveller enquiries:',
                    error
                );

                if (!cancelled) {
                    setLoadError(
                        'Could not load your enquiries. Please try again.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadEnquiries();

        return () => {
            cancelled = true;
        };
    }, [me && me.id, me && me.role, ready]);

    const list = rows.filter(({ e, t }) =>
        tab === 'open'
            ? e.status !== 'CANCELLED' && t.status !== 'COMPLETED'
            : e.status === 'CANCELLED' || t.status === 'COMPLETED'
    );

    return (
        React.createElement(
            "main",
            {
                className:
                    "max-w-shell mx-auto px-5 lg:px-8 py-10 md:py-14 pb-28 md:pb-14"
            },

            React.createElement(SectionHead, {
                title: "My trips",
                sub: "Every trip you've enquired about, and where it stands."
            }),

            React.createElement(
                "div",
                {
                    className: "border-b border-line flex gap-6 mb-7"
                },
                [['open', 'Open'], ['past', 'Past & cancelled']].map(
                    ([value, label]) =>
                        React.createElement(
                            "button",
                            {
                                key: value,
                                onClick: () => setTab(value),
                                className: cls(
                                    'pb-3 text-[15px] font-semibold border-b-2 -mb-px',
                                    tab === value
                                        ? 'border-ink text-ink'
                                        : 'border-transparent text-muted hover:text-slatey'
                                )
                            },
                            label
                        )
                )
            ),

            !ready || loading
                ? React.createElement(
                    "div",
                    {
                        className: "py-12 text-center text-slatey"
                    },
                    "Loading your enquiries..."
                )

                : !me || me.role !== 'TRAVELLER'
                    ? React.createElement(EmptyState, {
                        title: "Sign in to view your enquiries",
                        body: "Sign in to your traveller account to see the trips you've enquired about.",
                        action: React.createElement(
                            Btn,
                            {
                                onClick: () => go('/login')
                            },
                            "Sign in"
                        )
                    })

                    : loadError
                        ? React.createElement(EmptyState, {
                            title: "Couldn't load enquiries",
                            body: loadError,
                            action: React.createElement(
                                Btn,
                                {
                                    onClick: () => window.location.reload()
                                },
                                "Try again"
                            )
                        })

                        : list.length === 0
                            ? React.createElement(EmptyState, {
                                icon: "bag",
                                title: tab === 'open'
                                    ? 'Nothing booked yet'
                                    : 'Nothing here',
                                body: tab === 'open'
                                    ? 'Find a trip, send an enquiry, and track it from this page.'
                                    : 'Past and cancelled enquiries will collect here.',
                                action: React.createElement(
                                    Btn,
                                    {
                                        onClick: () => go('/explore')
                                    },
                                    "Explore trips"
                                )
                            })

                            : React.createElement(
                                "div",
                                {
                                    className: "grid gap-4 md:grid-cols-2"
                                },
                                list.map(({ e, t }) =>
                                    React.createElement(
                                        EnquiryRowTraveller,
                                        {
                                            key: e.id,
                                            e,
                                            t
                                        }
                                    )
                                )
                            )
        )
    );
}