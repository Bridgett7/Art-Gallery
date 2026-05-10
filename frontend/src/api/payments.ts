import api from './axios';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export const paymentsApi = {
  createOrderPayment: (orderId: number) => api.post<PaymentIntentResponse>(`/payments/orders/${orderId}/pay`),
  createTicketPayment: (eventId: number, price: number) => api.post<PaymentIntentResponse>('/payments/tickets', { eventId, price }),
  confirmPayment: (paymentIntentId: string) => api.post('/payments/confirm', { paymentIntentId }),
};
