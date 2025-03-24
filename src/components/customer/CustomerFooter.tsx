export default function CustomerFooter() {
    return (
      <footer className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 font-montreal">
          <p>© {new Date().getFullYear()} Anik.3D. All rights reserved.</p>
        </div>
      </footer>
    );
  }