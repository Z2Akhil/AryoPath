import Slider from 'react-slick';
const carouselItems = [
  { id: 1, title: 'Free Home Pickup', img: '/carousel/homePickup.png' },
  { id: 2, title: 'Online Reports', img: '/carousel/onlineReport.png' },
  { id: 3, title: 'NABL Certified Labs', img: '/carousel/nablCertified.png' },
  { id: 4, title: 'Full Body Checkups', img: '/carousel/fullBodyCheckup.png' },
  { id: 5, title: 'Special Offers', img: '/carousel/specialOffer.png' },
];

const HomeCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  return (
    <div className="hidden md:block my-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Why Choose Us?</h2>
      <Slider {...settings}>
        {carouselItems.map(item => (
          <div key={item.id} className="px-2"> 
            <div className="rounded-lg shadow-lg overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-60 object-cover" />
              <div className="p-4 bg-white">
                <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default HomeCarousel;