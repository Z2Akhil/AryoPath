declare module '@cashfreepayments/cashfree-js' {
    interface CashfreeLoadOptions {
        mode: 'sandbox' | 'production';
    }
    interface CheckoutOptions {
        paymentSessionId: string;
        redirectTarget?: '_modal' | '_self' | '_blank';
    }
    interface CheckoutResult {
        error?: { message: string; code?: string; type?: string };
        redirect?: boolean;
        paymentDetails?: Record<string, unknown>;
    }
    interface CashfreeInstance {
        checkout(options: CheckoutOptions): Promise<CheckoutResult>;
    }
    export function load(options: CashfreeLoadOptions): Promise<CashfreeInstance>;
}
