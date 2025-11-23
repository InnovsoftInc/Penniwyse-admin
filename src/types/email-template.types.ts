export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  textContent?: string; // Plain text email body
  htmlContent?: string; // HTML email body
  body?: string; // Legacy alias for textContent
  bodyHtml?: string; // Legacy alias for htmlContent
  variables?: string[]; // Array of variable names like ['userName', 'amount', etc.]
  category?: string; // e.g., 'notification', 'transaction', 'reminder', etc.
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateDto {
  name: string;
  subject: string;
  textContent?: string; // Plain text email body
  htmlContent?: string; // HTML email body
  body?: string; // Legacy alias for textContent (for backward compatibility)
  bodyHtml?: string; // Legacy alias for htmlContent (for backward compatibility)
  variables?: string[];
  category?: string;
  isActive?: boolean;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  subject?: string;
  textContent?: string; // Plain text email body
  htmlContent?: string; // HTML email body
  body?: string; // Legacy alias for textContent (for backward compatibility)
  bodyHtml?: string; // Legacy alias for htmlContent (for backward compatibility)
  variables?: string[];
  category?: string;
  isActive?: boolean;
}

export interface EmailTemplateQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  isActive?: boolean;
  search?: string;
}

