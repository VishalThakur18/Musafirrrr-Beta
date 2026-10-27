"use strict";

/**
 * Traveller payment summaries and finance CSV exports.
 * All figures are based on saved or explicitly supplied finance entries.
 * Refunds are tracked separately from payments.
 */

function TravellerPayments({ entries = [], trips = [], compact = false }) {
    const h = React.createElement;
    const m = FinanceModel;
    const rows = m.travellerPayments(entries);

    return h(
        "section",
        {
            className: compact
                ? "finance-traveller-section"
                : "finance-panel"
        },

        h(
            compact ? "h3" : "h2",
            null,
            "Payments by Traveller"
        ),

        h(
            "p",
            { className: "finance-help" },
            "Recorded payments and refunds for the current filters. Each traveller, trip and currency is kept separate. Missing records do not prove that a balance is unpaid."
        ),

        !rows.length
            ? h(
                  "p",
                  { className: "finance-help" },
                  "No traveller payment records for this selection."
              )
            : h(
                  "div",
                  { className: "finance-traveller-grid" },

                  rows.map(row =>
                      h(
                          "article",
                          {
                              key: row.key,
                              className: "finance-traveller-card"
                          },

                          h(
                              "h3",
                              null,
                              row.travellerName || "Traveller not linked"
                          ),

                          h(
                              "p",
                              { className: "finance-contact" },
                              row.travellerContact || "Contact not provided"
                          ),

                          h(
                              "p",
                              null,
                              m.tripLabel(row, trips)
                          ),

                          row.customTripId &&
                              h(
                                  "span",
                                  { className: "finance-badge" },
                                  "Custom trip"
                              ),

                          row.preview &&
                              h(
                                  "p",
                                  { className: "finance-unsaved" },
                                  "Includes unsaved preview entries"
                              ),

                          h(
                              "dl",
                              null,

                              h(
                                  "div",
                                  null,
                                  h("dt", null, "Payments recorded"),
                                  h(
                                      "dd",
                                      null,
                                      m.money(row.paid, row.currency)
                                  )
                              ),

                              h(
                                  "div",
                                  null,
                                  h("dt", null, "Refunds recorded"),
                                  h(
                                      "dd",
                                      null,
                                      m.money(row.refunded, row.currency)
                                  )
                              ),

                              h(
                                  "div",
                                  null,
                                  h("dt", null, "Payment entries"),
                                  h("dd", null, row.paymentCount)
                              ),

                              h(
                                  "div",
                                  null,
                                  h("dt", null, "Refund entries"),
                                  h("dd", null, row.refundCount)
                              )
                          ),

                          h(
                              "details",
                              null,

                              h(
                                  "summary",
                                  null,
                                  `View ${row.entries.length} recorded entries`
                              ),

                              row.entries.map(entry =>
                                  h(
                                      "p",
                                      {
                                          key: entry.id,
                                          className: "finance-help"
                                      },
                                      `${entry.date} · ${entry.type} · ${m.money(entry.amount, entry.currency)}`
                                  )
                              )
                          )
                      )
                  )
              )
    );
}

/**
 * Convert filtered entries to rows for a CSV report.
 * Private notes are intentionally excluded.
 */
function financeReportRows(entries = [], trips = [], type = "transactions") {
    const m = FinanceModel;

    if (type === "travellers") {
        return [
            [
                "Traveller",
                "Contact",
                "Trip",
                "Trip source",
                "Currency",
                "Payments recorded",
                "Refunds recorded",
                "Payment entry count",
                "Refund entry count",
                "Data status"
            ],

            ...m.travellerPayments(entries).map(row => [
                row.travellerName || "Not linked",
                row.travellerContact || "",
                m.tripLabel(row, trips),

                row.customTripId
                    ? "Custom"
                    : row.tripId
                      ? "Registered"
                      : "General",

                row.currency,

                row.paid ?? "",
                row.refunded ?? "",
                row.paymentCount,
                row.refundCount,

                row.preview
                    ? "Includes unsaved preview"
                    : "Organizer-reported"
            ])
        ];
    }

    return [
        [
            "Date",
            "Type",
            "Traveller",
            "Contact",
            "Trip",
            "Trip source",
            "Category",
            "Amount",
            "Currency",
            "External payment method",
            "Description",
            "Reference",
            "Data status"
        ],

        ...entries.map(entry => [
            entry.date,
            entry.type,
            entry.travellerName || "Not linked",
            entry.travellerContact || "",
            m.tripLabel(entry, trips),

            entry.customTripId
                ? "Custom"
                : entry.tripId
                  ? "Registered"
                  : "General",

            entry.category,
            entry.amount,
            entry.currency,
            entry.paymentMethod || "",
            entry.description || "",
            entry.referenceNumber || "",

            entry.preview
                ? "Not saved - preview"
                : "Organizer-reported"
        ])
    ];
}

/**
 * Export only the entries supplied by the page.
 * This component does not fetch or modify database records.
 */
function FinanceRecordExport({ entries = [], trips = [], filters }) {
    const h = React.createElement;

    const [type, setType] = useState("transactions");
    const [message, setMessage] = useState("");
    const [downloading, setDownloading] = useState(false);

    const rows = financeReportRows(entries, trips, type);

    const download = () => {
        if (downloading || rows.length < 2) return;

        let url = null;

        try {
            setDownloading(true);

            const blob = new Blob(
                [FinanceModel.csv(rows)],
                { type: "text/csv;charset=utf-8;" }
            );

            url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download =
                `finance-${type}-${FinanceModel.today()}.csv`;

            link.style.display = "none";

            document.body.appendChild(link);
            link.click();
            link.remove();

            setMessage(
                "CSV generated. It contains the records currently supplied to this report and does not change database records."
            );
        } catch (error) {
            console.error("Finance CSV export failed:", error);

            setMessage(
                "The CSV could not be generated. Please try again."
            );
        } finally {
            setDownloading(false);

            if (url) {
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            }
        }
    };

    const dates = filters
        ? FinanceModel.range(filters)
        : null;

    const tripLabel = filters?.tripId
        ? trips.find(trip => trip.id === filters.tripId)?.title ||
          "Selected trip"
        : "All trips";

    return h(
        "div",
        { className: "finance-export" },

        h(
            "p",
            { className: "finance-help" },
            "Export the transaction records currently supplied by the page. Traveller contact details are included; private notes are excluded."
        ),

        filters &&
            h(
                "p",
                { className: "finance-help" },
                `${dates[0]} to ${dates[1]} · ${filters.currency} · ${tripLabel}`
            ),

        h(
            "div",
            { className: "finance-transaction-tools" },

            h(
                "label",
                null,

                h("span", null, "Available report"),

                h(
                    "select",
                    {
                        id: "finance-report-type",
                        value: type,

                        onChange: event => {
                            setType(event.target.value);
                            setMessage("");
                        }
                    },

                    h(
                        "option",
                        { value: "transactions" },
                        "Financial transactions"
                    ),

                    h(
                        "option",
                        { value: "travellers" },
                        "Payments by traveller"
                    )
                )
            ),

            h(
                Btn,
                {
                    onClick: download,
                    disabled: downloading || rows.length < 2,
                    variant: "outline"
                },
                downloading ? "Preparing CSV…" : "Download filtered CSV"
            )
        ),

        rows.length < 2 &&
            h(
                "p",
                { className: "finance-help" },
                "No matching records are available to export."
            ),

        message &&
            h(
                "p",
                {
                    role: "status",
                    className: "finance-help"
                },
                message
            )
    );
}