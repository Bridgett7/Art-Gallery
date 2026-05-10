package com.metamuse.model;

import com.metamuse.enums.LessonLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "artist_id", length = 50)
    private String artistId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private LessonLevel level;

    private Double price;

    private Integer duration;
}
