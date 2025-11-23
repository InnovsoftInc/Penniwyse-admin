import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Input, Select, Button } from '../../ui';
import type { CreateMerchantMappingDto, UpdateMerchantDto, Merchant } from '../../../types/merchant.types';
import type { Category } from '../../../types/category.types';

const merchantSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required'),
  categoryId: z.number().min(1, 'Category is required'),
  confidence: z.number().min(0).max(1).optional(),
  domain: z.string().optional(),
  brandName: z.string().optional(),
  industry: z.string().optional(),
  logo: z.string().optional(),
});

type MerchantFormData = CreateMerchantMappingDto & UpdateMerchantDto;

interface MerchantFormProps {
  onSubmit: (data: MerchantFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Merchant>;
  categories?: Category[];
  isLoading?: boolean;
}

export function MerchantForm({
  onSubmit,
  onCancel,
  initialData,
  categories = [],
  isLoading = false,
}: MerchantFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logoBase64 || initialData?.logo || null
  );
  const [, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      merchantName: initialData?.merchantName || '',
      categoryId: initialData?.categoryId || 0,
      confidence: initialData?.confidence,
      domain: initialData?.domain || '',
      brandName: initialData?.brandName || '',
      industry: initialData?.industry || '',
      logo: initialData?.logoBase64 || initialData?.logo || '',
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setLogoFile(file);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setValue('logo', base64String);
      setValue('logoBase64', base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setValue('logo', '');
    setValue('logoBase64', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFormSubmit = async (data: MerchantFormData) => {
    // Ensure logo is set if preview exists
    if (logoPreview && !data.logo) {
      data.logo = logoPreview;
      data.logoBase64 = logoPreview;
    }
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Input
        label="Merchant Name"
        {...register('merchantName')}
        error={errors.merchantName?.message}
        required
      />

      <Select
        label="Category"
        options={[
          { value: '', label: 'Select a category' },
          ...categories.map((cat) => ({
            value: cat.id.toString(),
            label: `${cat.name} (${cat.type})`,
          })),
        ]}
        {...register('categoryId', { valueAsNumber: true })}
        error={errors.categoryId?.message}
        required
      />

      <Input
        label="Domain"
        placeholder="example.com"
        {...register('domain')}
        error={errors.domain?.message}
        helperText="Merchant website domain (without https://)"
      />

      <Input
        label="Brand Name"
        placeholder="Brand Name"
        {...register('brandName')}
        error={errors.brandName?.message}
        helperText="Official brand name if different from merchant name"
      />

      <Input
        label="Industry"
        placeholder="Food & Beverage"
        {...register('industry')}
        error={errors.industry?.message}
        helperText="Industry or business category"
      />

      <Input
        label="Confidence (0-1)"
        type="number"
        step="0.01"
        min="0"
        max="1"
        {...register('confidence', { valueAsNumber: true })}
        error={errors.confidence?.message}
        helperText="Confidence score between 0 and 1"
      />

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo
        </label>
        <div className="space-y-2">
          {logoPreview ? (
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-white rounded-lg border border-gray-200 p-2 flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Remove logo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Upload merchant logo</p>
              <p className="text-xs text-gray-500 mb-3">PNG, JPG up to 2MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
          {!logoPreview && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload-hidden"
            />
          )}
        </div>
        {logoPreview && (
          <p className="text-xs text-gray-500 mt-2">
            Logo will be saved as Base64. Click the X to remove.
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData?.id ? 'Update Merchant' : 'Create Merchant'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
