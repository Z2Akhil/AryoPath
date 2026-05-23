export const HEALTH_CONCERNS = [
    {
        id: 'thyroid',
        label: 'Thyroid',
        icon: '🦋',
        regex: 'THYROID',
        description: 'TSH, T3, T4, thyroid antibodies and thyroid function panels.',
        color: 'purple',
    },
    {
        id: 'diabetes',
        label: 'Diabetes',
        icon: '💉',
        regex: 'DIABETES',
        description: 'HbA1c, fasting glucose, insulin resistance and diabetic risk panels.',
        color: 'orange',
    },
    {
        id: 'heart',
        label: 'Heart Health',
        icon: '❤️',
        regex: 'CARDIAC|HEART HEALTH|HYPERTENSION',
        description: 'Lipid profile, cardiac enzymes, ECG markers and cardiovascular risk tests.',
        color: 'red',
    },
    {
        id: 'liver',
        label: 'Liver',
        icon: '🟤',
        regex: 'LIVER|HEPATITIS|PANCREATITIS',
        description: 'LFT, SGPT, SGOT, hepatitis markers, bilirubin and liver function tests.',
        color: 'amber',
    },
    {
        id: 'kidney',
        label: 'Kidney',
        icon: '🫘',
        regex: 'RENAL',
        description: 'KFT, creatinine, uric acid, eGFR and kidney function panels.',
        color: 'teal',
    },
    {
        id: 'blood',
        label: 'Blood & Anaemia',
        icon: '🩸',
        regex: 'ANAEMIA|IRON DEFICIENCY|HEMATOLOGY',
        description: 'CBC, iron studies, ferritin, haemoglobin and anaemia workup.',
        color: 'rose',
    },
    {
        id: 'infections',
        label: 'Infections',
        icon: '🦠',
        regex: 'INFECTION|TUBERCULOSIS|MALARIA|TYPHOID',
        description: 'Dengue, typhoid, malaria, tuberculosis and infection markers.',
        color: 'sky',
    },
    {
        id: 'wellness',
        label: 'Vitamins & Wellness',
        icon: '☀️',
        regex: 'WELLNESS|VITAMIN',
        description: 'Vitamin D, B12, folate, comprehensive wellness and full body checkup panels.',
        color: 'yellow',
    },
] as const;

export type HealthConcernId = (typeof HEALTH_CONCERNS)[number]['id'];
export const CONCERN_BY_ID = new Map(HEALTH_CONCERNS.map((c) => [c.id, c]));
