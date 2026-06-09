import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund Policy',
    description: 'Refund and cancellation policy for Ayropath — lab tests, doctor consultations, and medicine orders.',
    openGraph: {
        title: 'Refund Policy | Ayropath',
        description: 'Refund and cancellation policy for Ayropath — lab tests, doctor consultations, and medicine orders.',
        type: 'website',
    },
    alternates: {
        canonical: '/refund-policy',
    },
};

function Section({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className={`text-xl font-semibold text-gray-800 mb-4 border-l-4 ${color} pl-3`}>{title}</h2>
            {children}
        </div>
    );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${color}`}>
            {children}
        </span>
    );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-gray-100 last:border-0">
            <span className="sm:w-56 text-sm font-semibold text-gray-600 shrink-0">{label}</span>
            <div>
                <span className="text-sm text-gray-800">{value}</span>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function RefundPolicyPage() {
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                Refund &amp; Cancellation <span className="text-red-600">Policy</span>
            </h1>
            <p className="text-gray-400 text-sm mb-10">Last Updated: June 2026</p>

            <div className="space-y-10 text-gray-700 text-base leading-relaxed">

                {/* Intro */}
                <p className="text-gray-600">
                    We want every experience on Ayropath to be smooth and fair. Below you will find the refund and
                    cancellation rules for each service we offer — <strong>Lab Tests</strong>, <strong>Doctor Consultations</strong>,
                    and <strong>Medicine Orders</strong>. Please read the section that applies to you.
                </p>

                {/* ── 1. Lab Tests ── */}
                <Section color="border-purple-500" title="1. Lab Tests (Thyrocare)">
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                        <p className="font-semibold text-purple-800 mb-1">No Refund after sample collection</p>
                        <p className="text-sm text-purple-700">
                            Lab test orders are fulfilled entirely by <strong>Thyrocare Technologies</strong>.
                            Once your sample has been collected by the phlebotomist, the testing process begins
                            immediately and cannot be reversed. For this reason, we do not offer refunds on lab test bookings.
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                        <Row label="Before sample collection" value="Contact support — we will try to reschedule or adjust your booking." />
                        <Row label="After sample collected" value="No refund. Testing has already started." />
                        <Row label="Phlebotomist doesn't arrive" value="Full refund or free reschedule." sub="Please report within 24 hours." />
                        <Row label="Duplicate payment" value="Full refund of the extra amount." sub="Usually within 5–7 business days." />
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                        For lab test related issues, please contact us at <strong>admin@ayropath.com</strong> or <strong>9973956949</strong>.
                    </p>
                </Section>

                {/* ── 2. Doctor Consultations ── */}
                <Section color="border-blue-500" title="2. Doctor Consultations">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                        <p className="font-semibold text-blue-800 mb-1">You can cancel up to 2 hours before your slot</p>
                        <p className="text-sm text-blue-700">
                            We understand plans change. You can cancel your appointment yourself from your account page
                            and get a full refund — as long as you cancel at least <strong>2 hours before</strong> the appointment time.
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
                        <Row
                            label="Cancel more than 2 hrs before"
                            value="✅ Full refund — automatically processed"
                            sub="Refund credited to original payment method within 5–7 business days."
                        />
                        <Row
                            label="Cancel within 2 hrs of slot"
                            value="❌ Not allowed — too close to appointment time"
                        />
                        <Row
                            label="You don't show up (confirmed slot)"
                            value="❌ No refund — appointment was confirmed by doctor"
                            sub="The slot was reserved for you and cannot be offered to anyone else."
                        />
                        <Row
                            label="Doctor/admin never confirmed & slot passes"
                            value="✅ Full refund — automatically processed"
                            sub="If no one confirmed your booking before the slot ended, you get a full refund."
                        />
                        <Row
                            label="Admin cancels your appointment"
                            value="✅ Full refund — automatically processed"
                        />
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-600">
                            <strong>How to cancel:</strong> Go to <em>My Account → Appointments</em> → click <em>Cancel</em> on the booking.
                            The refund starts immediately and should appear in your account within 5–7 business days.
                        </p>
                    </div>
                </Section>

                {/* ── 3. Medicine Orders ── */}
                <Section color="border-green-500" title="3. Medicine Orders">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                        <p className="font-semibold text-green-800 mb-1">Cancel before shipment or return within 7 days of delivery</p>
                        <p className="text-sm text-green-700">
                            You can cancel your medicine order anytime before it is shipped, or request a return within
                            7 days of receiving the delivery — and get a full refund.
                        </p>
                    </div>

                    <h3 className="font-semibold text-gray-700 mb-2 mt-4">Cancellation (before shipment)</h3>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-5">
                        <Row
                            label="Order status: Confirmed / Pending Prescription / Packed"
                            value="✅ Cancel anytime — full refund automatically processed"
                            sub="Go to My Orders → Cancel Order."
                        />
                        <Row
                            label="Order status: Shipped or later"
                            value="❌ Cannot cancel — order is already on its way"
                            sub="You can request a return after delivery instead."
                        />
                    </div>

                    <h3 className="font-semibold text-gray-700 mb-2">Returns (after delivery)</h3>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-5">
                        <Row
                            label="Within 7 days of delivery"
                            value="✅ Return accepted — full refund after we receive the item"
                            sub="Go to My Orders → Request Return. Our delivery partner will pick it up from your address."
                        />
                        <Row
                            label="After 7 days of delivery"
                            value="❌ Return window closed"
                        />
                        <Row
                            label="Item condition"
                            value="Items must be unused, sealed, and in original packaging."
                        />
                    </div>

                    <h3 className="font-semibold text-gray-700 mb-2">How the return &amp; refund works</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600 mb-4">
                        <li>You request a return from the order page.</li>
                        <li>Our team reviews and approves within 24–48 hours.</li>
                        <li>A Delhivery agent comes to your address for pickup (2–3 business days).</li>
                        <li>Once we receive and inspect the items, the refund is processed.</li>
                        <li>Money is credited to your original payment method within 5–7 business days.</li>
                    </ol>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-600">
                            <strong>Note:</strong> We do not accept returns on prescription medicines that have been opened.
                            If your order was cancelled by us, the refund is processed automatically — no action needed from your side.
                        </p>
                    </div>
                </Section>

                {/* ── Refund Timeline ── */}
                <Section color="border-orange-500" title="Refund Timeline">
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                        <Row label="Online payment (UPI / Card / Net Banking)" value="5–7 business days" sub="Depends on your bank processing time." />
                        <Row label="COD orders (cancelled before shipment)" value="No refund applicable" sub="No payment was collected at time of order." />
                        <Row label="COD orders (return after delivery)" value="Bank transfer within 5–7 business days" sub="Refund processed once we receive the returned item." />
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                        You will receive an email as soon as your refund is initiated. If you don&apos;t see it within 7 business
                        days, please contact your bank first, then reach out to us.
                    </p>
                </Section>

                {/* ── Contact ── */}
                <Section color="border-red-500" title="Need Help?">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-2">Ayropath Technologies</p>
                        <p className="text-sm text-gray-600">📧 Email: <a href="mailto:admin@ayropath.com" className="text-blue-600 underline">admin@ayropath.com</a></p>
                        <p className="text-sm text-gray-600">📞 Phone: <a href="tel:9973956949" className="text-blue-600 underline">9973956949</a></p>
                        <p className="text-sm text-gray-500 mt-2">Support available Mon–Sat, 9 AM – 6 PM IST.</p>
                    </div>
                </Section>

                {/* Footer note */}
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                    <p className="text-sm font-medium text-red-800">
                        By booking any service on Ayropath, you agree to this refund and cancellation policy.
                        This policy may be updated from time to time — the latest version is always available at ayropath.com/refund-policy.
                    </p>
                </div>

            </div>
        </section>
    );
}
