package com.metamuse.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "ticket")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(name = "ticket_type", length = 20)
    private String ticketType;

    private Double price;

    @Column(name = "payment_intent_id")
    private String paymentIntentId;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @PrePersist
    protected void onCreate() {
        if (purchaseDate == null) purchaseDate = LocalDate.now();
    }
}
