import { Metadata } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import ProfilesPageClient from './ProfilesPageClient';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
    title: 'Health Checkup Packages – Full Body & Thyrocare Profiles | Ayropath',
    description: 'Browse Thyrocare health checkup packages online with free home sample collection. Full body checkups, Aarogyam profiles, diabetes screening, thyroid panels and more. NABL accredited labs, digital reports in 24–48 hrs. Starting ₹499.',
    keywords: [
        // Core package keywords
        'health checkup packages', 'full body checkup packages India', 'Thyrocare profiles',
        'Aarogyam packages', 'Aarogyam 1.1', 'Aarogyam C', 'Aarogyam B',
        'Aarogyam Male', 'Aarogyam Female', 'Thyrocare Aarogyam discount',
        // Condition keywords
        'full body checkup online', 'diabetes screening package', 'thyroid profile test',
        'cardiac risk profile', 'liver function test package', 'kidney function test package',
        // Intent keywords
        'preventive health checkup', 'affordable health test India', 'best health package under 1000',
        'health package under 999', 'health checkup under 2000',
        // Trust keywords
        'home sample collection', 'NABL accredited lab', 'book health test online India',
        'free home collection blood test', 'Thyrocare authorised partner',
    ],
    openGraph: {
        title: 'Health Checkup Packages – Full Body & Thyrocare Profiles | Ayropath',
        description: 'Browse Thyrocare health packages online. Full body checkups, Aarogyam profiles and more with free home collection. NABL accredited.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Health Checkup Packages | Thyrocare Profiles – Ayropath',
        description: 'Browse Thyrocare health packages online with free home collection. Starting ₹499.',
    },
    alternates: { canonical: '/profiles' },
};

interface ProfilesPageProps {
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

export default async function ProfilesPage({ limit, showHeader, mobileScroll }: ProfilesPageProps) {
    await connectToDatabase();

    const fetchLimit = limit || 12;

    const isHomeWidget = !!limit;
    const SELECT = 'name type code customPricing thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category imageLocation thyrocareData.imageLocation imageMaster thyrocareData.imageMaster isFeatured featuredOrder';

    let profileDocs: any[];
    const totalCount = await Profile.countDocuments({ isActive: true });

    if (isHomeWidget) {
        profileDocs = await Profile.find({ isActive: true, isFeatured: true })
            .select(SELECT).sort({ featuredOrder: 1 }).limit(fetchLimit).lean();
        if (profileDocs.length === 0) {
            profileDocs = await Profile.find({ isActive: true })
                .select(SELECT).sort({ 'thyrocareData.bookedCount': -1 }).limit(fetchLimit).lean();
        }
    } else {
        profileDocs = await Profile.find({ isActive: true })
            .select(SELECT).sort({ 'thyrocareData.bookedCount': -1 }).limit(fetchLimit).lean();
    }

    // Serialize to plain objects compatible with Product type
    const initialData = profileDocs.map((p: any) => ({
        code: p.code,
        name: p.name,
        type: p.type,
        sellingPrice: p.customPricing?.sellingPrice || p.thyrocareData?.rate?.b2C || 0,
        rate: {
            b2C: p.thyrocareData?.rate?.b2C || 0,
            offerRate: p.thyrocareData?.rate?.offerRate || 0,
        },
        testCount: p.thyrocareData?.testCount || 0,
        fasting: p.thyrocareData?.fasting || '',
        category: p.thyrocareData?.category || '',
        imageLocation: p.imageLocation || null,
        imageMaster: p.imageMaster ? JSON.parse(JSON.stringify(p.imageMaster)) : null,
        thyrocareData: p.thyrocareData ? { 
            imageLocation: p.thyrocareData.imageLocation || null,
            imageMaster: p.thyrocareData.imageMaster ? JSON.parse(JSON.stringify(p.thyrocareData.imageMaster)) : null
        } : null,
        isActive: p.isActive,
    }));

    // ItemList JSON-LD for listing page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Health Checkup Packages',
        description: 'Thyrocare health checkup profiles available for online booking at Ayropath',
        numberOfItems: totalCount,
        itemListElement: initialData.slice(0, 10).map((pkg, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: pkg.name,
            url: `${siteUrl}/profiles/${pkg.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}/${pkg.type}/${pkg.code}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <ProfilesPageClient initialData={initialData as any} initialTotal={totalCount} limit={limit} showHeader={showHeader} mobileScroll={mobileScroll} />
        </>
    );
}
