export interface NotificationTemplate {
  id?: number;
  name: string;
  title?: string;
  body?: string;
  type: string;
  variables?: string[];
  platform?: 'ios' | 'android' | 'all';
  priority?: 'default' | 'normal' | 'high' | 'low';
  sound?: string;
  badge?: number;
  channelId?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationTemplateDto {
  name: string;
  title?: string;
  body?: string;
  type: string;
  variables?: string[];
  platform?: 'ios' | 'android' | 'all';
  priority?: 'default' | 'normal' | 'high' | 'low';
  sound?: string;
  badge?: number;
  channelId?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateNotificationTemplateDto {
  title?: string;
  body?: string;
  type?: string;
  variables?: string[];
  platform?: 'ios' | 'android' | 'all';
  priority?: 'default' | 'normal' | 'high' | 'low';
  sound?: string;
  badge?: number;
  channelId?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface NotificationTemplateQueryParams {
  type?: string;
  platform?: 'ios' | 'android' | 'all';
  isActive?: boolean;
}

