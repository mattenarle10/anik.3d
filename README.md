# 🎨 Anik.3D - Custom 3D Figurine E-commerce Platform


## ✨ Features

### 🎯 For Customers
- **Interactive 3D Model Viewer** - Explore figurines with real-time rotation and zoom
- **Custom Color Selection** - Personalize different parts of your figurine
- **Seamless Shopping Experience** - Easy-to-use cart system with order tracking
- **User Profiles** - Manage shipping information and view order history
- **Secure Authentication** - Powered by AWS Cognito with multi-device support

### 🛠 For Administrators
- **Product Management** - Add, update, and remove 3D models with ease
- **Inventory Control** - Track stock levels for both base and customized models
- **Order Processing** - Manage customer orders with status updates
- **Direct File Upload** - Efficient handling of large 3D model files

## 🚀 Technology Stack

### Frontend
- **Framework**: Next.js 15.2.3 with App Router
- **UI Components**: Custom minimalist design with Tailwind CSS
- **3D Rendering**: Three.js for model visualization
- **State Management**: React Context for cart and auth
- **Authentication**: AWS Amplify UI React components

### Backend
- **Architecture**: Serverless with AWS Lambda
- **Storage**: 
  - DynamoDB for product and user data
  - S3 for 3D model files
- **API**: REST endpoints via API Gateway
- **Security**: JWT and AWS Cognito authentication

## 🌟 Key Features Deep Dive

### 3D Model Customization
- Real-time color updates
- Part-specific customization (hair, shirt, pants, eyes)
- Automatic price adjustments based on customizations
- Transparent background with premium lighting setup

### Smart Cart System
- Shared stock management between base and custom models
- Real-time inventory tracking
- Clear pricing breakdown with tax calculation
- Order success confirmation with animated feedback

### Efficient File Handling
- Two-step upload process for large files
- Presigned URLs for direct S3 uploads
- Progress tracking for better UX
- Support for GLB format 3D models

## 🔧 Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/mattenarle10/anik.3d.git
   cd anik.3d
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   # Add your AWS credentials and other config
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📱 Mobile Responsiveness

The application is fully responsive with:
- Adaptive 3D model viewer
- Mobile-friendly navigation
- Touch-optimized color picker
- Responsive product grid layout

## 🔐 Security Features

- Secure file uploads with presigned URLs
- JWT token authentication
- AWS Cognito integration
- Protected admin routes
- Proper CORS configuration

## 🎯 Future Roadmap

- [ ] Advanced pose customization
- [ ] Bulk order management
- [ ] Social sharing features
- [ ] AR preview capability
- [ ] Multiple model comparison

## 👥 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The Anik.3D Team
- Our amazing community of 3D artists
- AWS for reliable cloud infrastructure
- Vercel for seamless deployments

---

<div align="center">
  <p>Built with ❤️ by the Anik.3D Team</p>
  <p>© 2025 Anik.3D. All rights reserved.</p>
</div>
