export interface Quote {
  id: string;
  title: string;
  client: string;
  amount: number;
  date: string;
  createdAt: string;
}

export type QuoteFormData = Omit<Quote, 'id' | 'createdAt'>;
