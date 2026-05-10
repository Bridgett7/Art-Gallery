package com.metamuse.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripePaymentService {

    @Value("${app.stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${app.stripe.currency:eur}")
    private String currency;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    /**
     * Create a PaymentIntent for a given amount (in cents).
     */
    public Map<String, String> createPaymentIntent(long amountInCents, String description, Map<String, String> metadata) {
        try {
            PaymentIntentCreateParams.Builder builder = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(currency)
                    .setDescription(description)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true).build()
                    );

            if (metadata != null) {
                metadata.forEach(builder::putMetadata);
            }

            PaymentIntent intent = PaymentIntent.create(builder.build());

            log.info("PaymentIntent created: {}", intent.getId());
            return Map.of(
                    "clientSecret", intent.getClientSecret(),
                    "paymentIntentId", intent.getId()
            );
        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage());
            throw new RuntimeException("Payment processing failed: " + e.getMessage(), e);
        }
    }

    /**
     * Create a payment intent for an order.
     */
    public Map<String, String> createOrderPayment(Long orderId, double totalAmount, String userId) {
        long amountInCents = Math.round(totalAmount * 100);
        return createPaymentIntent(amountInCents, "Order #" + orderId,
                Map.of("orderId", orderId.toString(), "userId", userId));
    }

    /**
     * Create a payment intent for a ticket purchase.
     */
    public Map<String, String> createTicketPayment(Long eventId, double price, String userId) {
        long amountInCents = Math.round(price * 100);
        return createPaymentIntent(amountInCents, "Ticket for event #" + eventId,
                Map.of("eventId", eventId.toString(), "userId", userId));
    }

    /**
     * Confirm a payment intent (for server-side confirmation).
     */
    public PaymentIntent confirmPayment(String paymentIntentId) {
        try {
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
            if ("requires_confirmation".equals(intent.getStatus())) {
                intent = intent.confirm();
            }
            return intent;
        } catch (StripeException e) {
            log.error("Failed to confirm payment: {}", e.getMessage());
            throw new RuntimeException("Payment confirmation failed", e);
        }
    }
}
