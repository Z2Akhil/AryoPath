import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Test from '@/lib/models/Test';
import { CONCERN_BY_ID, HEALTH_CONCERNS } from '@/lib/constants/healthConcerns';
import HealthConcernPageClient from './HealthConcernPageClient';

export const revalidate = 3600;

const SELECT = 'name type code customPricing customImage thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category thyrocareData.imageLocation thyrocareData.imageMaster';

function serialize(doc: any) {
    return {
        code: doc.code,
        name: doc.name,
        type: doc.type,
        sellingPrice: doc.customPricing?.sellingPrice || doc.thyrocareData?.rate?.b2C || 0,
        rate: {
            b2C: doc.thyrocareData?.rate?.b2C || 0,
            offerRate: doc.thyrocareData?.rate?.offerRate || 0,
        },
        testCount: doc.thyrocareData?.testCount || 0,
        fasting: doc.thyrocareData?.fasting || '',
        category: doc.thyrocareData?.category || '',
        customImage: doc.customImage?.url ? { url: doc.customImage.url, publicId: doc.customImage.publicId } : null,
        thyrocareData: doc.thyrocareData
            ? {
                  imageLocation: doc.thyrocareData.imageLocation || null,
                  imageMaster: doc.thyrocareData.imageMaster
                      ? JSON.parse(JSON.stringify(doc.thyrocareData.imageMaster))
                      : null,
              }
            : null,
    };
}

export async function generateStaticParams() {
    return HEALTH_CONCERNS.map((c) => ({ id: c.id }));
}

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await params;
    const concern = CONCERN_BY_ID.get(id as any);
    if (!concern) return {};
    return {
        title: `${concern.label} Tests & Health Packages – Book Online | Ayropath`,
        description: `Book ${concern.label.toLowerCase()} tests and health packages online with free home sample collection. ${concern.description} NABL accredited labs, digital reports in 24–48 hrs.`,
        alternates: { canonical: `/health-concern/${id}` },
        openGraph: {
            title: `${concern.label} Tests & Packages | Ayropath`,
            description: `${concern.description} Free home collection. NABL accredited.`,
            type: 'website',
            siteName: 'Ayropath',
            locale: 'en_IN',
        },
    };
}

export default async function HealthConcernPage(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const concern = CONCERN_BY_ID.get(id as any);
    if (!concern) notFound();

    await connectToDatabase();

    const categoryFilter = { $regex: concern.regex, $options: 'i' };
    const query = { isActive: true, 'thyrocareData.category': categoryFilter };

    const [profileDocs, testDocs] = await Promise.all([
        Profile.find(query).select(SELECT).lean(),
        Test.find(query).select(SELECT).lean(),
    ]);

    return (
        <HealthConcernPageClient
            concern={{
                id: concern.id,
                label: concern.label,
                icon: concern.icon,
                description: concern.description,
            }}
            initialProfiles={profileDocs.map(serialize) as any}
            initialTests={testDocs.map(serialize) as any}
        />
    );
}
