import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Test from '@/lib/models/Test';
import { CONCERN_BY_ID } from '@/lib/constants/healthConcerns';

const SELECT = 'name type code customPricing thyrocareData.rate thyrocareData.testCount thyrocareData.fasting thyrocareData.category thyrocareData.imageLocation thyrocareData.imageMaster';

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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id     = searchParams.get('id') ?? '';
        const search = searchParams.get('search')?.trim() ?? '';

        const concern = CONCERN_BY_ID.get(id as any);
        if (!concern) {
            return NextResponse.json({ success: false, message: 'Unknown concern' }, { status: 400 });
        }

        await connectToDatabase();

        const filter: any = {
            isActive: true,
            'thyrocareData.category': { $regex: concern.regex, $options: 'i' },
        };
        if (search) filter.name = { $regex: search, $options: 'i' };

        const [profileDocs, testDocs] = await Promise.all([
            Profile.find(filter).select(SELECT).lean(),
            Test.find(filter).select(SELECT).lean(),
        ]);

        return NextResponse.json({
            success: true,
            profiles: profileDocs.map(serialize),
            tests: testDocs.map(serialize),
            totalCount: profileDocs.length + testDocs.length,
        });
    } catch (error) {
        console.error('Error fetching by-concern products:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
