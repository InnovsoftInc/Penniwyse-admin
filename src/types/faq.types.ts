export interface Faq {
  id: number;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
  tags?: string[];
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqDto {
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  tags?: string[];
}

export interface UpdateFaqDto {
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  tags?: string[];
}

export interface FaqQueryParams {
  category?: string;
  isActive?: boolean;
  search?: string;
}

