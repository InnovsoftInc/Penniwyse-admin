import { useState } from 'react';
import type { EmailTemplate } from '../../../types/email-template.types';

interface EmailTemplatePreviewProps {
  template: EmailTemplate;
}

// Sample data for variable replacement
const previewVariables: Record<string, string> = {
  userName: 'John Doe',
  userEmail: 'john.doe@example.com',
  amount: '$99.99',
  date: new Date().toLocaleDateString(),
  merchant: 'Example Store',
  transactionId: 'TXN-12345',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  accountBalance: '$1,234.56',
  category: 'Shopping',
  description: 'Sample transaction',
};

export function EmailTemplatePreview({ template }: EmailTemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');

  const replaceVariables = (text: string): string => {
    if (!text) return '';
    let result = text;
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const getPreviewHtml = (): string => {
    const html = template.htmlContent || template.bodyHtml || '';
    return replaceVariables(html);
  };

  const getPreviewText = (): string => {
    const text = template.textContent || template.body || '';
    return replaceVariables(text);
  };

  const getPreviewSubject = (): string => {
    return replaceVariables(template.subject || '');
  };

  const previewHtml = getPreviewHtml();
  const previewText = getPreviewText();
  const previewSubject = getPreviewSubject();

  return (
    <div className="space-y-4">
      {/* Template Info */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Category:</span>
            <span className="ml-2 text-gray-900">{template.category || 'Uncategorized'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {template.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        {Array.isArray(template.variables) && template.variables.length > 0 && (
          <div>
            <span className="font-medium text-gray-700 text-sm">Variables:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {template.variables?.map((variable: string, idx: number) => (
                <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setViewMode('preview')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'preview'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setViewMode('html')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'html'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          HTML Source
        </button>
      </div>

      {/* Preview Content */}
      {viewMode === 'preview' ? (
        <div className="border border-gray-300 rounded-lg bg-white">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{previewSubject}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Preview: {previewText.substring(0, 100)}...
              </p>
            </div>
          </div>
          <div className="p-6">
            {previewHtml ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="text-gray-600 whitespace-pre-wrap">{previewText}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg bg-gray-900">
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <h3 className="text-sm font-medium text-gray-300">HTML Source</h3>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-auto max-h-96">
            <code>{previewHtml || previewText || 'No content'}</code>
          </pre>
        </div>
      )}

      {/* Variable Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This preview shows sample data. Variables like {`{{userName}}`}, {`{{amount}}`}, etc. will be replaced with actual values when the email is sent.
        </p>
      </div>
    </div>
  );
}

