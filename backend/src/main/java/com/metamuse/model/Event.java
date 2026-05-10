package com.metamuse.model;

import com.metamuse.enums.EventStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "event")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String theme;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String location;

    private Double latitude;
    private Double longitude;

    @Column(name = "formatted_address")
    private String formattedAddress;

    @Column(name = "maps_link")
    private String mapsLink;

    @Column(name = "opening_hours", length = 100)
    private String openingHours;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] image;

    private Integer capacity;

    @Column(name = "ticket_price_visitor", precision = 10, scale = 2)
    private BigDecimal ticketPriceVisitor;

    @Column(name = "ticket_price_artist", precision = 10, scale = 2)
    private BigDecimal ticketPriceArtist;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    @Builder.Default
    private boolean featured = false;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
