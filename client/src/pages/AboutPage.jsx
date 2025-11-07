// this is the about page 
// client want to copy this page from this website 
// link:-www.bookmytest.co.in
// only for the about page 

const AboutPage = () => {
    return (
        <>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">
            About Aryopath
          </h2>
          <p className="text-gray-800 text-base leading-relaxed text-justify">
            Aryopath Technologies Limited stands as India’s foremost automated
            laboratory, renowned for its unwavering commitment to quality and
            affordability in diagnostic services. In collaboration with
            <span className="font-semibold"> Thyrocare Technologies Limited</span>,
            one of India’s most advanced and reputed automated laboratories,
            Aryopath ensures that every test meets the highest standards of
            precision, reliability, and global quality. By leveraging Thyrocare’s
            NABL and CAP-accredited laboratory network along with Aryopath’s
            innovation-driven digital systems, efficient logistics, and
            customer-first approach, we deliver fast, dependable, and affordable
            diagnostic solutions across India. Offering a comprehensive test
            profile menu and rapid turnaround times, Aryopath’s focus on
            preventive care and cost-effective solutions sets new industry
            benchmarks. Its dedication to integrating cutting-edge technology
            with a human-centric approach underscores its mission to standardize
            quality and accessibility in laboratory services globally.
          </p>
        </div>
      </div>

      
      <div className="w-full bg-gray-50 py-10 px-6 text-gray-800 flex justify-center">
        <img
          src="/labNetwork.png"
          alt="Lab Network Map"
          className="rounded-lg  w-full max-w-4xl"
        />
      </div>

    
      <div className="bg-white max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
          Our <span className="text-red-600">Lab</span>
        </h2>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 px-6">
         
          <div className="w-full md:w-1/2 flex justify-center">
            <iframe
              className="w-full h-64 md:h-80 rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/E3yK57e_PV8"
              title="Thyrocare - India's Largest Lab"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

        
          <div className="w-full md:w-1/2 flex justify-center">
            <iframe
              className="w-full h-64 md:h-80 rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/njMgF-DK7lA"
              title="Jaanch - A Brand by Thyrocare"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
     
     
        </>
    );
}

export default AboutPage;