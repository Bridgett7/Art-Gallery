package com.metamuse.model;

import com.metamuse.enums.LessonLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lesson")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Lesson {

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "lesson_order")
    private Integer lessonOrder;

    private Integer duration;
}
