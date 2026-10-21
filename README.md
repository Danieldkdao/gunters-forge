# [Gunter's Forge](https://guntersforge.vercel.app)

A clean, mobile-responsive, fully functioning ecommerce store for Gunter's blacksmith shop. It features customer and admin user separation, products, orders, and real payment flows.


# Try It Out!

Go to the live website, hosted on Vercel at [http://guntersforge.vercel.app](https://guntersforge.vercel.app)

# Features
- Admin panel with full visibility
- Order management
- Product create and update functionality
- Featured product catalog
- AI order planning to determine the best order to fulfill orders
- Form validation and input validation
- Clean, modular, and responsive interface
- Full checkout flow with two options for payment: cash-on-delivery and Stripe payment integration

# Usage Instructions

1. Go to the live website, at [http://guntersforge.vercel.app](https://guntersforge.vercel.app)
2. You should land on the landing page. From there you can navigate around and try adding items to your cart. Alternatively, you can sign in with one of our test accounts by clicking on the "Sign in" button in top right portion of the header.
3. If you choose to sign in, we have multiple authentication methods available including email-password, Google, or GitHub. My recommendation to test out the website is to use the test accounts provided below the authentication forms. Clicking on those will automatically authenticate you so you can test out all of the website's features.
4. Admins can manage products, orders, and view aggregated stats. Customers can add items to cart, view their past orders, and create new ones.
5. You can also play the game!

# Application Structure

The bulk of the application lies in the `src` folder:
```bash
/app - Pages, API routes, and layout files
/components - Reusable components and shadcn/ui primitives
/data - Type-safe environment variables
/db - DB config, setup, and schemas
/features - The main features of the application, separated by name in folders with actions, types, constants, helpers, and other code related to that feature
/hooks - Custom hooks used throughout the application
/lib - Auth setup and config, global helpers, constants, types, and utils
/services - Setup for external services like Stripe, OpenRouter, and Mailjet
/stores - Global context Zustand stores used in the application like the cart-store
/trigger - Background jobs powered by Trigger.dev
```

# Setup Instructions

1. Make sure you have Git, PNPM 12.8.1, and a Next.js compatible Node.js version installed on your system.
2. Clone the repository with
```bash
git clone https://github.com/Danieldkdao/gunters-forge.git
```
3. CD into the folder that you just cloned
```bash
cd gunters-forge
```
4. Setup the environment variables. If you try to run the app without them, you will get an error:
```env
# Neon
DATABASE_URL=

# Better Auth
BETTER_AUTH_URL=
BETTER_AUTH_SECRET=

# Test Users
TEST_ADMIN_EMAIL=
TEST_ADMIN_PASSWORD=
TEST_CUSTOMER_EMAIL=
TEST_CUSTOMER_PASSWORD=

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Mailjet
MAILJET_API_KEY=
MAILJET_API_SECRET=
SENDER_EMAIL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
APP_URL=

# OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=

# Trigger.dev
TRIGGER_PROJECT_REF=
TRIGGER_SECRET_KEY=
```
5. Generate the DB schemas and migrate them to your database:
```bash
pnpm db:generate
pnpm db:migrate
```
6. Install the dependencies with:
```bash
pnpm install
```
7. Run the application with:
```bash
pnpm dev
```

# Contributions

I worked on this application in collaboration with Codex. I designed the flows, the structure, and the UX. Then I had Codex work alongside me to implement the features. For boring, mundane tasks I would let Codex take over and then do a light review. For more intensive tasks that surrouded the core features and functionalities of the application, I gave it more context and reviewed more thouroughly. For some of the tasks, it was just faster and easier to do it myself instead of consulting Codex to try and get it to produce what I wanted. Most logic was implemented by me, then I directed Codex to build upon that and help me think of edge cases, produce certain bugs, and implement fixes for them. Logo is edited fro Logoipsum. All sprites used in the game were generated using Codex computer use and Pixelorama (because I suck at art).

## AI Usage

AI was used for:
- Brainstorming
- Researching new documentation
- Implementing boring / mundane sections of code
- Reviewing my code and identifying bugs
- Helped me implement some of the more difficult / important sections such as the Stripe payment flows, the AI background jobs planner, and the game
