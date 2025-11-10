import { useTheme } from '@/contexts/ThemeContext';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DarkModeTestPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white transition-colors duration-300">
            Dark Mode Test Page
          </h1>
          <DarkModeToggle size="lg" />
        </div>

        {/* Current Theme Display */}
        <div className="mb-8 p-6 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-700 transition-colors duration-300">
          <p className="text-lg text-gray-700 dark:text-slate-200">
            Current Theme: <span className="font-bold">{theme}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
            HTML class: <code className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded">{document.documentElement.className}</code>
          </p>
        </div>

        {/* Component Tests */}
        <div className="space-y-6">
          {/* Text Colors */}
          <section className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Text Colors</h2>
            <p className="text-gray-900 dark:text-slate-100 mb-2">Primary text</p>
            <p className="text-gray-700 dark:text-slate-300 mb-2">Secondary text</p>
            <p className="text-gray-500 dark:text-slate-500">Tertiary text</p>
          </section>

          {/* Input Fields */}
          <section className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Input Fields</h2>
            <div className="space-y-4">
              <Input placeholder="Email address" type="email" />
              <Input placeholder="Password" type="password" />
              <Input placeholder="Disabled input" disabled />
            </div>
          </section>

          {/* Buttons */}
          <section className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button disabled>Disabled Button</Button>
            </div>
          </section>

          {/* Cards */}
          <section className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 transition-colors duration-300">
                <h3 className="font-semibold text-black dark:text-white mb-2">Card Title</h3>
                <p className="text-gray-600 dark:text-slate-400">Card content goes here</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 transition-colors duration-300">
                <h3 className="font-semibold text-black dark:text-white mb-2">Another Card</h3>
                <p className="text-gray-600 dark:text-slate-400">More content here</p>
              </div>
            </div>
          </section>

          {/* Links */}
          <section className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Links</h2>
            <div className="space-y-2">
              <a href="#" className="block text-[#E70A55] dark:text-[#FA7072] hover:underline transition-colors duration-300">
                Primary Link
              </a>
              <a href="#" className="block text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-300">
                Blue Link
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg text-center transition-colors duration-300">
          <p className="text-gray-600 dark:text-slate-400">
            Dark mode is {theme === 'dark' ? 'enabled' : 'disabled'}
          </p>
        </div>
      </div>
    </div>
  );
}
