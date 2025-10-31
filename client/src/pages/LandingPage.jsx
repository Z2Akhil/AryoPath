import { dummyCatalogData } from '../data/dummyData';

import Hero from '../sections/Hero';
import HomeCarousel from '../sections/HomeCarousel';
import PackagePage from './PackagePage';
import OfferPage from './OfferPage';
import TestPage from './TestPage';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const offers = dummyCatalogData.master.offer;
  const packages = dummyCatalogData.master.profile;
  const tests = dummyCatalogData.master.tests;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Hero />

      {/* Packages Section */}
      <div className="mb-8">
        <PackagePage limit={4} packages={packages} />
        <div className="text-right ">
          <Link to="/packages" className="text-blue-600 hover:underline font-medium">
            See More
          </Link>
        </div>
      </div>

      {/* Offers Section */}
      <div className="mb-8">
        <OfferPage limit={8} offers={offers} />
        <div className="text-right">
          <Link to="/offers" className="text-blue-600 hover:underline font-medium">
            See More
          </Link>
        </div>
      </div>

      {/* Tests Section */}
      <div className="mb-8">
        <TestPage limit={8} tests={tests} />
        <div className="text-right">
          <Link to="/tests" className="text-blue-600 hover:underline font-medium">
            See More
          </Link>
        </div>
      </div>
      <HomeCarousel />
    </div>
  );
};

export default LandingPage;
