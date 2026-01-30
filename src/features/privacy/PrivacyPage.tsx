import { Card, CardContent } from '@/components';

interface PrivacyContentProps {
  className?: string;
}

export function PrivacyContent({ className = '' }: PrivacyContentProps) {
  return (
    <div className={className}>
      <div className="mb-6">
        <p className="text-base text-slate-600 mb-6">
          Your data belongs to you. Everything stays on your device.
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Privacy Card */}
        <Card className="border-2 border-indigo-100 bg-indigo-50/30">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">100% Local Storage</h2>
                <p className="text-slate-700 leading-relaxed">
                  All your data—clients, contracts, invoices, and settings—is stored exclusively in your browser's local database (IndexedDB). 
                  Nothing is ever sent to any server, cloud service, or third-party service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Points */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">No Server, No Cloud</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This application runs entirely in your browser. There is no backend server, no database in the cloud, 
                    and no API calls that transmit your data anywhere.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">No Synchronization</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Your data never syncs across devices or browsers. Each browser instance maintains its own independent database. 
                    This ensures complete privacy and prevents any accidental data sharing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Complete Privacy</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Your invoice data, client information, and financial details remain completely private. 
                    Only you have access to your data, and it never leaves your device.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">You Control Your Data</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Use the Backup feature to export your data as JSON anytime. You can import it to restore or move to another browser. 
                    You have full control over your data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <h3 className="font-semibold text-slate-900 mb-4">How It Works</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-semibold text-slate-700">1</span>
                <p>
                  <strong className="text-slate-900">Browser Storage:</strong> All data is stored using IndexedDB, 
                  a modern browser database technology that provides fast, reliable local storage.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-semibold text-slate-700">2</span>
                <p>
                  <strong className="text-slate-900">No Network Required:</strong> The application works completely offline. 
                  Once loaded, you can use it without an internet connection.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-semibold text-slate-700">3</span>
                <p>
                  <strong className="text-slate-900">Device-Specific:</strong> Data is tied to your browser and device. 
                  If you clear browser data, your application data will be removed. Always use Backup to keep a copy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Important Notes</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Data is stored locally in your browser. If you clear browser data or use a different browser/device, 
                    you'll need to import your backup file.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>Regular backups are recommended. Use the Backup page to export your data periodically.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>This application does not collect, track, or analyze any user data. No cookies, no analytics, no telemetry.</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Terms of Use</h3>
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                By using this application, you acknowledge that:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>You are solely responsible for backing up and securing your data.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>The application is provided "as is" without warranties of any kind.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>You understand that data loss may occur if browser data is cleared or the browser is uninstalled.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>You are responsible for ensuring compliance with applicable data protection and privacy laws in your jurisdiction.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Keep PrivacyPage for backward compatibility if needed
export function PrivacyPage() {
  return <PrivacyContent className="max-w-4xl" />;
}
