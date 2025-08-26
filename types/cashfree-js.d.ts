// types/cashfree-js.d.ts
declare module '@cashfreepayments/cashfree-js' {
  export type CashfreeMode = 'sandbox' | 'production';

  export type CashfreeInstance = {
    checkout: (options: {
      paymentSessionId: string;
      // Cashfree calls it redirectTarget in docs
      redirectTarget?: '_self' | '_blank';
      // some SDK builds also accept returnUrl; keep optional
      returnUrl?: string;
    }) => Promise<void>;
  };

  export function load(opts: { mode: CashfreeMode }): Promise<CashfreeInstance>;
}
