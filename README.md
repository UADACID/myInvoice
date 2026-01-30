# Invoice Generator

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

## Deployment to GitHub Pages

This application is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/myInvoice.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to **Settings** > **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

3. **Automatic Deployment**
   - GitHub Actions will automatically deploy when you push to the `main` or `master` branch
   - The workflow is defined in `.github/workflows/deploy.yml`
   - Your app will be available at `https://yourusername.github.io/myInvoice/`

### Important Notes

- **Repository Name**: If your repository name is different from `myInvoice`, update the `base` path in `vite.config.ts`:
  ```typescript
  base: process.env.GITHUB_PAGES === 'true' ? '/your-repo-name/' : '/',
  ```

- **Custom Domain**: You can add a custom domain in GitHub Pages settings. Update the base path accordingly.

- **Private Repositories**: GitHub Pages for private repositories requires GitHub Pro. For free accounts, the repository must be public.

## Usage

### First Time Setup

1. Go to **Settings** and fill in your freelancer information and bank details
2. Add your **Clients**
3. Create **Contracts** for recurring invoices
4. Generate invoices or create custom invoices

### Generating Recurring Invoices

1. Create contracts for each client/project
2. Click **Generate for Year** in the Recurring Invoices section
3. Invoices will be automatically generated for all 12 months

### Creating Custom Invoices

1. Click **+ Create Custom Invoice**
2. Select client, set dates, and add line items
3. The invoice will be saved and appear in the Custom Invoices section

### Backup Your Data

1. Go to **Backup** page
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
