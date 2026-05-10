package com.metamuse.controller;

import com.metamuse.enums.EventStatus;
import com.metamuse.model.Event;
import com.metamuse.model.Ticket;
import com.metamuse.repository.TicketRepository;
import com.metamuse.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final TicketRepository ticketRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAll().stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(toDetailDto(eventService.findById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Map<String, Object>>> getUpcoming() {
        return ResponseEntity.ok(eventService.findUpcoming().stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/ongoing")
    public ResponseEntity<List<Map<String, Object>>> getOngoing() {
        return ResponseEntity.ok(eventService.findOngoing().stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> search(@RequestParam String q) {
        return ResponseEntity.ok(eventService.search(q).stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<List<Map<String, Object>>> getMyTickets(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        List<Ticket> tickets = ticketRepository.findByUserIdNumber(userId);
        return ResponseEntity.ok(tickets.stream().map(t -> {
            var dto = new HashMap<String, Object>();
            dto.put("id", t.getId());
            dto.put("ticketType", t.getTicketType());
            dto.put("price", t.getPrice());
            dto.put("event", toDto(t.getEvent()));
            return (Map<String, Object>) dto;
        }).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            Event event = eventService.createWithPermission(
                    (String) body.get("name"),
                    (String) body.get("theme"),
                    (String) body.get("description"),
                    (String) body.get("location"),
                    body.get("startDate") != null ? LocalDate.parse((String) body.get("startDate")) : null,
                    body.get("endDate") != null ? LocalDate.parse((String) body.get("endDate")) : null,
                    body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : null,
                    body.get("ticketPriceVisitor") != null ? new BigDecimal(body.get("ticketPriceVisitor").toString()) : null,
                    body.get("ticketPriceArtist") != null ? new BigDecimal(body.get("ticketPriceArtist").toString()) : null,
                    body.get("status") != null ? EventStatus.valueOf((String) body.get("status")) : null,
                    body.get("featured") != null && (Boolean) body.get("featured"),
                    userId,
                    body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null,
                    body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null,
                    (String) body.get("openingHours"),
                    null
            );
            return ResponseEntity.ok(toDto(event));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            Event updates = new Event();
            if (body.containsKey("name")) updates.setName((String) body.get("name"));
            if (body.containsKey("theme")) updates.setTheme((String) body.get("theme"));
            if (body.containsKey("description")) updates.setDescription((String) body.get("description"));
            if (body.containsKey("location")) updates.setLocation((String) body.get("location"));
            if (body.containsKey("openingHours")) updates.setOpeningHours((String) body.get("openingHours"));
            if (body.containsKey("startDate")) updates.setStartDate(LocalDate.parse((String) body.get("startDate")));
            if (body.containsKey("endDate")) updates.setEndDate(LocalDate.parse((String) body.get("endDate")));
            if (body.containsKey("capacity")) updates.setCapacity(body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : null);
            if (body.containsKey("ticketPriceVisitor")) updates.setTicketPriceVisitor(body.get("ticketPriceVisitor") != null ? new BigDecimal(body.get("ticketPriceVisitor").toString()) : null);
            if (body.containsKey("ticketPriceArtist")) updates.setTicketPriceArtist(body.get("ticketPriceArtist") != null ? new BigDecimal(body.get("ticketPriceArtist").toString()) : null);
            if (body.containsKey("status")) updates.setStatus(EventStatus.valueOf((String) body.get("status")));
            if (body.containsKey("featured")) updates.setFeatured((Boolean) body.get("featured"));

            Event event = eventService.updateWithPermission(id, updates, userId);
            return ResponseEntity.ok(toDto(event));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            eventService.deleteWithPermission(id, userId);
            return ResponseEntity.ok(Map.of("message", "Event deleted"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/tickets")
    public ResponseEntity<?> purchaseTicket(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        try {
            String ticketType = body.getOrDefault("ticketType", "VISITOR");
            Ticket ticket = eventService.purchaseTicket(id, userId, ticketType);
            return ResponseEntity.ok(Map.of("id", ticket.getId(), "ticketType", ticket.getTicketType(), "price", ticket.getPrice()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> toDto(Event e) {
        var dto = new HashMap<String, Object>();
        dto.put("id", e.getId());
        dto.put("name", e.getName());
        dto.put("theme", e.getTheme());
        dto.put("location", e.getLocation());
        dto.put("startDate", e.getStartDate() != null ? e.getStartDate().toString() : null);
        dto.put("endDate", e.getEndDate() != null ? e.getEndDate().toString() : null);
        dto.put("status", e.getStatus() != null ? e.getStatus().name() : null);
        dto.put("featured", e.isFeatured());
        dto.put("capacity", e.getCapacity());
        dto.put("ticketPriceVisitor", e.getTicketPriceVisitor());
        dto.put("ticketPriceArtist", e.getTicketPriceArtist());
        return dto;
    }

    private Map<String, Object> toDetailDto(Event e) {
        var dto = toDto(e);
        dto.put("description", e.getDescription());
        dto.put("openingHours", e.getOpeningHours());
        dto.put("latitude", e.getLatitude());
        dto.put("longitude", e.getLongitude());
        dto.put("formattedAddress", e.getFormattedAddress());
        dto.put("mapsLink", e.getMapsLink());
        dto.put("createdBy", e.getCreatedBy());
        dto.put("hasImage", e.getImage() != null);
        dto.put("ticketsSold", eventService.getTicketsSold(e.getId()));
        dto.put("revenue", eventService.getRevenue(e.getId()));
        return dto;
    }
}
