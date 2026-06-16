export type PaymentEventType = "payment.completed.v1" | "payment.failed.v1";

export interface PaymentEventV1 {
  eventId: string;
  eventType: PaymentEventType;
  occurredAt: string;
  correlationId: string;
  paymentIntentId: string;
  holdId: string;
  seatId: string;
  userId: string;
  amountCents: number;
}

export interface SeatDto {
  id: string;
  label: string;
  status: "available" | "held" | "reserved";
  heldByUserId?: string;
  holdId?: string;
  holdExpiresAt?: string;
  reservedByUserId?: string;
}

export interface AuthUser {
  userId: string;
  email: string;
}

export const PAYMENT_EVENTS_EXCHANGE = "payment.events";
export const PAYMENT_EVENTS_QUEUE = "payment.events.seat-worker";
