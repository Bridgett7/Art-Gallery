package com.metamuse.service;

import com.metamuse.enums.EventStatus;
import com.metamuse.model.*;
import com.metamuse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService implements IService<Event> {

    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public Event add(Event event) {
        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public Event update(Event event) {
        if (!eventRepository.existsById(event.getId())) {
            throw new RuntimeException("Event not found with id: " + event.getId());
        }
        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Event not found with id: " + id);
        }
        eventRepository.deleteById(id);
    }

    @Override
    public Event findById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        autoUpdateStatus(event);
        return event;
    }

    @Override
    public List<Event> getAll() {
        List<Event> events = eventRepository.findAll();
        events.forEach(this::autoUpdateStatus);
        return events;
    }

    // --- Business methods ---

    public List<Event> findUpcoming() {
        return eventRepository.findUpcoming(LocalDate.now());
    }

    public List<Event> findOngoing() {
        return eventRepository.findOngoing(LocalDate.now());
    }

    public List<Event> search(String keyword) {
        List<Event> events = eventRepository.search(keyword);
        events.forEach(this::autoUpdateStatus);
        return events;
    }

    /**
     * Auto-update event status based on current date.
     * PUBLISHED + startDate <= today <= endDate → ONGOING
     * PUBLISHED/ONGOING + endDate < today → COMPLETED
     */
    private void autoUpdateStatus(Event event) {
        if (event.getStatus() == null || event.getStartDate() == null || event.getEndDate() == null) return;
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.DRAFT) return;

        LocalDate today = LocalDate.now();
        EventStatus currentStatus = event.getStatus();
        EventStatus newStatus = currentStatus;

        if ((currentStatus == EventStatus.PUBLISHED || currentStatus == EventStatus.ONGOING)
                && today.isAfter(event.getEndDate())) {
            newStatus = EventStatus.COMPLETED;
        } else if (currentStatus == EventStatus.PUBLISHED
                && !today.isBefore(event.getStartDate()) && !today.isAfter(event.getEndDate())) {
            newStatus = EventStatus.ONGOING;
        }

        if (newStatus != currentStatus) {
            event.setStatus(newStatus);
            eventRepository.save(event);
        }
    }

    @Transactional
    public Event createWithPermission(String name, String theme, String description, String location,
                                      LocalDate startDate, LocalDate endDate, Integer capacity,
                                      BigDecimal ticketPriceVisitor, BigDecimal ticketPriceArtist,
                                      EventStatus status, boolean featured, String createdBy,
                                      Double latitude, Double longitude, String openingHours,
                                      MultipartFile imageFile) {
        User user = userRepository.findById(createdBy).orElseThrow();
        if (!user.getRole().name().equals("ADMIN") && !user.getRole().name().equals("ARTIST")) {
            throw new SecurityException("Only admins and artists can create events");
        }

        byte[] imageBytes = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try { imageBytes = imageFile.getBytes(); } catch (IOException e) {
                throw new RuntimeException("Failed to process image", e);
            }
        }

        Event event = Event.builder()
                .name(name).theme(theme).description(description).location(location)
                .startDate(startDate).endDate(endDate).capacity(capacity)
                .ticketPriceVisitor(ticketPriceVisitor).ticketPriceArtist(ticketPriceArtist)
                .status(status != null ? status : EventStatus.DRAFT)
                .featured(featured).createdBy(createdBy)
                .latitude(latitude).longitude(longitude).openingHours(openingHours)
                .image(imageBytes)
                .build();

        return add(event);
    }

    @Transactional
    public Event updateWithPermission(Long id, Event updates, String currentUserId) {
        Event event = findById(id);
        validatePermission(event, currentUserId);

        if (updates.getName() != null) event.setName(updates.getName());
        if (updates.getTheme() != null) event.setTheme(updates.getTheme());
        if (updates.getDescription() != null) event.setDescription(updates.getDescription());
        if (updates.getLocation() != null) event.setLocation(updates.getLocation());
        if (updates.getStartDate() != null) event.setStartDate(updates.getStartDate());
        if (updates.getEndDate() != null) event.setEndDate(updates.getEndDate());
        if (updates.getCapacity() != null) event.setCapacity(updates.getCapacity());
        if (updates.getTicketPriceVisitor() != null) event.setTicketPriceVisitor(updates.getTicketPriceVisitor());
        if (updates.getTicketPriceArtist() != null) event.setTicketPriceArtist(updates.getTicketPriceArtist());
        if (updates.getStatus() != null) event.setStatus(updates.getStatus());
        if (updates.getOpeningHours() != null) event.setOpeningHours(updates.getOpeningHours());

        return update(event);
    }

    @Transactional
    public void deleteWithPermission(Long id, String currentUserId) {
        Event event = findById(id);
        validatePermission(event, currentUserId);
        delete(id);
    }

    @Transactional
    public Ticket purchaseTicket(Long eventId, String userId, String ticketType) {
        Event event = findById(eventId);
        User user = userRepository.findById(userId).orElseThrow();

        if (event.getStatus() != EventStatus.PUBLISHED && event.getStatus() != EventStatus.ONGOING) {
            throw new RuntimeException("Event is not available for ticket purchase");
        }

        int ticketsSold = ticketRepository.countByEventId(eventId);
        if (event.getCapacity() != null && ticketsSold >= event.getCapacity()) {
            throw new RuntimeException("Event is sold out");
        }

        double price = "ARTIST".equals(ticketType) && event.getTicketPriceArtist() != null
                ? event.getTicketPriceArtist().doubleValue()
                : event.getTicketPriceVisitor() != null ? event.getTicketPriceVisitor().doubleValue() : 0;

        Ticket ticket = Ticket.builder()
                .user(user).event(event).ticketType(ticketType).price(price)
                .build();

        ticket = ticketRepository.save(ticket);

        notificationService.create(userId, "Ticket Purchased",
                "You purchased a ticket for: " + event.getName());

        return ticket;
    }

    public int getTicketsSold(Long eventId) {
        return ticketRepository.countByEventId(eventId);
    }

    public Double getRevenue(Long eventId) {
        return ticketRepository.getRevenueByEventId(eventId);
    }

    private void validatePermission(Event event, String userId) {
        User currentUser = userRepository.findById(userId).orElseThrow();
        if (!currentUser.getRole().name().equals("ADMIN") && !userId.equals(event.getCreatedBy())) {
            throw new SecurityException("Not authorized to modify this event");
        }
    }
}
