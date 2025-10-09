import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import GlassNav from "@/components/GlassNav";
import SEO from "@/components/SEO";

const BlogPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  // const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const blogPosts = [
    {
      id: 1,
      title: "Digital Declutter: Cutting the Noise in a Hyperc...",
      excerpt: "In today's hyperconnected world, the lines between work, leisure, and rest have blurred significantly. Notificati...",
      author: "Author",
      date: "Nov 29, 2024",
      category: "Technology",
      categoryColor: "bg-blue-500",
      image: "/CAD1.png",
      avatar: "/avatar.png",
      readMoreStyle: "black"
    },
    {
      id: 2,
      title: "Eco-Friendly Homes: The Future of Real Estate",
      excerpt: "The real estate industry is undergoing a significant transformation as eco-friendly homes gain popularity among buyers and developers alike. With increasing awareness of climate change and the need for sustainable living, eco-friendly homes represent not only a lifestyle choice but also a critical step toward reducing environmental impact.",
      author: "Saarah Mcbride",
      date: "Nov 29, 2024",
      category: "Real Estate",
      categoryColor: "bg-green-500",
      image: "/CAD2.png",
      avatar: "/avatar (1).png",
      readMoreStyle: "white"
    },
    {
      id: 3,
      title: "A Foodie's Guide to Europe: Best Culinary Experiences by...",
      excerpt: "Europe is a treasure trove of culinary delights, offering a diverse array of flavors, techniques, and traditions. F...",
      author: "Cruz Mcintyre",
      date: "Nov 29, 2024",
      category: "Food",
      categoryColor: "bg-orange-500",
      image: "/CAD3.png",
      avatar: "/picture-profile.png",
      readMoreStyle: "white"
    },
    {
      id: 4,
      title: "The Art of Black-and-White Photography",
      excerpt: "Black-and-white photography is a timeless art form that transcends trends and technology. By stripping...",
      author: "Amna",
      date: "Nov 29, 2024",
      category: "Photography",
      categoryColor: "bg-purple-500",
      image: "/CAD4.png",
      avatar: "/picture-profile (1).png",
      readMoreStyle: "white"
    },
    {
      id: 5,
      title: "Sustainable Travel Tips: Reducing Your Carbon Footpri...",
      excerpt: "Practical advice for eco-conscious travelers to explore the world responsibly and sustainably.",
      author: "Clara Wilson",
      date: "Nov 29, 2024",
      category: "Travel",
      categoryColor: "bg-teal-500",
      image: "/CAD5.png",
      avatar: "/picture-profile (2).png",
      readMoreStyle: "white"
    },
    {
      id: 6,
      title: "The Rise of Minimalist Interior Design",
      excerpt: "Learn how to create serene and functional spaces with the principles of minimalist interior design.",
      author: "Sophia Turner",
      date: "Nov 29, 2024",
      category: "Design",
      categoryColor: "bg-gray-500",
      image: "/CAD6.png",
      avatar: "/avatar.png",
      readMoreStyle: "white"
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <SEO 
        title="Blog - Design Inspiration & Creative Ideas"
        description="Discover creative inspiration, design tips, and the latest features in Cudliy's playground. Learn how to bring your toy ideas to life with our AI-powered platform."
        keywords="design blog, toy design inspiration, 3D printing tips, creative ideas, playground features, design tutorials"
        url="/blog"
      />
      <div className="min-h-screen bg-white">
        <GlassNav />

      {/* Hero Section */}
      <div className="relative bg-white pt-32 md:pt-40 pb-16">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 font-abril transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            New Features in{" "}
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Playground
            </span>
          </h2>
          <p className={`text-lg text-gray-600 max-w-2xl mx-auto transform transition-all duration-1000 delay-200 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            Ideas, trends, and inspiration for a brighter future
          </p>
        </div>
      </div>

      {/* Navigation/Filter Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 transform transition-all duration-1000 delay-400 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => setSelectedCategory("All")}
                className={`px-4 py-2 rounded-full text-sm font-medium font-abril transition-colors ${
                  selectedCategory === "All" 
                    ? "bg-[#E70A55] text-white" 
                    : "text-gray-600 hover:text-[#E70A55]"
                }`}
              >
                All
              </button>
              {['Travel', 'Food', 'Lifestyle'].map((category) => (
                <button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium font-abril transition-colors ${
                    selectedCategory === category 
                      ? "bg-[#E70A55] text-white" 
                      : "text-gray-600 hover:text-[#E70A55]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#E70A55] focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg font-abril">No blog posts found matching your search criteria.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center transform transition-all duration-1000 delay-600 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {filteredPosts.map((post, index) => (
            <article 
              key={post.id}
              className="bg-white overflow-hidden transition-all duration-300 group flex flex-col shadow-sm hover:shadow-md rounded-2xl"
              style={{
                width: '300px',
                minWidth: '300px',
                maxWidth: '343px',
                minHeight: '508px',
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Image */}
              <div className="relative overflow-hidden flex-shrink-0">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col h-full">
                {/* Author and Date */}
                <div className="flex items-center space-x-3 mb-3 flex-shrink-0">
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-600 font-abril">
                    {post.author} {post.date}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-black mb-3 font-abril group-hover:text-[#E70A55] transition-colors flex-shrink-0 line-clamp-2">
                  {post.title}
                </h3>

                {/* Description */}
                <div className="flex-grow mb-4 overflow-hidden">
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                    {post.excerpt}
                  </p>
                </div>

                {/* Read More Button */}
                <div className="flex-shrink-0 mt-auto">
                  {post.readMoreStyle === "black" ? (
                    <button 
                      className="text-white text-sm font-medium font-abril transition-all duration-300 hover:bg-gray-800 hover:text-white flex items-center justify-center"
                      style={{
                        width: '163px',
                        height: '44px',
                        borderRadius: '20px',
                        gap: '8px',
                        paddingTop: '10px',
                        paddingRight: '16px',
                        paddingBottom: '10px',
                        paddingLeft: '16px',
                        backgroundColor: '#000000'
                      }}
                    >
                      READ MORE
                    </button>
                  ) : (
                    <button 
                      className="text-black text-sm bg-white font-medium font-abril transition-all duration-300 hover:bg-black hover:text-white flex items-center justify-center"
                      style={{
                        width: '163px',
                        height: '44px',
                        borderRadius: '20px',
                        gap: '8px',
                        paddingTop: '10px',
                        paddingRight: '16px',
                        paddingBottom: '10px',
                        paddingLeft: '16px',                        border: '1px solid #e5e7eb',
                        
                      }}
                    >
                      <span>READ MORE</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      <div className="max-w-6xl mx-auto px-8 pb-12">
        <div className="text-center">
          <button 
            className="bg-gray-200 text-black hover:bg-gray-300 font-abril transition-colors"
            style={{
              width: '117px',
              height: '48px',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              paddingTop: '12px',
              paddingRight: '16px',
              paddingBottom: '12px',
              paddingLeft: '16px',
              opacity: 1
            }}
          >
            Load More
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
      </div>
    </>
  );
};

export default BlogPage;


