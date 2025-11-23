import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button, Select } from '../../ui';
import type { CreateNotificationTemplateDto, UpdateNotificationTemplateDto, NotificationTemplate } from '../../../types/notification-template.types';

const createNotificationTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  body: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  variables: z.string().optional(),
  platform: z.enum(['ios', 'android', 'all']).optional(),
  priority: z.enum(['default', 'normal', 'high', 'low']).optional(),
  sound: z.string().optional(),
  badge: z.number().min(0).max(999).optional(),
  channelId: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => data.title || data.body, {
  message: 'At least one of title or body must be provided',
  path: ['body'],
});

const updateNotificationTemplateSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  type: z.string().optional(),
  variables: z.string().optional(),
  platform: z.enum(['ios', 'android', 'all']).optional(),
  priority: z.enum(['default', 'normal', 'high', 'low']).optional(),
  sound: z.string().optional(),
  badge: z.number().min(0).max(999).optional(),
  channelId: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => data.title || data.body, {
  message: 'At least one of title or body must be provided',
  path: ['body'],
});

type NotificationTemplateFormData = CreateNotificationTemplateDto | UpdateNotificationTemplateDto;

interface NotificationTemplateFormProps {
  onSubmit: (data: NotificationTemplateFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<NotificationTemplate>;
  isLoading?: boolean;
}

const notificationTypes = [
  { value: 'bill_reminder', label: 'Bill Reminder' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'budget_alert', label: 'Budget Alert' },
  { value: 'savings_goal', label: 'Savings Goal' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'payment_due', label: 'Payment Due' },
  { value: 'low_balance', label: 'Low Balance' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'other', label: 'Other' },
];

const commonVariables = [
  'userName',
  'userEmail',
  'amount',
  'currency',
  'date',
  'merchant',
  'dueDate',
  'balance',
  'accountName',
  'transactionId',
  'categoryName',
  'link',
  'code',
];

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

export function NotificationTemplateForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: NotificationTemplateFormProps) {
  const [detectedVars, setDetectedVars] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NotificationTemplateFormData>({
    resolver: zodResolver(initialData?.name ? updateNotificationTemplateSchema : createNotificationTemplateSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      title: initialData?.title || '',
      body: initialData?.body || '',
      type: initialData?.type || '',
      variables: Array.isArray(initialData?.variables)
        ? initialData.variables.join(', ')
        : typeof initialData?.variables === 'string'
        ? initialData.variables
        : '' as any,
      platform: initialData?.platform || 'all',
      priority: initialData?.priority || 'default',
      sound: initialData?.sound || '',
      badge: initialData?.badge,
      channelId: initialData?.channelId || '',
      category: initialData?.category || '',
      description: initialData?.description || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  });

  const isActive = watch('isActive');
  const variablesString = watch('variables') as string | string[] | undefined;
  const title = watch('title');
  const body = watch('body');

  // Auto-detect variables
  const autoDetectVariables = () => {
    const allText = `${title || ''} ${body || ''}`;
    const detected = detectVariables(allText);
    if (detected.length > 0) {
      const currentVars = variablesString 
        ? (typeof variablesString === 'string' 
            ? variablesString.split(',').map((v: string) => v.trim()).filter((v: string) => v) 
            : Array.isArray(variablesString) ? variablesString : [])
        : [];
      const combined = Array.from(new Set([...currentVars, ...detected]));
      setValue('variables', combined.join(', ') as any);
    }
  };

  // Update detected variables when content changes
  useEffect(() => {
    const allText = `${title || ''} ${body || ''}`;
    setDetectedVars(detectVariables(allText));
  }, [title, body]);

  const handleFormSubmit = async (data: NotificationTemplateFormData) => {
    // Convert variables string to array
    const processedData = {
      ...data,
      variables: data.variables
        ? (typeof data.variables === 'string'
            ? (data.variables as any).split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0)
            : Array.isArray(data.variables) ? data.variables : [])
        : undefined,
    };
    await onSubmit(processedData);
  };

  const insertVariable = (variable: string) => {
    const current = typeof variablesString === 'string' ? variablesString : (Array.isArray(variablesString) ? variablesString.join(', ') : '');
    const newValue = current ? `${current}, ${variable}` : variable;
    setValue('variables', newValue as any);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          {initialData?.name ? (
            <Input
              value={initialData.name}
              readOnly
              helperText="Template name cannot be changed"
            />
          ) : (
            <Input
              {...register('name')}
              error={(errors as any).name?.message}
              required
              placeholder="bill_reminder_custom"
              helperText="Unique identifier for this template (e.g., bill_reminder_custom)"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <Select
            {...register('type')}
            error={errors.type?.message}
            required
            placeholder="Select a type"
            options={[
              { value: '', label: 'Select a type' },
              ...notificationTypes,
            ]}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <Input
          {...register('title')}
          error={errors.title?.message}
          placeholder="Bill Due Soon"
          helperText="Notification title. Use {{variableName}} for dynamic content."
          onBlur={autoDetectVariables}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Body <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <textarea
          {...register('body')}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.body ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Your {{merchant}} bill of {{amount}} is due on {{dueDate}}"
          onBlur={autoDetectVariables}
        />
        {errors.body && (
          <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Notification message. Use {'{{variableName}}'} for dynamic content. At least one of title or body must be provided.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Platform
          </label>
          <Select
            {...register('platform')}
            error={errors.platform?.message}
            placeholder="Select platform"
            options={[
              { value: 'all', label: 'All Platforms' },
              { value: 'ios', label: 'iOS' },
              { value: 'android', label: 'Android' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <Select
            {...register('priority')}
            error={errors.priority?.message}
            placeholder="Select priority"
            options={[
              { value: 'default', label: 'Default' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
              { value: 'low', label: 'Low' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sound
          </label>
          <Input
            {...register('sound')}
            error={errors.sound?.message}
            placeholder="default"
            helperText="Sound file name (e.g., default, alert.wav)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Badge Count
          </label>
          <Input
            type="number"
            {...register('badge', { valueAsNumber: true })}
            error={errors.badge?.message}
            placeholder="1"
            min={0}
            max={999}
            helperText="Badge count (0-999)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Channel ID (Android)
          </label>
          <Input
            {...register('channelId')}
            error={errors.channelId?.message}
            placeholder="bills"
            helperText="Android notification channel ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Input
            {...register('category')}
            error={errors.category?.message}
            placeholder="BILL_REMINDER"
            helperText="Notification category identifier"
          />
        </div>
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
          {detectedVars.length > 0 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 font-medium mb-1">
                Detected variables in content ({detectedVars.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {detectedVars.map((variable) => (
                  <span key={variable} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={2}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Optional description for this template"
        />
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
          Only active templates can be used for sending notifications
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData?.name ? 'Update Template' : 'Create Template'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

