/** Hueco para ARCA. Hoy no se factura. */
export type InvoiceRequest = { paymentId: string; amountCents: number };

export interface InvoiceIssuer {
  onApproved(payment: InvoiceRequest): Promise<'not_required'>;
}

export const noopInvoiceIssuer: InvoiceIssuer = {
  async onApproved() {
    return 'not_required';
  },
};
