# Farm Marketplace Starter

Build a completely empty, production-ready native mobile app layout for Android and iOS titled 'Ndauka Rabbits Farm Marketplace'. Do NOT populate the database or screens with fake/dummy data, fake products, or fake users. All screens, catalogs, and databases must be 100% empty, displaying proper 'Empty State' placeholders until real data is added by real users.

Core App Architecture & Features:

1. Authentication & User Roles:

- Sign up / Login flow using phone number or email.

- Role selection during registration: 'Buyer' or 'Seller / Breeder'.

2. Empty Home Screen & Marketplace Feed:

- Dynamic search bar and category filters (Breeding Rabbits, Custom Cages, Feeds & Supplements, Equipment).

- Dynamic location filter (by region/city).

- Empty state message when no items exist: "Hakuna bidhaa zilizowekwa bado. Kuwa wa kwanza kuweka bidhaa!" with a quick "Post Item" button.

3. Seller Dashboard (For Farmers):

- Blank listing form: Upload real photos/videos from phone gallery or camera, title, breed selection, quantity, price in TZS, description, and location.

- Empty 'My Listings' list ready to store and manage active items once posted by the user.

4. Empty Product Detail & Order Template:

- Dynamic screen layout ready to pull uploaded product images, breed specs, price (TZS), and seller location.

- Action buttons configured: 'Call Seller', 'WhatsApp Chat', and 'Request Order'.

- Shipping & Transport cost estimator form based on user input.

5. Database & Admin Setup:

- Empty database tables/schemas for Users, Products, Categories, Locations, and Orders.

- Admin view to review and approve seller profiles and dynamic listings as they get submitted.

UI/UX & Design:

- Modern native mobile layout with a smooth bottom navigation bar (Home, Categories, Post Item, My Orders, Profile).

- Clean, fast, light-themed design with emerald green accents.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rabbit-farm-empty-shell.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d31aaa42-fc61-49d9-9400-29636b8b96da).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
