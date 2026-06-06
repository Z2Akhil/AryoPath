'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  logo?: string;
  loading?: boolean;
}

const LogoSkeleton = () => (
  <div className="flex items-center gap-3 animate-pulse">
    <div className="w-10 h-10 bg-gray-200 rounded-full" />
    <div>
      <div className="h-5 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-28 bg-gray-200 rounded mt-1" />
    </div>
  </div>
);

export const Logo = ({ logo, loading }: LogoProps) => {
  const [imgError, setImgError] = useState(false);

  if (loading) return <LogoSkeleton />;

  // Old backend stored logos as /uploads/xxx — prefix with backend URL
  const resolvedLogo = logo?.startsWith('/uploads/')
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${logo}`
    : logo;
  const logoSrc = !imgError && resolvedLogo ? resolvedLogo : '/logo-120.webp';

  return (
    <Link href="/" className="flex items-center group cursor-pointer" aria-label="Ayropath Home">
      <div className="flex items-center gap-2">
        <Image
          src={logoSrc}
          width={120}
          height={120}
          alt="Company Logo"
          className="w-15 h-15 object-contain rounded-full"
          onError={() => setImgError(true)}
          priority
        />
      </div>

      <div className="leading-tight">
        <Image
          src="/Thyrocare-280.webp"
          width={240}
          height={82}
          alt="In association with ThyroCare"
          className="h-12 w-auto object-contain mt-1"
          priority
        />
      </div>
    </Link>
  );
};