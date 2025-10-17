export interface Quote {
  id: string;
  number: number;
  year: number;
  title: string;
  client: string;
  clientAddress: string;
  amount: number;
  date: string;
  createdAt: string;
}

export type QuoteFormData = Omit<Quote, 'id' | 'createdAt' | 'number' | 'year'>;
