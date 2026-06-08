import { Metadata } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Test from '@/lib/models/Test';
import TestsPageClient from './TestsPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Book Individual Lab Tests Online – Single Blood Tests at Home | Ayropath',
    description: 'Book individual Thyrocare lab tests online with free home sample collection. CBC, thyroid, HbA1c, Vitamin D, liver, kidney, uric acid tests and more. NABL accredited labs, digital reports in 24–48 hrs.',
    keywords: [
        // Individual test keywords
        'CBC test at home', 'blood test price India', 'thyroid test TSH', 'TSH T3 T4 test online',
        'HbA1c test home collection', 'Vitamin D test price', 'Vitamin B12 test', 'iron deficiency test',
        'uric acid test online', 'creatinine test at home', 'SGOT SGPT liver test',
        'cholesterol test home collection', 'triglycerides test', 'fasting glucose test',
        // Generic individual test keywords
        'thyrocare individual tests', 'blood test online India', 'lab test booking',
        'thyroid test home collection', 'diabetes test online', 'single blood test at home',
        'liver function test individual', 'kidney function test online', 'NABL lab test India',
        'diagnostic test booking India', 'affordable blood test', 'book test online',
    ],
    openGraph: {
        title: 'Book Individual Lab Tests Online – Single Blood Tests | Ayropath',
        description: 'Book CBC, thyroid, Vitamin D, HbA1c, liver, kidney and other individual tests online with free home collection. NABL accredited.',
        type: 'website',
        siteName: 'Ayropath',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Individual Lab Tests at Home | Ayropath',
        description: 'Book CBC, thyroid, HbA1c, Vitamin D and other individual tests online. Free home collection.',
    },
    alternates: { canonical: '/tests' },
};

interface TestsPageProps {
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

export default async function TestsPage({ limit, showHeader, mobileScroll }: TestsPageProps) {
    await connectToDatabase();

    const fetchLimit = limit || 20;

    const isHomeWidget = !!limit;
    const SELECT = 'name type code customPricing thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category imageLocation thyrocareData.imageLocation imageMaster thyrocareData.imageMaster isFeatured featuredOrder';

    let testDocs: any[];
    const totalCount = await Test.countDocuments({ isActive: true });

    if (isHomeWidget) {
        // Fetch ALL featured items (no limit) so the home page count matches admin
        testDocs = await Test.find({ isActive: true, isFeatured: true })
            .select(SELECT).sort({ featuredOrder: 1 }).lean();
        if (testDocs.length === 0) {
            testDocs = await Test.find({ isActive: true })
                .select(SELECT).sort({ name: 1 }).limit(fetchLimit).lean();
        }
    } else {
        testDocs = await Test.find({ isActive: true })
            .select(SELECT).sort({ name: 1 }).limit(fetchLimit).lean();
    }

    const initialData = testDocs.map((t: any) => ({
        code: t.code,
        name: t.name,
        type: t.type,
        sellingPrice: t.customPricing?.sellingPrice || t.thyrocareData?.rate?.b2C || 0,
        rate: {
            b2C: t.thyrocareData?.rate?.b2C || 0,
            offerRate: t.thyrocareData?.rate?.offerRate || 0,
        },
        testCount: t.thyrocareData?.testCount || 0,
        fasting: t.thyrocareData?.fasting || '',
        category: t.thyrocareData?.category || '',
        imageLocation: t.imageLocation || null,
        imageMaster: t.imageMaster ? JSON.parse(JSON.stringify(t.imageMaster)) : null,
        thyrocareData: t.thyrocareData ? { 
            imageLocation: t.thyrocareData.imageLocation || null,
            imageMaster: t.thyrocareData.imageMaster ? JSON.parse(JSON.stringify(t.thyrocareData.imageMaster)) : null
        } : null,
        isActive: t.isActive,
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ayropath.com';
    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Individual Lab Tests',
        description: 'Individual Thyrocare diagnostic tests available for online booking at Ayropath',
        numberOfItems: totalCount,
        itemListElement: initialData.slice(0, 10).map((test, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: test.name,
            url: `${siteUrl}/profiles/${test.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}/${test.type}/${test.code}`,
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />
            <TestsPageClient initialData={initialData as any} initialTotal={totalCount} limit={limit} showHeader={showHeader} mobileScroll={mobileScroll} />
        </>
    );
}
