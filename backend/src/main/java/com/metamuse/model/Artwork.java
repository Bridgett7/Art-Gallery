package com.metamuse.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "artwork")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Artwork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "year")
    private Integer year;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] image;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "artist_id")
    private User artist;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "catalogue_id")
    private Catalogue catalogue;

    @Column(name = "for_sale")
    @Builder.Default
    private Boolean forSale = false;

    private Double price;

    private Integer stock;

    @Column(name = "product_id")
    private Long productId;
}
