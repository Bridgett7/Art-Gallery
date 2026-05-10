package com.metamuse.controller;

import com.metamuse.enums.OrderStatus;
import com.metamuse.enums.UserRole;
import com.metamuse.model.Order;
import com.metamuse.model.Ticket;
import com.metamuse.model.User;
import com.metamuse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final PlanningRepository planningRepository;
    private final ArtworkRepository artworkRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        User currentUser = userRepository.findById(userId).orElseThrow();
        UserRole role = currentUser.getRole();

        var stats = new HashMap<String, Object>();
        stats.put("role", role.name());

        switch (role) {
            case ADMIN -> buildAdminStats(stats);
            case ARTIST -> buildArtistStats(stats, userId);
            case VISITOR -> buildVisitorStats(stats, userId);
        }

        return ResponseEntity.ok(stats);
    }

    private void buildAdminStats(Map<String, Object> stats) {
        var allOrders = orderRepository.findAll();

        // Revenue
        double totalRevenue = calcRevenue(allOrders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED));
        double ticketRevenue = ticketRepository.findAll().stream()
                .mapToDouble(t -> t.getPrice() != null ? t.getPrice() : 0).sum();
        double predictedGains = calcRevenue(allOrders.stream().filter(o ->
                o.getStatus() == OrderStatus.PENDING || o.getStatus() == OrderStatus.CONFIRMED || o.getStatus() == OrderStatus.SHIPPED));

        // Orders by status
        stats.put("totalRevenue", totalRevenue + ticketRevenue);
        stats.put("predictedGains", predictedGains);
        stats.put("totalOrders", allOrders.size());
        stats.put("exhibitionRevenue", ticketRevenue);
        stats.put("pendingOrders", allOrders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count());
        stats.put("confirmedOrders", allOrders.stream().filter(o -> o.getStatus() == OrderStatus.CONFIRMED).count());
        stats.put("shippedOrders", allOrders.stream().filter(o -> o.getStatus() == OrderStatus.SHIPPED).count());
        stats.put("deliveredOrders", allOrders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count());
        stats.put("cancelledOrders", allOrders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count());

        // Products
        stats.put("totalProducts", productRepository.count());
        stats.put("productsSold", allOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .flatMap(o -> o.getItems() != null ? o.getItems().stream() : Stream.empty())
                .mapToLong(item -> item.getQuantity() != null ? item.getQuantity() : 0).sum());

        // Users
        stats.put("totalUsers", userRepository.count());

        // Events & Tickets
        stats.put("totalEvents", eventRepository.count());
        stats.put("totalTickets", ticketRepository.count());

        // Courses
        stats.put("totalCourses", courseRepository.count());
        stats.put("totalLessons", lessonRepository.count());
        stats.put("totalPlanning", planningRepository.count());
        stats.put("scheduledLessons", (long) planningRepository.findByStatus("SCHEDULED").size());
        stats.put("completedLessons", (long) planningRepository.findByStatus("COMPLETED").size());

        // Revenue trend (7 days)
        stats.put("revenueTrend", buildRevenueTrend(allOrders));
    }

    private void buildArtistStats(Map<String, Object> stats, String userId) {
        // My artworks
        long myArtworks = artworkRepository.findByArtistIdNumber(userId).size();
        stats.put("myArtworks", myArtworks);

        // My courses
        long myCourses = courseRepository.findAll().stream().filter(c -> userId.equals(c.getArtistId())).count();
        stats.put("myCourses", myCourses);

        // My orders (as buyer)
        var myOrders = orderRepository.findByUserIdNumber(userId);
        stats.put("totalOrders", myOrders.size());
        stats.put("pendingOrders", myOrders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count());
        stats.put("deliveredOrders", myOrders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count());
        stats.put("totalSpent", calcRevenue(myOrders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED)));

        // My tickets
        List<Ticket> myTickets = ticketRepository.findByUserIdNumber(userId);
        stats.put("myTickets", myTickets.size());
        stats.put("ticketSpent", myTickets.stream().mapToDouble(t -> t.getPrice() != null ? t.getPrice() : 0).sum());

        // Events I created
        long myEvents = eventRepository.findByCreatedBy(userId).size();
        stats.put("myEvents", myEvents);

        // Revenue trend (my orders)
        stats.put("revenueTrend", buildRevenueTrend(myOrders));
    }

    private void buildVisitorStats(Map<String, Object> stats, String userId) {
        // My orders
        var myOrders = orderRepository.findByUserIdNumber(userId);
        stats.put("totalOrders", myOrders.size());
        stats.put("pendingOrders", myOrders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count());
        stats.put("confirmedOrders", myOrders.stream().filter(o -> o.getStatus() == OrderStatus.CONFIRMED).count());
        stats.put("shippedOrders", myOrders.stream().filter(o -> o.getStatus() == OrderStatus.SHIPPED).count());
        stats.put("deliveredOrders", myOrders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count());
        stats.put("totalSpent", calcRevenue(myOrders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED)));

        // My tickets
        List<Ticket> myTickets = ticketRepository.findByUserIdNumber(userId);
        stats.put("myTickets", myTickets.size());
        stats.put("ticketSpent", myTickets.stream().mapToDouble(t -> t.getPrice() != null ? t.getPrice() : 0).sum());

        // Revenue trend (my spending)
        stats.put("revenueTrend", buildRevenueTrend(myOrders));
    }

    private double calcRevenue(Stream<Order> orders) {
        return orders
                .flatMap(o -> o.getItems() != null ? o.getItems().stream() : Stream.empty())
                .mapToDouble(item -> (item.getProduct() != null && item.getProduct().getPrice() != null
                        ? item.getProduct().getPrice() : 0) * (item.getQuantity() != null ? item.getQuantity() : 0))
                .sum();
    }

    private List<Map<String, Object>> buildRevenueTrend(List<Order> orders) {
        var allTickets = ticketRepository.findAll();
        var trend = new ArrayList<Map<String, Object>>();
        for (int i = 6; i >= 0; i--) {
            var date = LocalDate.now().minusDays(i);
            // Order revenue
            double dayOrderRevenue = orders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.DELIVERED && date.equals(o.getOrderDate()))
                    .flatMap(o -> o.getItems() != null ? o.getItems().stream() : Stream.empty())
                    .mapToDouble(item -> (item.getProduct() != null && item.getProduct().getPrice() != null
                            ? item.getProduct().getPrice() : 0) * (item.getQuantity() != null ? item.getQuantity() : 0))
                    .sum();
            // Ticket revenue
            double dayTicketRevenue = allTickets.stream()
                    .filter(t -> date.equals(t.getPurchaseDate()))
                    .mapToDouble(t -> t.getPrice() != null ? t.getPrice() : 0)
                    .sum();
            trend.add(Map.of("date", date.toString(), "revenue", dayOrderRevenue + dayTicketRevenue));
        }
        return trend;
    }
}
