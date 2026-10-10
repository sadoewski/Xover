import Layout from '../components/Layout';
import XoverSidebar from '../components/XoverSidebar';

export default function TemplatesPage() {
  return (
    <Layout>
      <XoverSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Шаблоны задач</h1>

          <div className="card">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Шаблоны задач</h3>
              <p className="mt-1 text-sm text-gray-500">
                Функционал будет реализован в следующих версиях.
              </p>
              <p className="mt-4 text-xs text-gray-400">
                Здесь вы сможете создавать шаблоны для быстрого создания повторяющихся задач.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
