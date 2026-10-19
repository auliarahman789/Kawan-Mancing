import React from "react";
import DefaultLayout from "../../layout/DefaultLayout";

const HomePage: React.FC = () => {
  return (
    <DefaultLayout>
      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <div className="h-[60vh] flex items-center justify-center text-white text-center bg-cover bg-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Plan Your Sacred Journey
            </h1>
            <h2 className="text-xl md:text-2xl mb-4">
              Find the best Umrah packages tailored to your needs
            </h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg mt-8 transition duration-300">
              Explore Packages
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="p-6 text-center border border-gray-200 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3">Expert Guidance</h3>
              <p className="text-gray-600">
                Experienced guides to assist you throughout your journey
              </p>
            </div>
            <div className="p-6 text-center border border-gray-200 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3">
                All-Inclusive Packages
              </h3>
              <p className="text-gray-600">
                Complete arrangements including travel, accommodation, and visa
              </p>
            </div>
            <div className="p-6 text-center border border-gray-200 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock assistance for a peaceful journey
              </p>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default HomePage;
