import { NextRequest, NextResponse } from 'next/server';
import { ThyrocareService } from '@/lib/services/thyrocare';
import axios from 'axios';

const THYROCARE_BASE_URL = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ pincode: string }> }
) {
    try {
        const { pincode } = await params;

        if (!pincode) {
            return NextResponse.json({ success: false, error: 'Pincode is required' }, { status: 400 });
        }

        const data = await ThyrocareService.makeRequest(async (apiKey) => {
            const response = await axios.post(`${THYROCARE_BASE_URL}/api/TechsoApi/PincodeAvailability`, {
                ApiKey: apiKey,
                Pincode: pincode
            });
            return response.data;
        });

        return NextResponse.json({
            success: true,
            serviceable: data?.status === 'Y',
            data,
        });

    } catch (error: any) {
        console.error('Pincode check error:', error);
        return NextResponse.json({
            success: false,
            error: error.response?.data || error.message || 'Failed to check pincode'
        }, { status: 500 });
    }
}
