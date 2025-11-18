# ColorConnect

Front-end prototype for a retirement community connection tool. Residents can signal when they are open to meeting, browse neighbors who are available, and social directors get a quick dashboard of engagement.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open the app in your browser at the URL printed in the terminal (default is http://localhost:5173/).

## Demo login accounts

Use any of these hard-coded accounts to sign in:

- Resident: `resident@demo.com` / `demo123`
- Resident 2: `resident2@demo.com` / `demo123`
- Social Director: `director@demo.com` / `director123`

## Views

- **Resident view:** Toggle your "I'm open to meeting" status and browse neighbors with green lights on, filtered by availability.
- **Director view:** See counts of open residents and a table of resident availability (open/unavailable) with units and interests.

Everything runs entirely on the front end with demo seed data; no backend services are required.
