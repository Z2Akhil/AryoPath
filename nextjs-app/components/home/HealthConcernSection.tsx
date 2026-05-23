import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Test from '@/lib/models/Test';
import { HEALTH_CONCERNS } from '@/lib/constants/healthConcerns';
import HealthConcernTabs from './HealthConcernTabs';

export type ConcernProduct = {
    code: string;
    name: string;
    type: string;
    category?: string;
    testCount?: number;
    fasting?: string;
    rate?: { b2C: number; offerRate?: number };
    sellingPrice?: number;
};

export type ConcernGroup = {
    id: string;
    label: string;
    icon: string;
    products: ConcernProduct[];
};

export default async function HealthConcernSection() {
    try {
        await connectToDatabase();

        const concernsData = await Promise.all(
            HEALTH_CONCERNS.map(async (concern) => {
                const filter = {
                    isActive: true,
                    'thyrocareData.category': { $regex: concern.regex, $options: 'i' },
                };

                const [profiles, tests] = await Promise.all([
                    Profile.find(filter).limit(5),
                    Test.find(filter).limit(5),
                ]);

                const mixed = [
                    ...profiles.map((p) => p.getCombinedData()),
                    ...tests.map((t) => t.getCombinedData()),
                ].slice(0, 8);

                const products: ConcernProduct[] = JSON.parse(JSON.stringify(mixed));

                return { id: concern.id, label: concern.label, icon: concern.icon, products };
            })
        );

        const active = concernsData.filter((c) => c.products.length > 0);
        if (active.length === 0) return null;

        return <HealthConcernTabs concerns={active} />;
    } catch {
        return null;
    }
}
