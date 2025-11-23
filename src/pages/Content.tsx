import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Search, Eye } from 'lucide-react';
import { Card, Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../components/ui';
import { EmailTemplateForm, EmailTemplatePreview, NotificationTemplateForm, FaqForm } from '../components/features/content';
import { emailTemplateService } from '../services/api/email-template.service';
import { notificationTemplateService } from '../services/api/notification-template.service';
import { faqService } from '../services/api/faq.service';
import type { EmailTemplate, CreateEmailTemplateDto, UpdateEmailTemplateDto } from '../types/email-template.types';
import type { NotificationTemplate, CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from '../types/notification-template.types';
import type { Faq, CreateFaqDto, UpdateFaqDto } from '../types/faq.types';

export function Content() {
  const [contentType, setContentType] = useState<'faq' | 'announcement' | 'email-templates' | 'notification-templates'>('email-templates');
  
  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('');
  const [isTemplateActionLoading, setIsTemplateActionLoading] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Notification templates state
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [isNotificationTemplatesLoading, setIsNotificationTemplatesLoading] = useState(true);
  const [isNotificationTemplateModalOpen, setIsNotificationTemplateModalOpen] = useState(false);
  const [editingNotificationTemplate, setEditingNotificationTemplate] = useState<NotificationTemplate | null>(null);
  const [notificationTemplateSearchTerm, setNotificationTemplateSearchTerm] = useState('');
  const [notificationTemplateTypeFilter, setNotificationTemplateTypeFilter] = useState<string>('');
  const [isNotificationTemplateActionLoading, setIsNotificationTemplateActionLoading] = useState(false);
  const [deletingNotificationTemplateName, setDeletingNotificationTemplateName] = useState<string | null>(null);
  
  // FAQ state
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isFaqsLoading, setIsFaqsLoading] = useState(true);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [faqSearchTerm, setFaqSearchTerm] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('');
  const [faqActiveFilter, setFaqActiveFilter] = useState<string>('all');
  const [isFaqActionLoading, setIsFaqActionLoading] = useState(false);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contentType === 'email-templates') {
      loadEmailTemplates();
    } else if (contentType === 'notification-templates') {
      loadNotificationTemplates();
    } else if (contentType === 'faq') {
      loadFaqs();
    }
  }, [contentType]);

  const loadEmailTemplates = async () => {
    try {
      setIsTemplatesLoading(true);
      setError(null);
      const response = await emailTemplateService.getTemplates({
        category: templateCategoryFilter || undefined,
      });
      // Handle different response formats
      let templates: EmailTemplate[] = [];
      if (Array.isArray(response)) {
        templates = response;
      } else if (response && typeof response === 'object' && 'templates' in response) {
        templates = Array.isArray((response as any).templates) ? (response as any).templates : [];
      } else if (response && typeof response === 'object' && 'items' in response) {
        templates = Array.isArray((response as any).items) ? (response as any).items : [];
      }
      setEmailTemplates(templates);
    } catch (err) {
      setError('Failed to load email templates');
      setEmailTemplates([]);
      console.error(err);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  const handleCreateTemplate = async (data: CreateEmailTemplateDto | UpdateEmailTemplateDto) => {
    try {
      setIsTemplateActionLoading(true);
      setError(null);
      if (editingTemplate) {
        await emailTemplateService.updateTemplate(editingTemplate.id, data);
      } else {
        await emailTemplateService.createTemplate(data as CreateEmailTemplateDto);
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      await loadEmailTemplates();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to save template';
      if (err?.isAuthError || err?.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(errorMessage);
      }
      console.error('Error saving template:', err);
      throw err;
    } finally {
      setIsTemplateActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email template? This action cannot be undone.')) return;
    try {
      setDeletingTemplateId(id);
      await emailTemplateService.deleteTemplate(id);
      await loadEmailTemplates();
    } catch (err) {
      setError('Failed to delete template');
      console.error(err);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const filteredTemplates = Array.isArray(emailTemplates) ? emailTemplates.filter((template) => {
    const matchesSearch = templateSearchTerm === '' || 
      template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      (template.category || '').toLowerCase().includes(templateSearchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  // Notification templates functions
  const loadNotificationTemplates = async () => {
    try {
      setIsNotificationTemplatesLoading(true);
      setError(null);
      const response = await notificationTemplateService.getTemplates({
        type: notificationTemplateTypeFilter || undefined,
      });
      let templates: NotificationTemplate[] = [];
      if (Array.isArray(response)) {
        templates = response;
      } else if (response && typeof response === 'object' && 'templates' in response) {
        templates = Array.isArray((response as any).templates) ? (response as any).templates : [];
      } else if (response && typeof response === 'object' && 'items' in response) {
        templates = Array.isArray((response as any).items) ? (response as any).items : [];
      }
      setNotificationTemplates(templates);
    } catch (err) {
      setError('Failed to load notification templates');
      setNotificationTemplates([]);
      console.error(err);
    } finally {
      setIsNotificationTemplatesLoading(false);
    }
  };

  const handleCreateNotificationTemplate = async (data: CreateNotificationTemplateDto | UpdateNotificationTemplateDto) => {
    try {
      setIsNotificationTemplateActionLoading(true);
      if (editingNotificationTemplate) {
        await notificationTemplateService.updateTemplate(editingNotificationTemplate.name, data);
      } else {
        await notificationTemplateService.createTemplate(data as CreateNotificationTemplateDto);
      }
      setIsNotificationTemplateModalOpen(false);
      setEditingNotificationTemplate(null);
      await loadNotificationTemplates();
    } catch (err) {
      throw err;
    } finally {
      setIsNotificationTemplateActionLoading(false);
    }
  };

  const handleDeleteNotificationTemplate = async (name: string) => {
    if (!confirm(`Are you sure you want to delete the notification template "${name}"? This action cannot be undone.`)) return;
    try {
      setDeletingNotificationTemplateName(name);
      await notificationTemplateService.deleteTemplate(name);
      await loadNotificationTemplates();
    } catch (err) {
      setError('Failed to delete notification template');
      console.error(err);
    } finally {
      setDeletingNotificationTemplateName(null);
    }
  };

  const filteredNotificationTemplates = Array.isArray(notificationTemplates) ? notificationTemplates.filter((template) => {
    const matchesSearch = notificationTemplateSearchTerm === '' || 
      template.name.toLowerCase().includes(notificationTemplateSearchTerm.toLowerCase()) ||
      (template.title || '').toLowerCase().includes(notificationTemplateSearchTerm.toLowerCase()) ||
      (template.body || '').toLowerCase().includes(notificationTemplateSearchTerm.toLowerCase()) ||
      (template.type || '').toLowerCase().includes(notificationTemplateSearchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const templateCategories = [
    'notification',
    'transaction',
    'reminder',
    'welcome',
    'password-reset',
    'billing',
    'alert',
    'other',
  ];

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

  const faqCategories = [
    { value: 'tax', label: 'Tax' },
    { value: 'billing', label: 'Billing' },
    { value: 'account', label: 'Account' },
    { value: 'general', label: 'General' },
    { value: 'support', label: 'Support' },
    { value: 'features', label: 'Features' },
    { value: 'payments', label: 'Payments' },
    { value: 'other', label: 'Other' },
  ];

  // FAQ functions
  const loadFaqs = async () => {
    try {
      setIsFaqsLoading(true);
      setError(null);
      const params: { category?: string; isActive?: boolean; search?: string } = {};
      if (faqCategoryFilter) {
        params.category = faqCategoryFilter;
      }
      if (faqActiveFilter !== 'all') {
        params.isActive = faqActiveFilter === 'active';
      }
      if (faqSearchTerm) {
        params.search = faqSearchTerm;
      }
      const response = await faqService.getFaqs(Object.keys(params).length > 0 ? params : undefined);
      let faqsList: Faq[] = [];
      if (Array.isArray(response)) {
        faqsList = response;
      } else if (response && typeof response === 'object' && 'faqs' in response) {
        faqsList = Array.isArray((response as any).faqs) ? (response as any).faqs : [];
      } else if (response && typeof response === 'object' && 'items' in response) {
        faqsList = Array.isArray((response as any).items) ? (response as any).items : [];
      }
      setFaqs(faqsList);
    } catch (err) {
      setError('Failed to load FAQs');
      setFaqs([]);
      console.error(err);
    } finally {
      setIsFaqsLoading(false);
    }
  };

  const handleCreateFaq = async (data: CreateFaqDto | UpdateFaqDto) => {
    try {
      setIsFaqActionLoading(true);
      setError(null);
      if (editingFaq) {
        await faqService.updateFaq(editingFaq.id, data);
      } else {
        await faqService.createFaq(data as CreateFaqDto);
      }
      setIsFaqModalOpen(false);
      setEditingFaq(null);
      await loadFaqs();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to save FAQ';
      if (err?.isAuthError || err?.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(errorMessage);
      }
      console.error('Error saving FAQ:', err);
      throw err;
    } finally {
      setIsFaqActionLoading(false);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) return;
    try {
      setDeletingFaqId(id);
      await faqService.deleteFaq(id);
      await loadFaqs();
    } catch (err) {
      setError('Failed to delete FAQ');
      console.error(err);
    } finally {
      setDeletingFaqId(null);
    }
  };

  const filteredFaqs = Array.isArray(faqs) ? faqs.filter((faq) => {
    const matchesSearch = faqSearchTerm === '' || 
      faq.question.toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
      (faq.category || '').toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
      (Array.isArray(faq.tags) && faq.tags.some(tag => tag.toLowerCase().includes(faqSearchTerm.toLowerCase())));
    return matchesSearch;
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage FAQs, announcements, and email templates</p>
        </div>
        {contentType === 'email-templates' && (
          <Button onClick={() => {
            setEditingTemplate(null);
            setIsTemplateModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Email Template
          </Button>
        )}
        {contentType === 'notification-templates' && (
          <Button onClick={() => {
            setEditingNotificationTemplate(null);
            setIsNotificationTemplateModalOpen(true);
          }}>
          <Plus className="w-4 h-4 mr-2" />
            Add Notification Template
        </Button>
        )}
        {contentType === 'faq' && (
          <Button onClick={() => {
            setEditingFaq(null);
            setIsFaqModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
        </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {['faq', 'email-templates', 'notification-templates', 'announcement'].map((type) => {
          const isDisabled = type === 'announcement';
          return (
          <button
            key={type}
              onClick={() => !isDisabled && setContentType(type as typeof contentType)}
              disabled={isDisabled}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                isDisabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed opacity-50'
                  : contentType === type
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {type === 'email-templates' ? 'Email Templates' : 
             type === 'notification-templates' ? 'Notification Templates' :
               type === 'faq' ? 'FAQs' :
             type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
          );
        })}
      </div>

      {/* Email Templates Tab */}
      {contentType === 'email-templates' && (
        <Card title="Email Templates">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search templates..."
                value={templateSearchTerm}
                onChange={(e) => setTemplateSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={templateCategoryFilter}
              onChange={(e) => {
                setTemplateCategoryFilter(e.target.value);
                loadEmailTemplates();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {templateCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadEmailTemplates}
              disabled={isTemplatesLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isTemplatesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Table isLoading={isTemplatesLoading} emptyMessage="No email templates found">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {template.category || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={template.subject}>
                    {template.subject}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(template.variables) && template.variables.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {variable}
                          </span>
                        ))}
                        {template.variables.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{template.variables.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${
                      template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviewTemplate(template);
                          setIsPreviewModalOpen(true);
                        }}
                        title="Preview template"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsTemplateModalOpen(true);
                        }}
                        title="Edit template"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        isLoading={deletingTemplateId === template.id}
                        disabled={deletingTemplateId === template.id}
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Notification Templates Tab */}
      {contentType === 'notification-templates' && (
        <Card title="Notification Templates">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search templates..."
                value={notificationTemplateSearchTerm}
                onChange={(e) => setNotificationTemplateSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={notificationTemplateTypeFilter}
              onChange={(e) => {
                setNotificationTemplateTypeFilter(e.target.value);
                loadNotificationTemplates();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadNotificationTemplates}
              disabled={isNotificationTemplatesLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isNotificationTemplatesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Table isLoading={isNotificationTemplatesLoading} emptyMessage="No notification templates found">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Body</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotificationTemplates.map((template) => (
                <TableRow key={template.name}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {template.type || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={template.title || ''}>
                    {template.title || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={template.body || ''}>
                    {template.body || '-'}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {template.platform || 'all'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                      {template.priority || 'default'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(template.variables) && template.variables.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {variable}
                          </span>
                        ))}
                        {template.variables.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{template.variables.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${
                      template.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {template.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNotificationTemplate(template);
                          setIsNotificationTemplateModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotificationTemplate(template.name)}
                        isLoading={deletingNotificationTemplateName === template.name}
                        disabled={deletingNotificationTemplateName === template.name}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* FAQ Tab */}
      {contentType === 'faq' && (
        <Card title="FAQs">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={faqSearchTerm}
                onChange={(e) => setFaqSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={faqCategoryFilter}
              onChange={(e) => {
                setFaqCategoryFilter(e.target.value);
                loadFaqs();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {faqCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={faqActiveFilter}
              onChange={(e) => {
                setFaqActiveFilter(e.target.value);
                loadFaqs();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadFaqs}
              disabled={isFaqsLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isFaqsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Table isLoading={isFaqsLoading} emptyMessage="No FAQs found">
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="font-medium max-w-xs">{faq.question}</TableCell>
                  <TableCell className="max-w-xs">
                    <span title={faq.answer} className="truncate block">
                      {faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}...` : faq.answer}
                    </span>
                  </TableCell>
                  <TableCell>
                    {faq.category ? (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {faqCategories.find(c => c.value === faq.category)?.label || faq.category}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell>{faq.order}</TableCell>
                  <TableCell>
                    {Array.isArray(faq.tags) && faq.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {faq.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {tag}
                          </span>
                        ))}
                        {faq.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{faq.tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${
                      faq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span title="Views">{faq.views}</span>
                      {faq.helpfulCount > 0 && (
                        <span className="text-green-600" title="Helpful">✓{faq.helpfulCount}</span>
                      )}
                      {faq.notHelpfulCount > 0 && (
                        <span className="text-red-600" title="Not Helpful">✗{faq.notHelpfulCount}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingFaq(faq);
                          setIsFaqModalOpen(true);
                        }}
                        title="Edit FAQ"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFaq(faq.id)}
                        isLoading={deletingFaqId === faq.id}
                        disabled={deletingFaqId === faq.id}
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Other content types */}
      {contentType !== 'email-templates' && contentType !== 'notification-templates' && contentType !== 'faq' && (
      <Card title={`${contentType.charAt(0).toUpperCase() + contentType.slice(1)}s`}>
        <div className="text-gray-600">
          {contentType} management interface coming soon...
        </div>
      </Card>
      )}

      {/* Email Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        title={editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
        size="xl"
      >
        <EmailTemplateForm
          onSubmit={handleCreateTemplate}
          onCancel={() => {
            setIsTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          initialData={editingTemplate || undefined}
          isLoading={isTemplateActionLoading}
        />
      </Modal>

      {/* Email Template Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewTemplate(null);
        }}
        title={`Preview: ${previewTemplate?.name || 'Email Template'}`}
        size="xl"
      >
        {previewTemplate && <EmailTemplatePreview template={previewTemplate} />}
      </Modal>

      {/* Notification Template Modal */}
      <Modal
        isOpen={isNotificationTemplateModalOpen}
        onClose={() => {
          setIsNotificationTemplateModalOpen(false);
          setEditingNotificationTemplate(null);
        }}
        title={editingNotificationTemplate ? 'Edit Notification Template' : 'Create Notification Template'}
        size="xl"
      >
        <NotificationTemplateForm
          onSubmit={handleCreateNotificationTemplate}
          onCancel={() => {
            setIsNotificationTemplateModalOpen(false);
            setEditingNotificationTemplate(null);
          }}
          initialData={editingNotificationTemplate || undefined}
          isLoading={isNotificationTemplateActionLoading}
        />
      </Modal>

      {/* FAQ Modal */}
      <Modal
        isOpen={isFaqModalOpen}
        onClose={() => {
          setIsFaqModalOpen(false);
          setEditingFaq(null);
        }}
        title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
        size="xl"
      >
        <FaqForm
          onSubmit={handleCreateFaq}
          onCancel={() => {
            setIsFaqModalOpen(false);
            setEditingFaq(null);
          }}
          initialData={editingFaq || undefined}
          isLoading={isFaqActionLoading}
        />
      </Modal>
    </div>
  );
}
