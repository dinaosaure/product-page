# 🛍️ Rakuten Product Detail Page

A responsive **Product Detail Page** built with **React**, **TypeScript**, **Vite**, **Material UI**, and **React Query**.  
This project was developed as part of a **Frontend Developer Intern coding assignment** for the Rakuten Visitor Team.

---

## 🧩 Project Overview

The objective of this test was to create a **functional, well-structured, and visually appealing product page** that retrieves product data from a given API endpoint and displays key product details.

The page dynamically fetches and displays:
- Product image, title, and brand  
- Price (including discount when available)  
- Product description and technical details  
- Reviews and ratings (if available)  
- Breadcrumb navigation and a static cart icon  
- Friendly loading and error states  

The result is a simple yet professional product page that matches real-world e-commerce standards in structure and UX.

---

## 🌐 API Endpoint

All product data is fetched from this endpoint:

https://api-rakuten-vis.koyeb.app/product/


To switch products, just edit the constant in `src/ProductPage.tsx`:
const PRODUCT_ID = '13060247469'

## ⚙️ Installation & Setup

1. Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
2. Install dependencies
npm install
3. Start the development server
npm run dev