import { ShieldCheck, Truck, Award, Lock } from 'lucide-react';

const BADGES = [
  { Icon: ShieldCheck, label: 'Genuine Medicines', sub: '100% authentic products' },
  { Icon: Truck, label: 'Fast Delivery', sub: '3-5 business days' },
  { Icon: Award, label: 'Licensed Pharmacy', sub: 'Govt. licensed & regulated' },
  { Icon: Lock, label: 'Secure Payments', sub: 'Encrypted & safe checkout' },
];

interface Props {
  compact?: boolean;
}

export default function TrustBadges({ compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {BADGES.map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Icon className="h-4 w-4 text-teal-500 flex-shrink-0" />
            {label}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {BADGES.map(({ Icon, label, sub }) => (
        <div
          key={label}
          className="flex flex-col items-center text-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-teal-600" />
          </div>
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      ))}
    </div>
  );
}
