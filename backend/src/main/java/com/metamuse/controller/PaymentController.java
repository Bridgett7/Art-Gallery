package com.metamuse.controller;

import com.metamuse.service.OrderService;
import com.metamuse.service.StripePaymentService;
import com.metamuse.model.Order;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final StripePaymentService stripePaymentService;
    private final OrderService orderService;

    /**
     * Create a payment intent for an order.
     */
    @PostMapping("/orders/{orderId}/pay")
    public ResponseEntity<?> createOrderPayment(@PathVariable Long orderId, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderService.findById(orderId);

        if (!order.getUser().getIdNumber().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        double total = orderService.calculateTotal(order);
        if (total <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Order total must be greater than 0"));
        }

        Map<String, String> result = stripePaymentService.createOrderPayment(orderId, total, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * Create a payment intent for a ticket.
     */
    @PostMapping("/tickets")
    public ResponseEntity<?> createTicketPayment(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Long eventId = ((Number) body.get("eventId")).longValue();
        double price = ((Number) body.get("price")).doubleValue();

        Map<String, String> result = stripePaymentService.createTicketPayment(eventId, price, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * Confirm a payment (webhook alternative for testing).
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, String> body) {
        String paymentIntentId = body.get("paymentIntentId");
        var intent = stripePaymentService.confirmPayment(paymentIntentId);
        return ResponseEntity.ok(Map.of("status", intent.getStatus()));
    }
}
