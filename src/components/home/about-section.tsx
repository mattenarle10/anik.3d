import Image from 'next/image';

export default function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-5xl font-bold mb-16 text-center uppercase tracking-wider font-montreal text-black">About</h2>
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 mb-8 md:mb-0 flex flex-col items-center">
            <div className="w-48 h-48 mb-8 relative">
              <Image 
                src="/images/logo-big.png" 
                alt="Anik.3D Logo" 
                fill
                sizes="(max-width: 768px) 100vw, 192px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            
          </div>
          <div className="md:w-1/2">
            <h3 className="text-2xl font-medium mb-6 text-black">Our Story</h3>
            <p className="mb-6 text-lg leading-relaxed text-black">
              Founded in 2025, Anik.3D began as a passion project between friends with a shared love for 3D design. We've quickly established ourselves as a cutting-edge 3D printing studio known for exceptional quality and innovative designs.
            </p>
            <p className="mb-6 text-lg leading-relaxed text-black">
              Our name reflects our commitment to creating unique pieces that stand out in both design and craftsmanship, bringing imagination to life through artistic vision and technical precision.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}