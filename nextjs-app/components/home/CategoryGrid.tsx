'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { useAuthModal } from "@/providers/AuthModalProvider";

const CATEGORIES = [
  { emoji: "🧪", label: "Lab Tests", sub: "Save up to 50%", href: "/tests", bg: "bg-blue-50", ring: "ring-blue-200" },
  { emoji: "📦", label: "Health Packages", sub: "From ₹499", href: "/profiles", bg: "bg-green-50", ring: "ring-green-200" },
  { emoji: "📋", label: "Upload", sub: "prescription", href: "/prescription", bg: "bg-rose-50", ring: "ring-rose-200", authGate: true },
  { emoji: "🩺", label: "Doctor Consult", sub: "Coming soon", href: "#", bg: "bg-purple-50", ring: "ring-purple-200", comingSoon: true },
  { emoji: "💊", label: "Medicines", sub: "Coming soon", href: "#", bg: "bg-orange-50", ring: "ring-orange-200", comingSoon: true },
  { emoji: "🎁", label: "Offers", sub: "Upto 60% off", href: "/offers", bg: "bg-yellow-50", ring: "ring-yellow-200" },
  { emoji: "📝", label: "Health Blogs", sub: "health stories", href: "/blog", bg: "bg-teal-50", ring: "ring-teal-200"},
];

type Category = typeof CATEGORIES[number] & { authGate?: boolean; comingSoon?: boolean };

const tileClass = (cat: Category) =>
  `flex flex-col items-center gap-2 p-3 rounded-2xl ring-1 shrink-0 w-24 md:w-auto text-center transition-all duration-200 ${cat.bg} ${cat.ring} ${
    cat.comingSoon ? "opacity-60 cursor-default" : "hover:scale-105 hover:shadow-md cursor-pointer"
  }`;

const TileInner = ({ cat }: { cat: Category }) => (
  <>
    <span className="text-3xl">{cat.emoji}</span>
    <span className="text-xs font-semibold text-gray-800 leading-tight">{cat.label}</span>
    <span className="text-[10px] text-gray-500 leading-tight">{cat.sub}</span>
  </>
);

export default function CategoryGrid() {
  const router = useRouter();
  const { user } = useUser();
  const { openAuth } = useAuthModal();

  // Upload-prescription tile requires login: logged-out → popup, logged-in → go to page.
  const handleAuthGated = (href: string) => {
    if (user) router.push(href);
    else openAuth();
  };

  return (
    <section className="px-4 mb-10">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-7 md:overflow-visible md:pb-0">
        {(CATEGORIES as Category[]).map((cat) => {
          if (cat.comingSoon) {
            return (
              <div key={cat.label} className={tileClass(cat)}>
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-xs font-semibold text-gray-700 leading-tight">{cat.label}</span>
                <span className="text-[10px] text-gray-400 leading-tight">{cat.sub}</span>
              </div>
            );
          }
          if (cat.authGate) {
            return (
              <button key={cat.label} type="button" onClick={() => handleAuthGated(cat.href)} className={tileClass(cat)}>
                <TileInner cat={cat} />
              </button>
            );
          }
          return (
            <Link key={cat.label} href={cat.href} className={tileClass(cat)}>
              <TileInner cat={cat} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
