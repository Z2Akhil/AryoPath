import type { Metadata } from 'next';
import { getSettingsServer } from '@/lib/api/settingsServer';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Terms of Service for Ayropath — terms and conditions for lab tests, doctor consultations, and medicine orders.',
    openGraph: {
        title: 'Terms of Service | Ayropath',
        description: 'Terms and conditions for using Ayropath health services.',
        type: 'website',
    },
    alternates: {
        canonical: '/terms-of-service',
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

export default async function TermsOfServicePage() {
    const settings = await getSettingsServer();
    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                Terms of <span className="text-red-600">Service</span>
            </h1>
            <p className="text-gray-400 text-sm mb-10">Last Updated: June 2026</p>

            <div className="space-y-8 text-gray-700 text-base leading-relaxed">

                <p className="text-gray-600">
                    Welcome to <strong>Ayropath</strong>. By using our website or placing any order,
                    you agree to these terms. Please read them carefully. If you do not agree, do not use our services.
                </p>

                <Section title="1. Who We Are">
                    <p>
                        Ayropath is an online health platform offering three services:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li><strong>Lab Tests</strong> — booked through and fulfilled entirely by <strong>Thyrocare Technologies Ltd</strong>, a NABL &amp; CAP-accredited laboratory.</li>
                        <li><strong>Doctor Consultations</strong> — online video or audio appointments with registered medical professionals.</li>
                        <li><strong>Medicine Orders</strong> — purchase and doorstep delivery of medicines and health products.</li>
                    </ul>
                </Section>

                <Section title="2. Eligibility">
                    <p>
                        You must be at least <strong>18 years old</strong> to create an account and place orders.
                        By using our services you confirm that the information you provide is accurate and complete.
                        You are responsible for all activity on your account.
                    </p>
                </Section>

                <Section title="3. Account &amp; Login">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>You can sign up with your phone number (OTP) or email address.</li>
                        <li>Keep your login details confidential. You are responsible for any activity under your account.</li>
                        <li>Notify us immediately at <a href="mailto:admin@ayropath.com" className="text-blue-600 underline">admin@ayropath.com</a> if you suspect unauthorised access.</li>
                        <li>We reserve the right to suspend accounts involved in fraud or misuse.</li>
                    </ul>
                </Section>

                <Section title="4. Lab Tests (Thyrocare)">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Lab test bookings are processed and fulfilled by Thyrocare. Ayropath is the booking interface.</li>
                        <li>You must ensure someone is available at the given address during the scheduled slot for sample collection.</li>
                        <li>Test reports are delivered digitally, usually within the turnaround time mentioned on the test page.</li>
                        <li>Results are for informational purposes only. Always consult a qualified doctor before making medical decisions.</li>
                        <li>Ayropath is not responsible for delays or errors in sample collection or report generation attributable to Thyrocare.</li>
                    </ul>
                </Section>

                <Section title="5. Doctor Consultations">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Consultations are conducted online via video or audio call at the booked time slot.</li>
                        <li>Doctors are independent medical professionals. Ayropath provides the booking and payment platform only.</li>
                        <li>You must be ready at the scheduled time. Missing your slot without prior cancellation forfeits your fee.</li>
                        <li>Advice given during a consultation does not replace in-person medical examination or emergency care.</li>
                        <li>Cancellations are allowed up to <strong>2 hours before</strong> the appointment. See our <a href="/refund-policy" className="text-blue-600 underline">Refund Policy</a> for details.</li>
                    </ul>
                </Section>

                <Section title="6. Medicine Orders">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>All orders are subject to product availability.</li>
                        <li>Prescription medicines require a valid prescription uploaded at checkout. We may cancel orders if prescriptions are invalid or missing.</li>
                        <li>Delivery is handled by <strong>Delhivery</strong>. Estimated delivery times are indicative and may vary.</li>
                        <li>You may cancel before shipment or request a return within 7 days of delivery. See our <a href="/refund-policy" className="text-blue-600 underline">Refund Policy</a> for details.</li>
                        <li>We offer Cash on Delivery (COD) for medicine orders. COD orders are confirmed immediately. If you cancel a COD order before shipment, no refund is applicable as no payment was collected. For returns after delivery, a refund will be issued once the item is received by us.</li>
                    </ul>
                </Section>

                <Section title="7. Payments">
                    <ul className="list-disc pl-6 space-y-1">
                        <li>All prices are in Indian Rupees (₹) and include applicable taxes.</li>
                        <li>Payments are processed securely by <strong>Cashfree Payments</strong>. We accept UPI, debit/credit cards, and net banking.</li>
                        <li>Ayropath does not store your card or bank details — they are handled entirely by Cashfree.</li>
                        <li>Prices may change without notice. The price shown at checkout is the final amount you pay.</li>
                    </ul>
                </Section>

                <Section title="8. Cancellations &amp; Refunds">
                    <p>
                        Our full cancellation and refund rules are in the <a href="/refund-policy" className="text-blue-600 underline">Refund Policy page</a>.
                        In summary:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Lab tests: no refund after sample collection.</li>
                        <li>Consultations: full refund if cancelled more than 2 hours before the slot.</li>
                        <li>Medicine orders: full refund if cancelled before shipment; returns accepted within 7 days of delivery.</li>
                        <li>Refunds are credited to the original payment method within 5–7 business days.</li>
                    </ul>
                </Section>

                <Section title="9. Medical Disclaimer">
                    <p>
                        Ayropath is a platform for health services — we are <strong>not a hospital or a pharmacy</strong>.
                        Content on our website, including lab test descriptions and doctor profiles, is for general information only.
                        Do not delay or ignore professional medical advice because of something you read on our site.
                        In a medical emergency, contact emergency services immediately.
                    </p>
                </Section>

                <Section title="10. Intellectual Property">
                    <p>
                        All content on Ayropath — text, images, logos, code — belongs to Ayropath Technologies
                        or its licensors. You may not copy, reproduce, or resell any part without written permission.
                    </p>
                </Section>

                <Section title="11. Limitation of Liability">
                    <p className="mb-2">To the extent permitted by law, Ayropath is not liable for:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Indirect or consequential losses arising from use of our services.</li>
                        <li>Medical decisions made based on lab results or doctor consultations on our platform.</li>
                        <li>Delivery delays or damage caused by Delhivery (our courier partner).</li>
                        <li>Payment failures or delays caused by Cashfree or your bank.</li>
                        <li>Service interruptions caused by Thyrocare or other third-party providers.</li>
                    </ul>
                </Section>

                <Section title="12. Governing Law">
                    <p>
                        These terms are governed by the laws of India. Any dispute will be subject to
                        the jurisdiction of courts in <strong>Jharkhand, India</strong>.
                    </p>
                </Section>

                <Section title="13. Changes to These Terms">
                    <p>
                        We may update these terms from time to time. Changes take effect when posted on this page.
                        Your continued use of Ayropath after a change means you accept the updated terms.
                        The latest version is always at <strong>ayropath.com/terms-of-service</strong>.
                    </p>
                </Section>

                <Section title="14. Contact Us">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-2">Ayropath Technologies</p>
                        {settings?.email && (
                            <p className="text-sm text-gray-600">
                                Email: <a href={`mailto:${settings.email}`} className="text-blue-600 underline">{settings.email}</a>
                            </p>
                        )}
                        {settings?.helplineNumber && (
                            <p className="text-sm text-gray-600">
                                Phone: <a href={`tel:${settings.helplineNumber}`} className="text-blue-600 underline">{settings.helplineNumber}</a>
                            </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">Support: Mon–Sat, 9 AM – 6 PM IST</p>
                    </div>
                </Section>

                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                    <p className="text-sm font-medium text-red-800">
                        By using Ayropath, you confirm that you have read, understood, and agreed to these Terms of Service.
                    </p>
                </div>

            </div>
        </section>
    );
}
