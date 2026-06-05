package com.metamuse.service;

import com.metamuse.enums.OrderStatus;
import com.metamuse.model.*;
import com.metamuse.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class OrderService implements IService<Order> {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final InvoiceService invoiceService;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository,
                        NotificationService notificationService,
                        @org.springframework.context.annotation.Lazy InvoiceService invoiceService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.invoiceService = invoiceService;
    }

    @Override
    @Transactional
    public Order add(Order order) {
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public Order update(Order order) {
        if (!orderRepository.existsById(order.getId())) {
            throw new RuntimeException("Order not found with id: " + order.getId());
        }
        return orderRepository.save(order);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Order not found with id: " + id);
        }
        orderRepository.deleteById(id);
    }

    @Override
    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    @Override
    public List<Order> getAll() {
        return orderRepository.findAll();
    }

    // --- Business methods ---

    public List<Order> findByUser(String userId) {
        return orderRepository.findByUserIdNumber(userId);
    }

    public Order getActiveOrder(String userId) {
        return orderRepository.findByUserIdNumberAndStatus(userId, OrderStatus.PENDING).orElse(null);
    }

    /**
     * Auto-progress orders based on time:
     * CONFIRMED for 2+ days → SHIPPED
     * SHIPPED for 3+ days → DELIVERED
     */
    @Transactional
    public void autoProgressOrders() {
        LocalDate today = LocalDate.now();
        List<Order> confirmed = orderRepository.findByStatus(OrderStatus.CONFIRMED);
        for (Order order : confirmed) {
            if (order.getOrderDate() != null && order.getOrderDate().plusDays(2).isBefore(today)) {
                order.setStatus(OrderStatus.SHIPPED);
                orderRepository.save(order);
                notificationService.create(order.getUser().getIdNumber(), "Order Shipped",
                        "Your order #" + order.getId() + " has been shipped! 🚚");
            }
        }

        List<Order> shipped = orderRepository.findByStatus(OrderStatus.SHIPPED);
        for (Order order : shipped) {
            if (order.getOrderDate() != null && order.getOrderDate().plusDays(5).isBefore(today)) {
                order.setStatus(OrderStatus.DELIVERED);
                orderRepository.save(order);
                notificationService.create(order.getUser().getIdNumber(), "Order Delivered",
                        "Your order #" + order.getId() + " has been delivered! ✅");
            }
        }
    }

    @Transactional
    public Order createForUser(String userId, String deliveryLocation) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = Order.builder()
                .user(user)
                .orderDate(LocalDate.now())
                .deliveryLocation(deliveryLocation)
                .status(OrderStatus.PENDING)
                .build();

        return add(order);
    }

    @Transactional
    public OrderItem addItem(Long orderId, Long productId, int quantity, String userId) {
        Order order = findById(orderId);
        validateOwnership(order, userId);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new RuntimeException("Cannot modify a non-pending order");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getStock() != null && product.getStock() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        OrderItem item = OrderItem.builder()
                .order(order).product(product).quantity(quantity)
                .build();

        return orderItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long orderId, Long itemId, String userId) {
        Order order = findById(orderId);
        validateOwnership(order, userId);
        orderItemRepository.deleteById(itemId);
    }

    @Transactional
    public Order updateStatus(Long orderId, OrderStatus newStatus, String userId) {
        Order order = findById(orderId);
        User currentUser = userRepository.findById(userId).orElseThrow();

        if (!currentUser.getRole().name().equals("ADMIN")) {
            if (!order.getUser().getIdNumber().equals(userId) || newStatus != OrderStatus.CANCELLED) {
                throw new SecurityException("Not authorized to change order status");
            }
        }

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);
        order = update(order);

        notificationService.create(order.getUser().getIdNumber(), "Order Status Updated",
                "Your order #" + order.getId() + " status changed from " + oldStatus + " to " + newStatus);

        // Generate invoice when confirmed
        if (newStatus == OrderStatus.CONFIRMED && oldStatus == OrderStatus.PENDING) {
            // Reload order with items to ensure they're available for PDF generation
            Order freshOrder = orderRepository.findById(order.getId()).orElse(order);
            String invoiceFile = invoiceService.generateInvoice(freshOrder);
            notificationService.create(freshOrder.getUser().getIdNumber(), "Invoice Ready",
                    "Your invoice for order #" + freshOrder.getId() + " is ready. Download: " + invoiceFile);
            decreaseStock(freshOrder);
        }

        return order;
    }

    @Transactional
    public void updateDeliveryLocation(Long orderId, String deliveryLocation, String userId) {
        Order order = findById(orderId);
        validateOwnership(order, userId);
        order.setDeliveryLocation(deliveryLocation);
        update(order);
    }

    @Transactional
    public void deleteWithPermission(Long orderId, String userId) {
        Order order = findById(orderId);
        User currentUser = userRepository.findById(userId).orElseThrow();

        if (!currentUser.getRole().name().equals("ADMIN") && !order.getUser().getIdNumber().equals(userId)) {
            throw new SecurityException("Not authorized to delete this order");
        }

        delete(orderId);
    }

    public double calculateTotal(Order order) {
        if (order.getItems() == null) return 0;
        return order.getItems().stream()
                .mapToDouble(item -> (item.getProduct() != null && item.getProduct().getPrice() != null
                        ? item.getProduct().getPrice() : 0) * (item.getQuantity() != null ? item.getQuantity() : 0))
                .sum();
    }

    private void validateOwnership(Order order, String userId) {
        if (!order.getUser().getIdNumber().equals(userId)) {
            throw new SecurityException("Not authorized to access this order");
        }
    }

    private void decreaseStock(Order order) {
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product.getStock() != null) {
                    product.setStock(product.getStock() - item.getQuantity());
                    productRepository.save(product);
                }
            }
        }
    }
}
