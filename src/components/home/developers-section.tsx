'use client';
import Image from 'next/image';
import { useState } from 'react';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Matthew Enarle",
    role: "Developer",
    image: "/images/team/team-matt.png", // Replace with actual image path
    bio: "Specializes in React and Next.js development with a focus on clean, minimalist UI."
  },
  {
    name: "Rai Reyes",
    role: "Developer",
    image: "/images/team/team-rai.jpg", // Replace with actual image path
    bio: "Expert in Node.js and database architecture with a passion for efficient APIs."
  },
  {
    name: "John Bonilla",
    role: "Freshworks",
    image: "/images/team/team-john.jpg", // Replace with actual image path
    bio: "Leads product strategy with a focus on user experience and market fit."
  },
  {
    name: "Benmark Ledesma",
    role: "Freshworks",
    image: "/images/team/team-benmark.jpg", // Replace with actual image path
    bio: "Creates intuitive user experiences with a minimalist black and white aesthetic."
  },
  {
    name: "Mayann Maco",
    role: "Freshworks",
    image: "/images/team/team-mayann.jpg", // Replace with actual image path
    bio: "Ensures product quality through comprehensive testing and automation."
  }
];

export default function DevelopersSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Split team members into two rows (3 top, 2 bottom)
  const topRow = teamMembers.slice(0, 3);
  const bottomRow = teamMembers.slice(3);
  
  return (
    <section id="developers" className="py-32 bg-white text-black">
      <div className="container mx-auto px-6 max-w-6xl">
        <h2 className="text-5xl font-bold mb-24 text-center uppercase tracking-wider font-montreal text-black">
          OUR TEAM
        </h2>
        
        {/* Top row - 3 members */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
          {topRow.map((member, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center group transition-transform duration-300 hover:-translate-y-2"
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="relative w-48 h-48 mb-8 rounded-full overflow-hidden border border-gray-100 transition-all duration-300 
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
                group-hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]"
              >
                <Image 
                  src={member.image} 
                  alt={member.name}
                  fill
                  sizes="192px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="text-2xl font-medium mb-2">{member.name}</h3>
              <p className="text-sm text-gray-600 mb-4 tracking-wide">{member.role}</p>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
        
        {/* Bottom row - 2 members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto">
          {bottomRow.map((member, index) => (
            <div 
              key={index + 3}
              className="flex flex-col items-center text-center group transition-transform duration-300 hover:-translate-y-2"
              onMouseEnter={() => setActiveIndex(index + 3)}
            >
              <div className="relative w-48 h-48 mb-8 rounded-full overflow-hidden border border-gray-100 transition-all duration-300 
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
                group-hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]"
              >
                <Image 
                  src={member.image} 
                  alt={member.name}
                  fill
                  sizes="192px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="text-2xl font-medium mb-2">{member.name}</h3>
              <p className="text-sm text-gray-600 mb-4 tracking-wide">{member.role}</p>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}