package com.metamuse.controller;

import com.metamuse.enums.OrderStatus;
import com.metamuse.model.*;
import com.metamuse.repository.*;
import com.metamuse.service.InvoiceService;
import com.metamuse.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyOrders(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        List<Order> orders = orderRepository.findByUserIdNumber(userId);
        return ResponseEntity.ok(orders.stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return ResponseEntity.ok(orders.stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();

        User currentUser = userRepository.findById(userId).orElseThrow();
        if (!currentUser.getRole().name().equals("ADMIN") && !order.getUser().getIdNumber().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        return ResponseEntity.ok(toDetailDto(order));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveOrder(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Optional<Order> order = orderRepository.findByUserIdNumberAndStatus(userId, OrderStatus.PENDING);
        if (order.isPresent()) {
            return ResponseEntity.ok(toDetailDto(order.get()));
        }
        return ResponseEntity.ok(Map.of("message", "No active order"));
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        Order order = Order.builder()
                .user(user)
                .orderDate(LocalDate.now())
                .deliveryLocation((String) body.get("deliveryLocation"))
                .status(OrderStatus.PENDING)
                .build();

        orderRepository.save(order);
        return ResponseEntity.ok(toDto(order));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<?> addItem(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();
        if (!order.getUser().getIdNumber().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot modify a non-pending order"));
        }

        Long productId = ((Number) body.get("productId")).longValue();
        int quantity = body.get("quantity") != null ? ((Number) body.get("quantity")).intValue() : 1;

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return ResponseEntity.badRequest().body(Map.of("error", "Product not found"));
        if (product.getStock() != null && product.getStock() < quantity) {
            return ResponseEntity.badRequest().body(Map.of("error", "Insufficient stock"));
        }

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .quantity(quantity)
                .build();

        orderItemRepository.save(item);
        return ResponseEntity.ok(Map.of("message", "Item added"));
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    public ResponseEntity<?> removeItem(@PathVariable Long orderId, @PathVariable Long itemId, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();
        if (!order.getUser().getIdNumber().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        orderItemRepository.deleteById(itemId);
        return ResponseEntity.ok(Map.of("message", "Item removed"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        String newStatus = body.get("status");

        try {
            Order order = orderService.updateStatus(id, OrderStatus.valueOf(newStatus), userId);
            return ResponseEntity.ok(toDto(order));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/address")
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();
        if (!order.getUser().getIdNumber().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        order.setDeliveryLocation(body.get("deliveryLocation"));
        orderRepository.save(order);
        return ResponseEntity.ok(Map.of("message", "Address updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();

        User currentUser = userRepository.findById(userId).orElseThrow();
        if (!currentUser.getRole().name().equals("ADMIN") && !order.getUser().getIdNumber().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        orderRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Order deleted"));
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<?> downloadInvoice(@PathVariable Long id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();

        User currentUser = userRepository.findById(userId).orElseThrow();
        if (!currentUser.getRole().name().equals("ADMIN") && !order.getUser().getIdNumber().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        if (!invoiceService.invoiceExists(order)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invoice not yet generated"));
        }

        String filename = invoiceService.getInvoiceFilename(order);
        File file = invoiceService.getInvoiceFile(filename);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(new FileSystemResource(file));
    }

    @GetMapping("/{id}/invoice/status")
    public ResponseEntity<?> invoiceStatus(@PathVariable Long id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return ResponseEntity.notFound().build();

        boolean exists = invoiceService.invoiceExists(order);
        return ResponseEntity.ok(Map.of("available", exists));
    }

    private Map<String, Object> toDto(Order o) {
        var dto = new HashMap<String, Object>();
        dto.put("id", o.getId());
        dto.put("orderDate", o.getOrderDate() != null ? o.getOrderDate().toString() : null);
        dto.put("status", o.getStatus() != null ? o.getStatus().name() : null);
        dto.put("deliveryLocation", o.getDeliveryLocation());
        dto.put("user", o.getUser() != null ? Map.of("idNumber", o.getUser().getIdNumber(), "username", o.getUser().getUsername()) : null);
        dto.put("itemCount", o.getItems() != null ? o.getItems().size() : 0);
        dto.put("total", calculateTotal(o));
        return dto;
    }

    private Map<String, Object> toDetailDto(Order o) {
        var dto = toDto(o);
        dto.put("items", o.getItems() != null ? o.getItems().stream().map(item -> {
            var itemDto = new HashMap<String, Object>();
            itemDto.put("id", item.getId());
            itemDto.put("quantity", item.getQuantity());
            itemDto.put("product", item.getProduct() != null ? Map.of(
                    "id", item.getProduct().getId(),
                    "name", item.getProduct().getName(),
                    "price", item.getProduct().getPrice() != null ? item.getProduct().getPrice() : 0
            ) : null);
            return (Map<String, Object>) itemDto;
        }).collect(Collectors.toList()) : List.of());
        return dto;
    }

    private double calculateTotal(Order o) {
        if (o.getItems() == null) return 0;
        return o.getItems().stream()
                .mapToDouble(item -> (item.getProduct() != null && item.getProduct().getPrice() != null ? item.getProduct().getPrice() : 0) * (item.getQuantity() != null ? item.getQuantity() : 0))
                .sum();
    }
}
