# MyInvoice

A local-first, offline-capable invoice generator built with React, TypeScript, and Vite. Create professional PDF invoices without any backend, authentication, or cloud services. All data is stored locally in your browser using IndexedDB.

## Features

- 🏠 **100% Local Storage** - All data stored in your browser (IndexedDB)
- 🔒 **Complete Privacy** - No server, no cloud, no data transmission
- 📄 **PDF Generation** - Professional invoice PDFs with pdf-lib
- 🔄 **Recurring Invoices** - Auto-generate invoices for 12 months from contracts
- ✏️ **Custom Invoices** - Create one-off invoices with custom line items
- 💾 **Backup & Restore** - Export/import your data as JSON
- 🎯 **Search & Filter** - Find invoices quickly with search, filter, and sorting
- 📊 **Project Tabs** - Organize recurring invoices by project/client
- 🎓 **Tutorial System** - Built-in tutorial and coachmark guides

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Dexie.js** - IndexedDB wrapper
- **pdf-lib** - PDF generation
- **UUID** - Unique ID generation

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/myInvoice.git
cd myInvoice
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

Preview the production build:
```bash
npm run preview
```

## Deployment to Vercel (FREE)

Vercel offers free hosting for personal projects, including private repositories. This is the recommended deployment method.

### Quick Deploy

1. **Deploy via Vercel Dashboard** (Recommended):
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click **"Add New Project"**
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings
   - Click **"Deploy"**

2. **Automatic Deployments**:
   - Every push to `main` branch will auto-deploy
   - Preview deployments for pull requests
   - Free custom domain support
   - Your app will be available at `https://your-project.vercel.app`

### Manual Deploy via CLI (Optional)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Production Deploy**:
   ```bash
   vercel --prod
   ```

### Important Notes

- **100% FREE** - No credit card required for personal projects
- **Private Repos Supported** - Unlike GitHub Pages free tier
- **Auto HTTPS** - SSL certificate included automatically
- **Global CDN** - Fast loading worldwide
- **Custom Domain** - Add your own domain for free
- **No Configuration Needed** - Vercel auto-detects Vite projects

## Usage

### First Time Setup

1. Go to **More → Settings** and fill in your freelancer information and bank details
2. Add your **Clients**
3. Open a client and create **Contracts** for recurring invoices
4. Open a contract to generate invoices or create custom invoices

### Generating Recurring Invoices

1. Open a client, then open (or create) a contract for that client/project
2. Click **Generate for Year** on the contract detail page
3. Invoices will be automatically generated for all 12 months

### Creating Custom Invoices

1. From a contract, click **+ Create Custom Invoice**
2. Select client, set dates, and add line items
3. The invoice will be saved and appear under that contract and on the Invoices page

### Backup Your Data

1. Go to **More → Backup**
2. Click **Export Data** to download a JSON file
3. To restore, use **Import Data** and select your backup file

## Project Structure

```
src/
├── components/     # Reusable UI components
├── config/         # Configuration files
├── domain/         # Type definitions and schemas
├── features/       # Feature pages (clients, contracts, invoices, etc.)
├── hooks/          # Custom React hooks
├── pdf/            # PDF generation logic
├── services/       # Business logic services
├── storage/        # Database and storage services
└── utils/          # Utility functions
```

## Privacy & Security

This application is designed with privacy as a core principle:

- **No Backend**: Everything runs in your browser
- **No Data Transmission**: No API calls, no cloud sync
- **Local Storage Only**: All data stored in IndexedDB
- **No Tracking**: No analytics, no cookies, no telemetry
- **User Control**: You can export/import your data anytime

See the **Privacy** page in the app for more details.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier (if configured) for formatting

## Troubleshooting

### Build Issues

- Make sure Node.js version is 20 or higher
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`

### GitHub Pages Deployment Issues

- Check GitHub Actions workflow status in the **Actions** tab
- Verify the repository name matches the base path in `vite.config.ts`
- Ensure GitHub Pages is enabled in repository settings
- Check that the workflow has proper permissions

### IndexedDB Issues

- Clear browser data if database seems corrupted
- Use the Backup feature to export data before clearing
- Different browsers have separate IndexedDB instances

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
# myInvoice


## License & Usage

MyInvoice is open source and free to use for:
- Personal use
- Freelancers
- Internal business invoicing

You are NOT allowed to:
- Resell this software
- Rebrand and claim it as your own
- Offer it as a paid SaaS or commercial service
