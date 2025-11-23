import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button, Select } from '../../ui';
import type { CronSchedule, CreateCronScheduleDto, UpdateCronScheduleDto } from '../../../types/cron.types';

const scheduleSchema = z.object({
  jobName: z.string().min(1, 'Job name is required'),
  cronExpression: z.string().min(1, 'Cron expression is required').regex(
    /^(\*|([0-9]|[1-5][0-9])|\*\/([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    'Invalid cron expression format (use: minute hour day month dayOfWeek)'
  ),
  timeZone: z.string().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

type ScheduleFormData = CreateCronScheduleDto | UpdateCronScheduleDto;

interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CronSchedule>;
  availableJobs?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export function ScheduleForm({
  onSubmit,
  onCancel,
  initialData,
  availableJobs = [],
  isLoading = false,
}: ScheduleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      jobName: initialData?.jobName || '',
      cronExpression: initialData?.cronExpression || '',
      timeZone: initialData?.timeZone || 'UTC',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      description: initialData?.description || '',
    },
  });

  const isActive = watch('isActive');

  // Common cron presets
  const cronPresets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every 30 minutes', value: '*/30 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Every 12 hours', value: '0 */12 * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Daily at 9:00 AM', value: '0 9 * * *' },
    { label: 'Daily at 10:00 AM', value: '0 10 * * *' },
    { label: 'Daily at 2:00 AM', value: '0 2 * * *' },
    { label: 'Weekly on Monday', value: '0 0 * * 1' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!initialData?.jobName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Name
          </label>
          {availableJobs.length > 0 ? (
            <Select
              {...register('jobName')}
              error={errors.jobName?.message}
              required
              placeholder="Select a job"
              options={[
                { value: '', label: 'Select a job' },
                ...availableJobs.map((job) => ({ value: job.id, label: job.name }))
              ]}
            />
          ) : (
            <Input
              {...register('jobName')}
              error={errors.jobName?.message}
              required
              placeholder="bill-reminders"
              helperText="Unique identifier for the cron job"
            />
          )}
        </div>
      )}

      {initialData?.jobName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Name
          </label>
          <Input
            value={initialData.jobName}
            readOnly
            helperText="Job name cannot be changed"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cron Expression
        </label>
        <div className="space-y-2">
          <Input
            {...register('cronExpression')}
            error={errors.cronExpression?.message}
            required
            placeholder="0 9 * * *"
            helperText="Format: minute hour day month dayOfWeek (e.g., '0 9 * * *' = daily at 9:00 AM)"
          />
          <div>
            <label className="block text-xs text-gray-600 mb-1">Quick Presets:</label>
            <div className="grid grid-cols-2 gap-2">
              {cronPresets.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue('cronExpression', preset.value)}
                  className="text-xs justify-start"
                >
                  {preset.label}
                  <code className="ml-2 text-xs bg-gray-100 px-1 rounded">{preset.value}</code>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Time Zone
        </label>
        <Input
          {...register('timeZone')}
          error={errors.timeZone?.message}
          placeholder="UTC"
          helperText="Timezone for the schedule (default: UTC)"
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
          Inactive schedules will not run automatically
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="Optional description for this schedule"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData?.id ? 'Update Schedule' : 'Create Schedule'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

