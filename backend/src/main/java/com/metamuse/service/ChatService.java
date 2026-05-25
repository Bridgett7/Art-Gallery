package com.metamuse.service;

import com.metamuse.enums.LessonLevel;
import com.metamuse.model.*;
import com.metamuse.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ArtworkRepository artworkRepository;
    private final EventRepository eventRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CourseRepository courseRepository;
    private final PlanningRepository planningRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Value("${app.chatbot.url:http://localhost:5000}")
    private String chatbotUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Process a chat message: call NLP service, enrich with data if needed, return response.
     */
    public Map<String, Object> processMessage(String message, String userId, String role) {
        // Get username
        String username = userRepository.findById(userId).map(u -> u.getUsername()).orElse("");

        // Step 1: Call NLP service for intent detection
        Map<String, Object> nlpRequest = new HashMap<>();
        nlpRequest.put("message", message);
        nlpRequest.put("userId", userId);
        nlpRequest.put("role", role);
        nlpRequest.put("username", username);

        Map<String, Object> nlpResponse = callNlpService(nlpRequest);

        // Step 2: If the intent needs data, fetch it and call again
        boolean needsData = Boolean.TRUE.equals(nlpResponse.get("needsData"));
        String dataType = (String) nlpResponse.get("dataType");

        if (needsData && dataType != null) {
            Map<String, Object> data = fetchDataForIntent(dataType, userId, role);
            nlpRequest.put("data", data);
            nlpResponse = callNlpService(nlpRequest);
        }

        return nlpResponse;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callNlpService(Map<String, Object> request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    chatbotUrl + "/chat/message",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return response.getBody() != null ? response.getBody() : defaultResponse();
        } catch (Exception e) {
            log.error("Failed to call chatbot service: {}", e.getMessage());
            return defaultResponse();
        }
    }

    private Map<String, Object> fetchDataForIntent(String dataType, String userId, String role) {
        Map<String, Object> data = new HashMap<>();

        switch (dataType) {
            case "list_artworks" -> {
                var items = artworkRepository.findAll().stream().limit(10).map(a -> Map.of(
                        "title", a.getTitle(),
                        "artist", a.getArtist() != null ? a.getArtist().getUsername() : "Unknown"
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "list_events" -> {
                var items = eventRepository.findUpcoming(java.time.LocalDate.now()).stream().limit(10).map(e -> Map.of(
                        "name", e.getName(),
                        "startDate", e.getStartDate() != null ? e.getStartDate().toString() : "",
                        "location", e.getLocation() != null ? e.getLocation() : ""
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "event_ongoing" -> {
                var items = eventRepository.findOngoing(java.time.LocalDate.now()).stream().limit(10).map(e -> Map.of(
                        "name", e.getName(),
                        "endDate", e.getEndDate() != null ? e.getEndDate().toString() : "",
                        "location", e.getLocation() != null ? e.getLocation() : ""
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "ticket_price" -> {
                var items = eventRepository.findAll().stream()
                        .filter(e -> e.getTicketPriceVisitor() != null)
                        .limit(5).map(e -> Map.of(
                                "name", e.getName(),
                                "ticketPriceVisitor", e.getTicketPriceVisitor().toString(),
                                "ticketPriceArtist", e.getTicketPriceArtist() != null ? e.getTicketPriceArtist().toString() : "N/A"
                        )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "order_status" -> {
                var items = orderRepository.findByUserIdNumber(userId).stream().limit(5).map(o -> Map.of(
                        "id", o.getId(),
                        "status", o.getStatus() != null ? o.getStatus().name() : "N/A",
                        "total", calculateOrderTotal(o)
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "list_products" -> {
                var items = productRepository.findAll().stream().limit(10).map(p -> Map.of(
                        "name", p.getName(),
                        "price", p.getPrice() != null ? p.getPrice() : 0,
                        "stock", p.getStock() != null ? p.getStock() : 0
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "list_courses" -> {
                var items = courseRepository.findAll().stream().limit(10).map(c -> Map.of(
                        "title", c.getTitle(),
                        "level", c.getLevel() != null ? c.getLevel().name() : "N/A",
                        "price", c.getPrice() != null ? c.getPrice() : 0,
                        "duration", c.getDuration() != null ? c.getDuration() : 0
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "course_beginner" -> {
                var items = courseRepository.findByLevel(LessonLevel.BEGINNER).stream().limit(5).map(c -> Map.of(
                        "title", c.getTitle(),
                        "price", c.getPrice() != null ? c.getPrice() : 0,
                        "duration", c.getDuration() != null ? c.getDuration() : 0
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "planning" -> {
                var items = planningRepository.findByStatus("SCHEDULED").stream().limit(5).map(p -> Map.of(
                        "course", p.getCourse() != null ? p.getCourse().getTitle() : "N/A",
                        "startTime", p.getStartTime() != null ? p.getStartTime().toString() : "",
                        "room", p.getRoom() != null ? p.getRoom() : "N/A"
                )).collect(Collectors.toList());
                data.put("items", items);
            }
            case "my_profile" -> {
                userRepository.findById(userId).ifPresent(user -> {
                    data.put("profile", Map.of(
                            "username", user.getUsername(),
                            "email", user.getEmail(),
                            "role", user.getRole().name()
                    ));
                });
            }
            case "my_notifications" -> {
                int count = notificationRepository.countByUserIdAndReadFalse(userId);
                data.put("count", count);
            }
            case "stats" -> {
                if ("ADMIN".equals(role)) {
                    data.put("stats", Map.of(
                            "totalRevenue", calculateTotalRevenue(),
                            "totalOrders", orderRepository.count(),
                            "totalEvents", eventRepository.count()
                    ));
                } else {
                    data.put("stats", Map.of());
                }
            }
            case "user_count" -> {
                if ("ADMIN".equals(role)) {
                    data.put("count", userRepository.count());
                } else {
                    data.put("count", 0);
                }
            }
        }

        return data;
    }

    private double calculateOrderTotal(Order order) {
        if (order.getItems() == null) return 0;
        return order.getItems().stream()
                .mapToDouble(i -> (i.getProduct() != null && i.getProduct().getPrice() != null ? i.getProduct().getPrice() : 0)
                        * (i.getQuantity() != null ? i.getQuantity() : 0))
                .sum();
    }

    private double calculateTotalRevenue() {
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == com.metamuse.enums.OrderStatus.DELIVERED)
                .mapToDouble(this::calculateOrderTotal)
                .sum();
    }

    private Map<String, Object> defaultResponse() {
        return Map.of(
                "intent", "unknown",
                "confidence", 0.0,
                "reply", "Désolé, le service de chat est temporairement indisponible. Réessayez plus tard.",
                "suggestions", List.of("❓ Aide")
        );
    }
}
