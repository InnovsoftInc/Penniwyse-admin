import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import { Input, Button, Select } from '../../ui';
import { Eye, Code, Copy, Check } from 'lucide-react';
import type { CreateEmailTemplateDto, UpdateEmailTemplateDto, EmailTemplate } from '../../../types/email-template.types';

const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().optional(),
  bodyHtml: z.string().optional(),
  variables: z.string().optional(), // Stored as comma-separated string, converted to array
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Form data type matches the schema (variables as string)
type EmailTemplateFormData = {
  name: string;
  subject: string;
  body?: string;
  bodyHtml?: string;
  variables?: string; // Comma-separated string in form
  category?: string;
  isActive?: boolean;
};

interface EmailTemplateFormProps {
  onSubmit: (data: CreateEmailTemplateDto | UpdateEmailTemplateDto) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<EmailTemplate>;
  isLoading?: boolean;
}

const templateCategories = [
  { value: 'notification', label: 'Notification' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'password-reset', label: 'Password Reset' },
  { value: 'billing', label: 'Billing' },
  { value: 'alert', label: 'Alert' },
  { value: 'other', label: 'Other' },
];

const commonVariables = [
  'userName',
  'userEmail',
  'amount',
  'currency',
  'date',
  'transactionId',
  'merchantName',
  'categoryName',
  'accountName',
  'balance',
  'dueDate',
  'link',
  'code',
];

// Default HTML template
const defaultHtmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #000; margin: 0;">Pennywyse</h1>
  </div>
  <div style="background: #fff; padding: 30px; border-radius: 8px;">
    <h2 style="color: #000; margin-top: 0;">{{subject}}</h2>
    <p>Hi {{userName}},</p>
    <p>{{body}}</p>
  </div>
