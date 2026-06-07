import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Privacy Policy for Ayropath — how we collect, use, and protect your personal and health information.',
    openGraph: {
        title: 'Privacy Policy | Ayropath',
        description: 'How Ayropath collects, uses, and protects your personal and health information.',
        type: 'website',
    },
    alternates: {
        canonical: '/privacy-policy',
    },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-l-4 border-red-600 pl-3">{title}</h2>
            {children}
        </div>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                Privacy <span className="text-red-600">Policy</span>
            </h1>
            <p className="text-gray-400 text-sm mb-10">Last Updated: June 2026</p>

            <div className="space-y-8 text-gray-700 text-base leading-relaxed">

                <p className="text-gray-600">
                    At <strong>Ayropath</strong>, we take your privacy seriously. This page explains what information
                    we collect when you use our platform, why we collect it, and how we protect it.
                    We keep this simple and clear — no confusing legal jargon.
                </p>

                {/* 1 */}
                <Section title="1. What Information We Collect">
                    <p className="mb-2">When you use Ayropath, we may collect the following:</p>

                    <h3 className="font-semibold text-gray-700 mb-1 mt-3">Account Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Name, phone number, email address, date of birth, gender</li>
                        <li>Password (stored encrypted — we never see it in plain text)</li>
                        <li>Profile photo (if you upload one)</li>
                    </ul>

                    <h3 className="font-semibold text-gray-700 mb-1 mt-3">Health &amp; Order Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Lab test bookings and results (shared with Thyrocare to process your tests)</li>
                        <li>Doctor consultation details — appointment date, time, and doctor assigned</li>
                        <li>Medicine orders — items purchased, delivery address, prescription (if required)</li>
                    </ul>

                    <h3 className="font-semibold text-gray-700 mb-1 mt-3">Payment Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>We do <strong>not</strong> store your card or bank details.</li>
                        <li>Payments are handled entirely by <strong>Cashfree Payments</strong>, which is PCI-DSS compliant.</li>
                        <li>We only store the payment reference ID (to track orders and process refunds).</li>
                    </ul>

                    <h3 className="font-semibold text-gray-700 mb-1 mt-3">Usage Data</h3>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Pages you visit, features you use, and time spent on the site</li>
                        <li>IP address, browser type, device type</li>
                        <li>This data helps us improve the platform and fix issues</li>
                    </ul>
                </Section>

                {/* 2 */}
                <Section title="2. Why We Collect It">
                    <p className="mb-2">We use your information only to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Fulfill your bookings — lab tests, consultations, medicine deliveries</li>
                        <li>Send you order confirmations, refund updates, and appointment reminders via email or SMS</li>
                        <li>Process payments and handle refunds through Cashfree</li>
                        <li>Coordinate delivery and returns with <strong>Delhivery</strong> (our courier partner)</li>
                        <li>Send OTPs for login and account verification (via SMS)</li>
                        <li>Respond to your support requests</li>
                        <li>Improve our platform based on how people use it</li>
                        <li>Meet legal and regulatory requirements</li>
                    </ul>
                    <p className="mt-2 text-sm text-gray-500">
                        We do <strong>not</strong> use your health data for advertising or sell it to any third party.
                    </p>
                </Section>

                {/* 3 */}
                <Section title="3. Who We Share Your Data With">
                    <p className="mb-2">We share data only when necessary to deliver the service:</p>

                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                        {[
                            { who: 'Thyrocare Technologies', why: 'To process your lab test bookings and deliver reports' },
                            { who: 'Cashfree Payments', why: 'To process online payments and initiate refunds' },
                            { who: 'Delhivery', why: 'To ship your medicine orders and handle reverse pickups (returns)' },
                            { who: 'Google (Gemini AI)', why: 'AI features on the platform (no personal health data is sent)' },
                            { who: 'Cloudinary', why: 'To store uploaded images (prescriptions, profile photos, site assets)' },
                            { who: 'Legal authorities', why: 'Only if required by law or court order' },
                        ].map(({ who, why }) => (
                            <div key={who} className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 px-4 border-b border-gray-100 last:border-0">
                                <span className="sm:w-52 text-sm font-semibold text-gray-700 shrink-0">{who}</span>
                                <span className="text-sm text-gray-600">{why}</span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                        We never sell your data. All third-party partners are bound by their own privacy policies and data protection agreements.
                    </p>
                </Section>

                {/* 4 */}
                <Section title="4. How We Protect Your Data">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>All data is transmitted over HTTPS (encrypted).</li>
                        <li>Passwords are hashed — we cannot read them.</li>
                        <li>Payment data never touches our servers — Cashfree handles it directly.</li>
                        <li>Database access is restricted to authorised team members only.</li>
                        <li>We use MongoDB Atlas (cloud-hosted, encrypted at rest) for our database.</li>
                    </ul>
                    <p className="mt-2 text-sm text-gray-500">
                        No system is 100% secure. If we ever detect a breach that affects your data, we will notify you promptly.
                    </p>
                </Section>

                {/* 5 */}
                <Section title="5. How Long We Keep Your Data">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Account data: kept for as long as your account is active.</li>
                        <li>Order and booking records: kept for a minimum of 3 years for legal and tax compliance.</li>
                        <li>OTP logs: deleted after 30 days.</li>
                        <li>If you delete your account, your personal details are anonymised within 30 days, but order records may be retained for legal requirements.</li>
                    </ul>
                </Section>

                {/* 6 */}
                <Section title="6. Your Rights">
                    <p className="mb-2">You have the right to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
                        <li><strong>Correct</strong> — update incorrect information in your profile.</li>
                        <li><strong>Delete</strong> — request deletion of your account and personal data (subject to legal retention requirements).</li>
                        <li><strong>Opt out</strong> — unsubscribe from marketing emails at any time using the link in our emails.</li>
                    </ul>
                    <p className="mt-2 text-sm text-gray-500">
                        To exercise any of these rights, email us at <a href="mailto:admin@ayropath.com" className="text-blue-600 underline">admin@ayropath.com</a>.
                        We will respond within 7 business days.
                    </p>
                </Section>

                {/* 7 */}
                <Section title="7. Cookies">
                    <p>
                        We use cookies and local storage to keep you logged in and remember your preferences.
                        We do not use third-party advertising cookies. You can clear cookies in your browser settings,
                        but this will log you out of your account.
                    </p>
                </Section>

                {/* 8 */}
                <Section title="8. Children's Privacy">
                    <p>
                        Ayropath is not intended for children under 18. We do not knowingly collect data from anyone under 18.
                        If you believe a minor has created an account, contact us and we will delete it promptly.
                    </p>
                </Section>

                {/* 9 */}
                <Section title="9. Links to Other Websites">
                    <p>
                        Our website may link to external sites (for example, Thyrocare&apos;s report portal).
                        We are not responsible for the privacy practices of those sites.
                        Please review their privacy policies before sharing any personal information.
                    </p>
                </Section>

                {/* 10 */}
                <Section title="10. Changes to This Policy">
                    <p>
                        We may update this Privacy Policy from time to time. When we do, we will update
                        the &quot;Last Updated&quot; date at the top. We encourage you to review this page periodically.
                        Continued use of Ayropath after changes means you accept the updated policy.
                    </p>
                </Section>

                {/* 11 */}
                <Section title="11. Contact Us">
                    <p className="mb-3">
                        Questions about this policy or how we handle your data? Reach us at:
                    </p>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-2">Ayropath Technologies</p>
                        <p className="text-sm text-gray-600">
                            Email: <a href="mailto:admin@ayropath.com" className="text-blue-600 underline">admin@ayropath.com</a>
                        </p>
                        <p className="text-sm text-gray-600">
                            Phone: <a href="tel:9973956949" className="text-blue-600 underline">9973956949</a>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Support: Mon–Sat, 9 AM – 6 PM IST</p>
                    </div>
                </Section>

                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                    <p className="text-sm font-medium text-red-800">
                        By using Ayropath, you agree to the collection and use of your information as described in this Privacy Policy.
                    </p>
                </div>

            </div>
        </section>
    );
}
