import Slider from 'react-slick';
const carouselItems = [
  { id: 1, title: 'Free Home Pickup', img: 'https://images.unsplash.com/photo-1581091221104-8022b350a4b4?q=80&w=1470&auto=format=fit=crop' },
  { id: 2, title: 'Online Reports', img: 'https://images.unsplash.com/photo-1551884170-09fb70a31ed3?q=80&w=1374&auto=format=fit=crop' },
  { id: 3, title: 'NABL Certified Labs', img: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=1470&auto=format=fit=crop' },
  { id: 4, title: 'Full Body Checkups', img: 'https://images.unsplash.com/photo-1579165466991-467f35b71b7e?q=80&w=1374&auto=format=fit=crop' },
  { id: 5, title: 'Special Offers', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1470&auto=format=fit=crop' },
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
    <div className="my-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Why Choose Us?</h2>
      <Slider {...settings}>
        {carouselItems.map(item => (
          <div key={item.id} className="px-2"> 
            <div className="rounded-lg shadow-lg overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-40 object-cover" />
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