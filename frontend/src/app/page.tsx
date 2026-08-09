import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const jeans = [
    { id: 1, name: "Classic Straight", fit: "Straight", price: "$89.99", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800" },
    { id: 2, name: "Vintage Slim", fit: "Slim", price: "$95.00", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800" },
    { id: 3, name: "Modern Skinny", fit: "Skinny", price: "$79.99", image: "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&q=80&w=800" },
    { id: 4, name: "Relaxed Fit", fit: "Relaxed", price: "$110.00", image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=800" },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">V</span>
            </div>
            TryOn <span className="text-neutral-500">Hub</span>
          </div>
          <div className="flex gap-8 text-sm font-medium">
            <Link href="#" className="text-white hover:text-blue-400 transition-colors">Marketplace</Link>
            <Link href="#" className="text-neutral-400 hover:text-white transition-colors">My Avatar</Link>
            <Link href="#" className="text-neutral-400 hover:text-white transition-colors">Cart</Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-5 py-2.5 text-sm font-medium text-neutral-300 hover:text-white transition-colors">Log In</button>
            <button className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-neutral-200 transition-all active:scale-95">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-neutral-900/0 to-neutral-900/0 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            AI-Powered Virtual Try-On is Live
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
            Find your perfect fit. <br/> Without the fitting room.
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Create your digital twin in seconds. Experience hyper-realistic virtual try-ons for the world's best denim brands directly in your browser.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <button className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-400 transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]">
              Create Avatar
            </button>
            <button className="px-8 py-4 bg-neutral-800 text-white font-semibold rounded-full hover:bg-neutral-700 transition-all border border-neutral-700 active:scale-95">
              Explore Brands
            </button>
          </div>
        </div>
      </section>

      {/* Marketplace Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Trending Denim</h2>
            <p className="text-neutral-400">Discover the latest collections ready for virtual try-on.</p>
          </div>
          <button className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            View all collections <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {jeans.map((jean) => (
            <div key={jean.id} className="group relative rounded-2xl bg-neutral-800/50 border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-colors">
              <div className="aspect-[4/5] relative overflow-hidden bg-neutral-800">
                <img 
                  src={jean.image} 
                  alt={jean.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Try On Button Overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <Link href={`/tryon/${jean.id}`} className="px-6 py-3 bg-white/95 backdrop-blur-sm text-black font-semibold rounded-full shadow-xl hover:bg-white active:scale-95 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Virtual Try-On
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-lg">{jean.name}</h3>
                  <span className="font-medium text-neutral-300">{jean.price}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 text-xs font-medium bg-neutral-800 rounded-md text-neutral-400 border border-neutral-700">{jean.fit} Fit</span>
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-md border border-green-400/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    3D Ready
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-neutral-800 py-12 text-center text-neutral-500 text-sm">
        <p>&copy; 2026 TryOn Hub. B2B2C Virtual Try-On Infrastructure.</p>
        <p className="mt-2">Proyecto Programación 2</p>
      </footer>
    </div>
  );
}
