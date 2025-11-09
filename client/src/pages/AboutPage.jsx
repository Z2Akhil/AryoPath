const AboutPage = () => {
  return (
    <>
      {/* ====== ABOUT SECTION ====== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className=" mb-5">
          <h2 className="text-3xl sm:text-3xl font-bold text-gray-800 mb-4">
            About <span className="text-red-600">Aryopath</span>
          </h2>
        </div>

        <p className="text-gray-700 text-base sm:text-lg leading-relaxed text-justify">
          Aryopath Technologies Limited stands as India’s foremost automated
          laboratory, renowned for its unwavering commitment to quality and
          affordability in diagnostic services. In collaboration with
          <span className="font-semibold"> Thyrocare Technologies Limited</span>,
          one of India’s most advanced and reputed automated laboratories,
          Aryopath ensures that every test meets the highest standards of
          precision, reliability, and global quality.
          <br />
          <br />
          By leveraging Thyrocare’s NABL and CAP-accredited laboratory network
          along with Aryopath’s innovation-driven digital systems, efficient
          logistics, and customer-first approach, we deliver fast, dependable,
          and affordable diagnostic solutions across India. Offering a
          comprehensive test profile menu and rapid turnaround times, Aryopath’s
          focus on preventive care and cost-effective solutions sets new
          industry benchmarks.
          <br />
          <br />
          Its dedication to integrating cutting-edge technology with a
          human-centric approach underscores its mission to standardize quality
          and accessibility in laboratory services globally.
        </p>
      </section>

      {/* ====== IMAGE SECTION ====== */}
      <section className="w-full bg-gray-50 py-10 px-6 text-gray-800 flex justify-center">
        <img
          src="/labNetwork.png"
          alt="Lab Network Map"
          className="rounded-lg w-full max-w-5xl object-cover shadow-md"
        />
      </section>

      {/* ====== VISION & MISSION ====== */}
      <section className="bg-white py-16 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 border-l-4 border-red-600 pl-3">
              Our Vision
            </h3>
            <p className="text-gray-700 text-justify leading-relaxed">
              To revolutionize healthcare diagnostics through technology-driven
              automation, ensuring every individual—no matter where they
              are—has access to affordable, precise, and timely health testing.
            </p>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 border-l-4 border-red-600 pl-3">
              Our Mission
            </h3>
            <p className="text-gray-700 text-justify leading-relaxed">
              To build a future-ready diagnostic ecosystem by integrating
              world-class laboratory excellence, advanced logistics, and
              customer-focused digital platforms that empower preventive
              healthcare and accessible diagnostics for all.
            </p>
          </div>
        </div>
      </section>

      {/* ====== LAB SECTION ====== */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Our <span className="text-red-600">Lab</span>
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            {/* Video 1 */}
            <div className="w-full md:w-1/2">
              <iframe
                className="w-full h-64 sm:h-72 md:h-80 rounded-lg shadow-lg"
                src="https://www.youtube.com/embed/E3yK57e_PV8"
                title="Thyrocare - India's Largest Lab"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Video 2 */}
            <div className="w-full md:w-1/2">
              <iframe
                className="w-full h-64 sm:h-72 md:h-80 rounded-lg shadow-lg"
                src="https://www.youtube.com/embed/njMgF-DK7lA"
                title="Jaanch - A Brand by Thyrocare"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