</body>
</html>`;

export function EmailTemplateForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: EmailTemplateFormProps) {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');
  const [copied, setCopied] = useState(false);
  const [previewVariables] = useState<Record<string, string>>({
    userName: 'Kemi',
    userEmail: 'kemi@example.com',
    amount: '$100.00',
    currency: 'USD',
    date: new Date().toLocaleDateString(),
    transactionId: 'TXN-12345',
    merchantName: 'Example Store',
    categoryName: 'Shopping',
    accountName: 'Checking Account',
    balance: '$1,234.56',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    link: 'https://app.pennywyse.com',
    code: 'ABC123',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: initialData?.name || '',
      subject: initialData?.subject || '',
      body: initialData?.textContent || initialData?.body || '',
      bodyHtml: initialData?.htmlContent || initialData?.bodyHtml || defaultHtmlTemplate,
      variables: (Array.isArray(initialData?.variables) && initialData.variables.length > 0)
        ? initialData.variables.join(', ')
        : '',
      category: initialData?.category || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  });

  const isActive = watch('isActive');
  const variablesString = watch('variables');
  const subject = watch('subject');
  const body = watch('body');
  const bodyHtml = watch('bodyHtml') || '';

  // Function to detect variables from text (looks for {{variableName}} patterns)
  const detectVariables = (text: string): string[] => {
    if (!text) return [];
    const regex = /\{\{(\w+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches).sort();
  };

  // Auto-detect variables from all content fields
  const autoDetectVariables = () => {
    const allText = `${subject || ''} ${body || ''} ${bodyHtml || ''}`;
    const detected = detectVariables(allText);
    if (detected.length > 0) {
      const currentVars = variablesString ? variablesString.split(',').map(v => v.trim()).filter(v => v) : [];
      const combined = Array.from(new Set([...currentVars, ...detected]));
      setValue('variables', combined.join(', ') as string);
    }
  };

  const handleFormSubmit = async (data: EmailTemplateFormData) => {
    // Convert variables string to array for DTO
    // Map body -> textContent and bodyHtml -> htmlContent
    const processedData: CreateEmailTemplateDto | UpdateEmailTemplateDto = {
      ...data,
      textContent: data.body || undefined,
      htmlContent: data.bodyHtml || undefined,
      // Remove body and bodyHtml from the payload (use textContent/htmlContent instead)
      body: undefined,
      bodyHtml: undefined,
      variables: data.variables
        ? data.variables.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0)
        : undefined,
    };
    await onSubmit(processedData);
  };

  const insertVariable = (variable: string) => {
    const current = variablesString || '';
    const newValue = current ? `${current}, ${variable}` : variable;
    setValue('variables', newValue);
  };

  const insertVariableInHtml = (variable: string) => {
    const currentHtml = bodyHtml || '';
    const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || currentHtml.length;
    const newHtml = currentHtml.slice(0, cursorPos) + `{{${variable}}}` + currentHtml.slice(cursorPos);
    setValue('bodyHtml', newHtml);
  };

  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const getPreviewHtml = (): string => {
    const html = bodyHtml || '';
    const replaced = replaceVariables(html);
    return replaced;
  };

  const getPreviewText = (): string => {
    const text = body || '';
    return replaceVariables(text);
  };

  const copyHtmlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bodyHtml || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          <Input
            {...register('name')}
            error={errors.name?.message}
            required
            placeholder="Welcome Email"
            helperText="Unique identifier for this template"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select
            {...register('category')}
            error={errors.category?.message}
            placeholder="Select a category"
            options={[
              { value: '', label: 'Select a category' },
              ...templateCategories,
            ]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <Input
          {...register('subject')}
          error={errors.subject?.message}
          required
          placeholder="Welcome to Pennywyse!"
          helperText="Email subject line. Use {{variableName}} for dynamic content."
          onBlur={autoDetectVariables}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Body (Plain Text) <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <textarea
          {...register('body')}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.body ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Hello {{userName}}, welcome to Penniwyse!..."
          onBlur={autoDetectVariables}
        />
        {errors.body && (
          <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Use {'{{variableName}}'} for dynamic content. Example: {'{{userName}}'}, {'{{amount}}'}. If HTML body is provided, this is used as a fallback.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Body (HTML) <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('preview')}
              className={viewMode === 'preview' ? 'bg-primary-50 text-primary-700' : ''}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('code')}
              className={viewMode === 'code' ? 'bg-primary-50 text-primary-700' : ''}
            >
              <Code className="w-4 h-4 mr-1" />
              HTML
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyHtmlToClipboard}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy HTML
                </>
              )}
            </Button>
          </div>
        </div>

        {viewMode === 'code' ? (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Editor
              value={bodyHtml || ''}
              onValueChange={(code) => {
                setValue('bodyHtml', code);
                // Auto-detect variables after a short delay
                setTimeout(() => {
                  const detected = detectVariables(`${subject || ''} ${body || ''} ${code || ''}`);
                  if (detected.length > 0) {
                    const currentVars = variablesString ? variablesString.split(',').map(v => v.trim()).filter(v => v) : [];
                    const combined = Array.from(new Set([...currentVars, ...detected]));
                    setValue('variables', combined.join(', ') as string);
                  }
                }, 500);
              }}
              highlight={(code) => {
                try {
                  return Prism.highlight(code, Prism.languages.markup, 'markup');
                } catch {
                  return code;
                }
              }}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
                minHeight: '400px',
                backgroundColor: '#f5f5f5',
              }}
              textareaClassName="outline-none"
              className="code-editor"
            />
            {errors.bodyHtml && (
              <p className="mt-1 text-sm text-red-600 px-3">{errors.bodyHtml.message}</p>
            )}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                HTML version of the email. Use {'{{variableName}}'} for dynamic content.
              </p>
              <div className="mt-2">
                <label className="block text-xs text-gray-600 mb-1">Quick Insert Variables:</label>
                <div className="flex flex-wrap gap-1">
                  {commonVariables.map((variable) => (
                    <Button
                      key={variable}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertVariableInHtml(variable)}
                      className="text-xs h-6 px-2"
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg bg-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{replaceVariables(subject || 'Email Preview')}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Preview: {getPreviewText().substring(0, 100)}...
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div 
                className="email-preview bg-white rounded-lg shadow-sm p-6"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                style={{ maxWidth: '100%', overflow: 'auto' }}
              />
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              This is a preview with sample data. Variables will be replaced with actual values when sending.
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Variables
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={autoDetectVariables}
            className="text-xs"
          >
            Auto-detect from content
          </Button>
        </div>
        <div className="space-y-2">
          <Input
            {...register('variables')}
            error={errors.variables?.message}
            placeholder="userName, amount, date"
            helperText="Comma-separated list of variable names used in the template. Click 'Auto-detect' to scan content for {{variableName}} patterns."
          />
          {(() => {
            const detected = detectVariables(`${subject || ''} ${body || ''} ${bodyHtml || ''}`);
            return detected.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-medium mb-1">
                  Detected variables in content ({detected.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {detected.map((variable) => (
                    <span key={variable} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {variable}
                    </span>
                  ))}
                </div>
                {variablesString && !variablesString.split(',').some(v => detected.includes(v.trim())) && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Click "Auto-detect" to add these to your variables list
                  </p>
                )}
              </div>
            );
          })()}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quick Insert:</label>
            <div className="flex flex-wrap gap-2">
              {commonVariables.map((variable) => (
                <Button
                  key={variable}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertVariable(variable)}
                  className="text-xs"
                >
                  {variable}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('isActive')}
            checked={isActive}
            onChange={(e) => setValue('isActive', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Only active templates can be used for sending emails
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData?.id ? 'Update Template' : 'Create Template'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
